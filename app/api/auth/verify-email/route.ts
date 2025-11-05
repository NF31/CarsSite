import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken, deleteVerificationToken } from "@/lib/verification-token";

const verifySchema = z.object({
  token: z.string().min(1, "Token requis"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = verifySchema.parse(body);

    // Vérifier le token
    const verificationToken = await verifyToken(validated.token);

    if (!verificationToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Token invalide ou expiré",
          message: "Le lien de vérification est invalide ou a expiré. Veuillez demander un nouveau lien.",
        },
        { status: 400 }
      );
    }

    // Trouver l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable",
          message: "Aucun compte n'a été trouvé pour cet email.",
        },
        { status: 404 }
      );
    }

    // Vérifier si l'email est déjà vérifié
    if (user.emailVerified) {
      // Supprimer le token utilisé
      await deleteVerificationToken(validated.token);
      return NextResponse.json(
        {
          success: true,
          message: "Votre email est déjà vérifié.",
          alreadyVerified: true,
        },
        { status: 200 }
      );
    }

    // Mettre à jour l'utilisateur : email vérifié
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
      },
    });

    // Supprimer le token utilisé
    await deleteVerificationToken(validated.token);

    return NextResponse.json(
      {
        success: true,
        message: "Email vérifié avec succès ! Vous pouvez maintenant vous connecter.",
      },
      { status: 200 }
    );
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

    console.error("Verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors de la vérification",
      },
      { status: 500 }
    );
  }
}

