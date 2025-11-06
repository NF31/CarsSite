"use server";

import { prisma } from "@/lib/prisma";
import { verifyToken, deleteVerificationToken } from "@/lib/verification-token";

export async function verifyEmailAction(token: string) {
  try {
    if (!token) {
      return {
        success: false,
        error: "Token invalide ou expiré",
        message: "Le lien de vérification est invalide ou a expiré. Veuillez demander un nouveau lien.",
      };
    }

    // Vérifier le token
    const verificationToken = await verifyToken(token);

    if (!verificationToken) {
      return {
        success: false,
        error: "Token invalide ou expiré",
        message: "Le lien de vérification est invalide ou a expiré. Veuillez demander un nouveau lien.",
      };
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return {
        success: false,
        error: "Utilisateur introuvable",
        message: "Aucun compte n'a été trouvé pour cet email.",
      };
    }

    // Vérifier si l'email est déjà vérifié
    if (user.emailVerified) {
      await deleteVerificationToken(token);
      return {
        success: true,
        message: "Votre email est déjà vérifié.",
        alreadyVerified: true,
      };
    }

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
      },
    });

    // Supprimer le token
    await deleteVerificationToken(token);

    return {
      success: true,
      message: "Email vérifié avec succès ! Vous pouvez maintenant vous connecter.",
    };
  } catch (error) {
    console.error("Verification error:", error);
    return {
      success: false,
      error: "Erreur serveur",
      message: "Une erreur est survenue lors de la vérification",
    };
  }
}

