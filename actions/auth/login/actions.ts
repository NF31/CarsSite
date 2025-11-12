"use server";

import { headers } from "next/headers";
import { signIn } from "@/auth";
import {
  checkLoginRateLimitRedis as checkLoginRateLimit,
  recordLoginAttemptRedis as recordLoginAttempt,
} from "@/lib/rate-limit-redis";
import {
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts,
} from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Extrait l'adresse IP réelle du client depuis les headers
 */
async function getClientIP(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip: string) => ip.trim());
    return ips[0] || "unknown";
  }

  const realIp = headersList.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfConnectingIP = headersList.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return "unknown";
}

export async function loginAction(data: { email: string; password: string; rememberMe?: boolean }) {
  try {
    const { email, password, rememberMe } = data;

    if (!email || !password) {
      return {
        success: false,
        error: "Identifiants incorrects",
      };
    }

    const ipAddress = await getClientIP();

    // Vérifier le rate limit
    const rateLimit = await checkLoginRateLimit(email, ipAddress);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: "Trop de tentatives. Veuillez réessayer dans quelques instants.",
        resetAt: rateLimit.resetAt,
        status: 429,
      };
    }

    // Vérifier si l'utilisateur existe (exclure les comptes supprimés)
    // Note: Utilisation de $queryRaw pour contourner le problème de type Prisma avec deletedAt
    const users = await prisma.$queryRaw<Array<{
      id: string;
      password: string;
      emailVerified: Date | null;
      lockedUntil: Date | null;
      failedLoginAttempts: number;
      deletedAt: Date | null;
    }>>`
      SELECT id, password, "emailVerified", "lockedUntil", "failedLoginAttempts", "deletedAt"
      FROM users
      WHERE email = ${email} AND "deletedAt" IS NULL
      LIMIT 1
    `;

    const user = users[0] || null;

    if (!user || !user.password) {
      await recordLoginAttempt(email, ipAddress);
      return {
        success: false,
        error: "Identifiants incorrects",
        status: 401,
      };
    }

    // Vérifier si le compte est verrouillé
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (60 * 1000)
      );
      return {
        success: false,
        error: `Compte temporairement verrouillé. Réessayez dans ${minutesRemaining} minute(s).`,
        status: 423,
      };
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await incrementFailedLoginAttempts(user.id);
      await recordLoginAttempt(email, ipAddress);
      return {
        success: false,
        error: "Identifiants incorrects",
        status: 401,
      };
    }

    // Vérifier si l'email est vérifié
    if (!user.emailVerified) {
      await recordLoginAttempt(email, ipAddress);
      return {
        success: false,
        error: "Identifiants incorrects",
        status: 401,
      };
    }

    // Réinitialiser les échecs
    await resetFailedLoginAttempts(user.id);

    // Créer la session
    const result = await signIn("credentials", {
      email,
      password,
      rememberMe,
      redirect: false,
    });

    if (result?.error) {
      await recordLoginAttempt(email, ipAddress);
      return {
        success: false,
        error: "Identifiants incorrects",
        status: 401,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez réessayer.",
      status: 500,
    };
  }
}

