import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generatePasswordResetToken } from "@/lib/password-reset-token";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkPasswordResetRateLimit, recordPasswordResetAttempt } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validations/auth";

/**
 * Récupère l'adresse IP réelle du client
 * Gère les proxies et load balancers
 */
function getClientIP(request: NextRequest): string {
  // Vérifier les headers de proxy courants
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for peut contenir plusieurs IPs, prendre la première
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get("cf-connecting-ip"); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback sur l'IP de la requête (peut être l'IP du proxy)
  return request.ip || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = forgotPasswordSchema.parse(body);

    // Récupérer l'adresse IP du client
    const ipAddress = getClientIP(request);

    // Vérifier le rate limit AVANT toute autre opération (par email ET par IP)
    const rateLimit = await checkPasswordResetRateLimit(validated.email, ipAddress);
    if (!rateLimit.allowed) {
      const message = rateLimit.reason === "ip"
        ? "Trop de tentatives depuis cette adresse IP. Veuillez réessayer dans quelques instants."
        : "Trop de tentatives pour cet email. Veuillez réessayer dans quelques instants.";
      
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit dépassé",
          message,
          resetAt: rateLimit.resetAt,
        },
        { status: 429 }
      );
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    // Ne pas révéler si l'email existe ou non (sécurité)
    // Toujours retourner un succès même si l'email n'existe pas
    if (!user) {
      // Enregistrer la tentative par IP uniquement (pour le rate limiting même si l'email n'existe pas)
      await recordPasswordResetAttempt(validated.email, ipAddress);
      
      // On retourne toujours un succès pour ne pas révéler l'existence de l'email
      // Mais on ne fait rien (pas d'envoi d'email)
      return NextResponse.json(
        {
          success: true,
          message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
        },
        { status: 200 }
      );
    }

    // Vérifier que l'email est vérifié (sécurité)
    if (!user.emailVerified) {
      // Enregistrer la tentative par IP uniquement (pour le rate limiting)
      await recordPasswordResetAttempt(validated.email, ipAddress);
      
      // Ne pas révéler que l'email n'est pas vérifié
      return NextResponse.json(
        {
          success: true,
          message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
        },
        { status: 200 }
      );
    }

    // Enregistrer la tentative (email ET IP) avant de générer le token
    await recordPasswordResetAttempt(user.email, ipAddress);

    // Générer le token de réinitialisation
    const resetToken = await generatePasswordResetToken(user.email);

    // Envoyer l'email de réinitialisation
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken.token);
    } catch (emailError) {
      // Si l'email échoue, supprimer le token créé
      await prisma.verificationToken.delete({
        where: { id: resetToken.id },
      });
      
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de l'envoi de l'email",
          message: "Impossible d'envoyer l'email de réinitialisation. Veuillez réessayer plus tard.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur forgot-password:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation échouée",
          message: error.errors[0]?.message || "Données invalides",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue. Veuillez réessayer plus tard.",
      },
      { status: 500 }
    );
  }
}

