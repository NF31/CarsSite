import prisma from "@/lib/prisma";
import crypto from "crypto";

/**
 * Génère un token sécurisé pour la confirmation de suppression de compte
 * @param userId ID de l'utilisateur
 * @returns Token de confirmation avec expiration
 */
export async function generateAccountDeletionToken(userId: string) {
  // Générer un token aléatoire cryptographiquement sécurisé
  const token = crypto.randomBytes(32).toString("hex");

  // Expiration dans 24 heures (délai raisonnable pour réfléchir)
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Supprimer les anciens tokens pour cet utilisateur (sécurité)
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: userId,
    },
  });

  // Créer le nouveau token
  const deletionToken = await prisma.verificationToken.create({
    data: {
      identifier: userId,
      token,
      expires,
    },
  });

  return deletionToken;
}

/**
 * Vérifie et récupère un token de suppression valide
 * @param token Token à vérifier
 * @returns Token si valide, null sinon
 */
export async function verifyAccountDeletionToken(token: string) {
  const deletionToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!deletionToken) {
    return null;
  }

  // Vérifier si le token a expiré
  if (deletionToken.expires < new Date()) {
    // Supprimer le token expiré
    await prisma.verificationToken.delete({
      where: { id: deletionToken.id },
    });
    return null;
  }

  return deletionToken;
}

/**
 * Supprime un token de suppression après utilisation
 * @param token Token à supprimer
 */
export async function deleteAccountDeletionToken(token: string) {
  await prisma.verificationToken.deleteMany({
    where: { token },
  });
}

