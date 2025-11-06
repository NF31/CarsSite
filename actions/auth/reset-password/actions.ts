"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { verifyPasswordResetToken, deletePasswordResetToken } from "@/lib/password-reset-token";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function resetPasswordAction(data: z.infer<typeof resetPasswordSchema>) {
  try {
    const validated = resetPasswordSchema.parse(data);

    // Vérifier le token
    const resetToken = await verifyPasswordResetToken(validated.token);

    if (!resetToken) {
      return {
        success: false,
        error: "Token invalide ou expiré",
        message: "Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.",
      };
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: resetToken.identifier },
    });

    if (!user) {
      await deletePasswordResetToken(validated.token);
      return {
        success: false,
        error: "Utilisateur introuvable",
        message: "L'utilisateur associé à ce token n'existe plus.",
      };
    }

    if (!user.emailVerified) {
      await deletePasswordResetToken(validated.token);
      return {
        success: false,
        error: "Email non vérifié",
        message: "Votre email doit être vérifié avant de pouvoir réinitialiser votre mot de passe.",
      };
    }

    // Vérifier que le nouveau mot de passe est différent
    if (user.password) {
      const isSamePassword = await bcrypt.compare(validated.password, user.password);
      if (isSamePassword) {
        await deletePasswordResetToken(validated.token);
        return {
          success: false,
          error: "Mot de passe identique",
          message: "Le nouveau mot de passe doit être différent de l'ancien mot de passe.",
        };
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

    // Supprimer le token
    await deletePasswordResetToken(validated.token);

    // Supprimer tous les tokens de réinitialisation
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: user.email,
      },
    });

    return {
      success: true,
      message: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
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

    console.error("Erreur reset-password:", error);
    return {
      success: false,
      error: "Erreur serveur",
      message: "Une erreur est survenue. Veuillez réessayer plus tard.",
    };
  }
}

