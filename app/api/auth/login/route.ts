import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/auth";
import { checkLoginRateLimit, recordLoginAttempt, isAccountLocked, incrementFailedLoginAttempts, resetFailedLoginAttempts } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

/**
 * Extrait l'adresse IP réelle du client depuis les headers
 */
function getClientIP(request: NextRequest): string {
  // Vérifier les headers proxy courants
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Prendre la première IP (celle du client original)
    const ips = forwarded.split(",").map((ip) => ip.trim());
    return ips[0] || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return request.ip || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 400 }
      );
    }

    // Récupérer l'adresse IP du client
    const ipAddress = getClientIP(request);

    // Vérifier le rate limit AVANT toute autre opération (par email ET par IP)
    const rateLimit = await checkLoginRateLimit(email, ipAddress);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Trop de tentatives. Veuillez réessayer dans quelques instants.",
          resetAt: rateLimit.resetAt,
        },
        { status: 429 }
      );
    }

    // Vérifier si l'utilisateur existe (exclure les comptes supprimés)
    const user = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null, // Exclure les comptes supprimés
      },
      select: {
        id: true,
        password: true,
        emailVerified: true,
        lockedUntil: true,
        failedLoginAttempts: true,
      },
    });

    // Toujours retourner le même message d'erreur pour éviter l'énumération d'emails
    // Ne pas révéler si l'email existe ou non
    if (!user || !user.password) {
      // Enregistrer la tentative même si l'utilisateur n'existe pas (pour le rate limiting)
      await recordLoginAttempt(email, ipAddress);
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    // Vérifier si le compte est verrouillé
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (60 * 1000)
      );
      return NextResponse.json(
        {
          error: `Compte temporairement verrouillé. Réessayez dans ${minutesRemaining} minute(s).`,
        },
        { status: 423 } // 423 Locked
      );
    }

    // Vérifier le mot de passe
    const bcrypt = await import("bcryptjs");
    const isPasswordValid = await bcrypt.default.compare(password, user.password);

    if (!isPasswordValid) {
      // Incrémenter les échecs de connexion
      await incrementFailedLoginAttempts(user.id);
      // Enregistrer la tentative pour le rate limiting
      await recordLoginAttempt(email, ipAddress);
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    // Si le mot de passe est correct mais l'email n'est pas vérifié
    // Ne pas révéler cette information pour éviter l'énumération
    // Retourner le même message que pour des identifiants incorrects
    if (!user.emailVerified) {
      // Enregistrer la tentative pour le rate limiting
      await recordLoginAttempt(email, ipAddress);
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    // Réinitialiser les échecs de connexion après une connexion réussie
    await resetFailedLoginAttempts(user.id);

    // La vérification du mot de passe est déjà faite, on peut directement créer la session
    // Appeler NextAuth signIn pour créer la session
    const result = await signIn("credentials", {
      email,
      password,
      rememberMe,
      redirect: false,
    });

    if (result?.error) {
      // En cas d'erreur inattendue, enregistrer quand même la tentative
      await recordLoginAttempt(email, ipAddress);
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    );
  }
}

