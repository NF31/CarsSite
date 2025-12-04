import { type Prisma } from "@prisma/client";

/**
 * Helper pour exclure les utilisateurs supprimés (soft delete)
 * Utilisez ce helper dans toutes les requêtes qui ne doivent pas inclure les comptes supprimés
 */
export const excludeDeletedUsers = {
  deletedAt: null,
} satisfies Prisma.UserWhereInput;

/**
 * Helper pour inclure uniquement les utilisateurs supprimés
 * Utile pour les requêtes admin ou statistiques
 */
export const onlyDeletedUsers = {
  deletedAt: { not: null },
} satisfies Prisma.UserWhereInput;

/**
 * Vérifie si un utilisateur est supprimé (anonymisé)
 */
export function isUserDeleted(user: { deletedAt: Date | null; email: string; name: string }): boolean {
  return user.deletedAt !== null || 
         user.email.startsWith("deleted_") || 
         user.name === "Utilisateur supprimé";
}

