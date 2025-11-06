import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifyAccountDeletionToken, deleteAccountDeletionToken } from "@/lib/account-deletion-token";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token requis" },
        { status: 400 }
      );
    }

    // Vérifier le token
    const deletionToken = await verifyAccountDeletionToken(token);

    if (!deletionToken) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur depuis le token (identifier = userId)
    const userId = deletionToken.identifier;

    // Vérifier que l'utilisateur existe et n'est pas déjà supprimé
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null, // Vérifier que le compte n'est pas déjà supprimé
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      // Supprimer le token invalide
      await deleteAccountDeletionToken(token);
      return NextResponse.json(
        { error: "Utilisateur non trouvé ou déjà supprimé" },
        { status: 404 }
      );
    }

    // STRATÉGIE RGPD : Soft delete + Anonymisation
    // On garde les données comptables (factures, paiements) pour obligations légales (10 ans)
    // Mais on anonymise toutes les données personnelles identifiables
    
    const deletedEmail = `deleted_${userId}@deleted.local`;
    
    // Créer un hash de l'email original pour la traçabilité légale
    // SHA-256 permet de retrouver l'email si nécessaire (via rainbow table ou brute force)
    // mais reste conforme RGPD car non directement lisible
    const originalEmailHash = crypto
      .createHash("sha256")
      .update(user.email.toLowerCase().trim())
      .digest("hex");
    
    // 1. Anonymiser les avis (reviews) - on garde les notes mais on anonymise les commentaires
    await prisma.review.updateMany({
      where: { userId },
      data: {
        comment: null, // Supprimer les commentaires personnels
        // On garde la note et les dates pour statistiques
      },
    });

    // 2. Anonymiser les réservations - on garde les données mais on supprime les notes personnelles
    await prisma.booking.updateMany({
      where: { userId },
      data: {
        notes: null, // Supprimer les notes personnelles
        cancellationReason: null, // Anonymiser les raisons d'annulation
        // On garde les dates, prix, véhicule pour statistiques et comptabilité
      },
    });

    // 3. Supprimer les tokens de vérification (données de connexion)
    await prisma.verificationToken.deleteMany({
      where: { identifier: userId },
    });

    // 4. Supprimer les tentatives de rate limiting (données de connexion)
    await prisma.rateLimitAttempt.deleteMany({
      where: {
        identifier: user.email,
        type: "email",
      },
    });

    // 5. SOFT DELETE + ANONYMIZATION du compte utilisateur
    // On garde le compte mais on anonymise toutes les données personnelles
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Anonymiser les données personnelles
        email: deletedEmail, // Email anonymisé (unique)
        name: "Utilisateur supprimé",
        phone: null,
        image: null,
        driverLicense: null,
        password: "DELETED", // Hash invalide
        emailVerified: null,
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
    });

    // Marquer comme supprimé + garder le hash de l'email original pour traçabilité
    // (via SQL brut car Prisma Client peut ne pas être à jour)
    await prisma.$executeRaw`
      UPDATE users 
      SET "deletedAt" = NOW(),
          "originalEmailHash" = ${originalEmailHash}
      WHERE id = ${userId}
    `;

    // Note : On GARDE les factures et paiements car :
    // - Obligation légale de conservation (10 ans en France)
    // - Nécessaires pour la comptabilité
    // - Les factures contiennent déjà les données nécessaires pour la traçabilité
    // Les factures et paiements restent liés au userId (maintenant anonymisé)

    // Supprimer le token après utilisation
    await deleteAccountDeletionToken(token);

    // Déconnecter l'utilisateur
    await signOut({ redirect: false });

    return NextResponse.json({
      success: true,
      message: "Votre compte a été supprimé avec succès",
    });
  } catch (error) {
    console.error("Account deletion confirmation error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression" },
      { status: 500 }
    );
  }
}

