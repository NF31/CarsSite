import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Crée un hash SHA-256 de l'email pour la traçabilité légale
 * Permet de retrouver l'identité originale si nécessaire (via rainbow table)
 * Conforme RGPD car non directement lisible
 */
export function hashEmail(email: string): string {
  return crypto
    .createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex");
}

/**
 * Recherche un utilisateur supprimé par son email original (hashé)
 * Utile pour la traçabilité légale et les audits
 * 
 * @param originalEmail L'email original de l'utilisateur
 * @returns L'utilisateur supprimé si trouvé, null sinon
 */
export async function findDeletedUserByOriginalEmail(originalEmail: string) {
  const emailHash = hashEmail(originalEmail);
  
  const deletedUser = await prisma.user.findFirst({
    where: {
      originalEmailHash: emailHash,
      deletedAt: { not: null },
    },
    select: {
      id: true,
      deletedAt: true,
      createdAt: true,
      // On peut aussi récupérer les factures/paiements liés pour la traçabilité
      invoices: {
        select: {
          invoiceNumber: true,
          total: true,
          issuedAt: true,
        },
        orderBy: {
          issuedAt: "desc",
        },
      },
      payments: {
        select: {
          amount: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  return deletedUser;
}

/**
 * Recherche tous les utilisateurs supprimés avec leur hash d'email
 * Utile pour les audits et la traçabilité
 */
export async function getAllDeletedUsers() {
  return await prisma.user.findMany({
    where: {
      deletedAt: { not: null },
    },
    select: {
      id: true,
      originalEmailHash: true,
      deletedAt: true,
      createdAt: true,
    },
    orderBy: {
      deletedAt: "desc",
    },
  });
}

