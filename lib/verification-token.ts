import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function generateVerificationToken(email: string) {
  // Générer un token aléatoire
  const token = crypto.randomBytes(32).toString("hex");

  // Expiration dans 24 heures
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Supprimer les anciens tokens pour cet email
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: email,
    },
  });

  // Créer le nouveau token
  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return verificationToken;
}

export async function verifyToken(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return null;
  }

  // Vérifier si le token a expiré
  if (verificationToken.expires < new Date()) {
    // Supprimer le token expiré
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });
    return null;
  }

  return verificationToken;
}

export async function deleteVerificationToken(token: string) {
  await prisma.verificationToken.deleteMany({
    where: { token },
  });
}

