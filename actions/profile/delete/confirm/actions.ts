"use server";

import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifyAccountDeletionToken, deleteAccountDeletionToken } from "@/lib/account-deletion-token";
import crypto from "crypto";

export async function confirmDeleteAccountAction(token: string) {
  try {
    if (!token || typeof token !== "string") {
      return {
        success: false,
        error: "Token requis",
        status: 400,
      };
    }

    // Vérifier le token
    const deletionToken = await verifyAccountDeletionToken(token);

    if (!deletionToken) {
      return {
        success: false,
        error: "Token invalide ou expiré",
        status: 400,
      };
    }

    const userId = deletionToken.identifier;

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      await deleteAccountDeletionToken(token);
      return {
        success: false,
        error: "Utilisateur non trouvé ou déjà supprimé",
        status: 404,
      };
    }

    // STRATÉGIE RGPD : Soft delete + Anonymisation
    const deletedEmail = `deleted_${userId}@deleted.local`;

    const originalEmailHash = crypto
      .createHash("sha256")
      .update(user.email.toLowerCase().trim())
      .digest("hex");

    // 1. Anonymiser les avis
    await prisma.review.updateMany({
      where: { userId },
      data: {
        comment: null,
      },
    });

    // 2. Anonymiser les réservations
    await prisma.booking.updateMany({
      where: { userId },
      data: {
        notes: null,
        cancellationReason: null,
      },
    });

    // 3. Supprimer les tokens
    await prisma.verificationToken.deleteMany({
      where: { identifier: userId },
    });

    // 4. Supprimer les tentatives de rate limiting
    await prisma.rateLimitAttempt.deleteMany({
      where: {
        identifier: user.email,
        type: "email",
      },
    });

    // 5. SOFT DELETE + ANONYMIZATION
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: deletedEmail,
        name: "Utilisateur supprimé",
        phone: null,
        image: null,
        driverLicense: null,
        password: "DELETED",
        emailVerified: null,
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
    });

    // Marquer comme supprimé
    await prisma.$executeRaw`
      UPDATE users 
      SET "deletedAt" = NOW(),
          "originalEmailHash" = ${originalEmailHash}
      WHERE id = ${userId}
    `;

    // Supprimer le token
    await deleteAccountDeletionToken(token);

    // Déconnecter l'utilisateur
    await signOut({ redirect: false });

    return {
      success: true,
      message: "Votre compte a été supprimé avec succès",
    };
  } catch (error) {
    console.error("Account deletion confirmation error:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la suppression",
      status: 500,
    };
  }
}

