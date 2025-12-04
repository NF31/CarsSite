import prisma from "@/lib/prisma";
import crypto from "crypto";

/**
 * Génère un token sécurisé pour la réinitialisation de mot de passe
 * @param email Email de l'utilisateur
 * @returns Token de réinitialisation avec expiration
 */
export async function generatePasswordResetToken(email: string) {
  // Générer un token aléatoire cryptographiquement sécurisé
  const token = crypto.randomBytes(32).toString("hex");

  // Expiration dans 1 heure (plus court que verification pour sécurité)
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  // Supprimer les anciens tokens pour cet email (sécurité)
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: email,
      // On peut utiliser le même modèle mais avec un type différent
      // Ou créer un champ "type" dans le schéma
    },
  });

  // Créer le nouveau token
  const resetToken = await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return resetToken;
}

/**
 * Vérifie et récupère un token de réinitialisation valide
 * @param token Token à vérifier
 * @returns Token si valide, null sinon
 */
export async function verifyPasswordResetToken(token: string) {
  const resetToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return null;
  }

  // Vérifier si le token a expiré
  if (resetToken.expires < new Date()) {
    // Supprimer le token expiré
    await prisma.verificationToken.delete({
      where: { id: resetToken.id },
    });
    return null;
  }

  return resetToken;
}

/**
 * Supprime un token de réinitialisation après utilisation
 * @param token Token à supprimer
 */
export async function deletePasswordResetToken(token: string) {
  await prisma.verificationToken.deleteMany({
    where: { token },
  });
}

