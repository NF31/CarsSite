"use server";

import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateVerificationToken } from "@/lib/verification-token";
import { sendVerificationEmail } from "@/lib/email";

export async function resendVerificationAction(email: string) {
  try {
    if (!email) {
      return {
        success: false,
        error: "Email requis",
      };
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const rateLimit = await checkRateLimit(email, "email");
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: "Rate limit dépassé",
          message: "Trop de tentatives. Veuillez réessayer plus tard.",
          resetAt: rateLimit.resetAt,
          status: 429,
        };
      }

      return {
        success: true,
        message: "Si cet email existe, un lien de vérification a été envoyé.",
      };
    }

    if (user.emailVerified) {
      return {
        success: false,
        error: "Email déjà vérifié",
        message: "Votre email est déjà vérifié. Vous pouvez vous connecter.",
      };
    }

    // Vérifier le rate limit
    const rateLimit = await checkRateLimit(user.email, "email");
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: "Rate limit dépassé",
        message: `Trop de tentatives. Vous pouvez renvoyer l'email dans ${Math.ceil(
          (rateLimit.resetAt.getTime() - Date.now()) / 60000
        )} minute(s).`,
        resetAt: rateLimit.resetAt,
        status: 429,
      };
    }

    // Générer un nouveau token
    const verificationToken = await generateVerificationToken(user.email);

    // Envoyer l'email
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken.token);
      return {
        success: true,
        message: "Un nouveau lien de vérification a été envoyé à votre email.",
        remaining: rateLimit.remaining - 1,
      };
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      return {
        success: false,
        error: "Erreur d'envoi",
        message: "Impossible d'envoyer l'email. Veuillez réessayer plus tard.",
      };
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    return {
      success: false,
      error: "Erreur serveur",
      message: "Une erreur est survenue",
    };
  }
}

