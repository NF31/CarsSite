import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPasswordResetToken, deletePasswordResetToken } from "@/lib/password-reset-token";
import { resetPasswordSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = resetPasswordSchema.parse(body);

    // Vérifier le token
    const resetToken = await verifyPasswordResetToken(validated.token);
    
    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Token invalide ou expiré",
          message: "Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.",
        },
        { status: 400 }
      );
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: resetToken.identifier },
    });

    if (!user) {
      // Supprimer le token si l'utilisateur n'existe plus
      await deletePasswordResetToken(validated.token);
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable",
          message: "L'utilisateur associé à ce token n'existe plus.",
        },
        { status: 404 }
      );
    }

    // Vérifier que l'email est vérifié
    if (!user.emailVerified) {
      await deletePasswordResetToken(validated.token);
      return NextResponse.json(
        {
          success: false,
          error: "Email non vérifié",
          message: "Votre email doit être vérifié avant de pouvoir réinitialiser votre mot de passe.",
        },
        { status: 400 }
      );
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    if (user.password) {
      const isSamePassword = await bcrypt.compare(validated.password, user.password);
      if (isSamePassword) {
        await deletePasswordResetToken(validated.token);
        return NextResponse.json(
          {
            success: false,
            error: "Mot de passe identique",
            message: "Le nouveau mot de passe doit être différent de l'ancien mot de passe.",
          },
          { status: 400 }
        );
      }
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(validated.password, 12);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    // Supprimer le token après utilisation (sécurité)
    await deletePasswordResetToken(validated.token);

    // Supprimer tous les tokens de réinitialisation pour cet utilisateur (sécurité)
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: user.email,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur reset-password:", error);

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

