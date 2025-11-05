import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/verification-token";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

const resendSchema = z.object({
  email: z.string().email("Email invalide"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = resendSchema.parse(body);

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      // Ne pas révéler si l'email existe ou non (sécurité)
      // Mais on vérifie quand même le rate limit pour éviter les attaques
      const rateLimit = await checkRateLimit(validated.email);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: "Rate limit dépassé",
            message: "Trop de tentatives. Veuillez réessayer plus tard.",
            resetAt: rateLimit.resetAt,
          },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        {
          success: true,
          message: "Si cet email existe, un lien de vérification a été envoyé.",
        },
        { status: 200 }
      );
    }

    // Vérifier si l'email est déjà vérifié
    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Email déjà vérifié",
          message: "Votre email est déjà vérifié. Vous pouvez vous connecter.",
        },
        { status: 400 }
      );
    }

    // Vérifier le rate limit AVANT de générer un nouveau token
    const rateLimit = await checkRateLimit(user.email);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit dépassé",
          message: `Trop de tentatives. Vous pouvez renvoyer l'email dans ${Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000)} minute(s).`,
          resetAt: rateLimit.resetAt,
        },
        { 
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Générer un nouveau token
    const verificationToken = await generateVerificationToken(user.email);

    // Envoyer l'email
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken.token);
      return NextResponse.json(
        {
          success: true,
          message: "Un nouveau lien de vérification a été envoyé à votre email.",
          remaining: rateLimit.remaining - 1,
        },
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur d'envoi",
          message: "Impossible d'envoyer l'email. Veuillez réessayer plus tard.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    console.error("Resend verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue",
      },
      { status: 500 }
    );
  }
}

