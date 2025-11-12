"use server";

import { headers } from "next/headers";
import {
  checkPasswordResetRateLimitRedis as checkPasswordResetRateLimit,
  recordPasswordResetAttemptRedis as recordPasswordResetAttempt,
} from "@/lib/rate-limit-redis";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generatePasswordResetToken } from "@/lib/password-reset-token";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordSchema } from "@/lib/validations/auth";

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

export async function forgotPasswordAction(data: z.infer<typeof forgotPasswordSchema>) {
  try {
    const validated = forgotPasswordSchema.parse(data);
    const ipAddress = await getClientIP();

    // Vérifier le rate limit
    const rateLimit = await checkPasswordResetRateLimit(validated.email, ipAddress);
    if (!rateLimit.allowed) {
      const message =
        rateLimit.reason === "ip"
          ? "Trop de tentatives depuis cette adresse IP. Veuillez réessayer dans quelques instants."
          : "Trop de tentatives pour cet email. Veuillez réessayer dans quelques instants.";

      return {
        success: false,
        error: "Rate limit dépassé",
        message,
        resetAt: rateLimit.resetAt,
        status: 429,
      };
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      await recordPasswordResetAttempt(validated.email, ipAddress);
      return {
        success: true,
        message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
      };
    }

    if (!user.emailVerified) {
      await recordPasswordResetAttempt(validated.email, ipAddress);
      return {
        success: true,
        message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
      };
    }

    await recordPasswordResetAttempt(user.email, ipAddress);
    const resetToken = await generatePasswordResetToken(user.email);

    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken.token);
    } catch (emailError) {
      await prisma.verificationToken.delete({
        where: { id: resetToken.id },
      });
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      return {
        success: false,
        error: "Erreur lors de l'envoi de l'email",
        message: "Impossible d'envoyer l'email de réinitialisation. Veuillez réessayer plus tard.",
      };
    }

    return {
      success: true,
      message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation échouée",
        message: error.issues[0]?.message || "Données invalides",
        errors: error.issues,
      };
    }

    console.error("Erreur forgot-password:", error);
    return {
      success: false,
      error: "Erreur serveur",
      message: "Une erreur est survenue. Veuillez réessayer plus tard.",
    };
  }
}

