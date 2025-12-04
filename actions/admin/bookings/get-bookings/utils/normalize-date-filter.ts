import type { Prisma } from "@prisma/client";

/**
 * Normalise un filtre de date pour Prisma
 */
export function normalizeDateFilter(
  existing?: Prisma.DateTimeFilter | Date | string
): Prisma.DateTimeFilter {
  if (!existing) return {};
  if (existing instanceof Date) {
    return { equals: existing };
  }
  if (typeof existing === "string") {
    const parsed = new Date(existing);
    return Number.isNaN(parsed.getTime()) ? {} : { equals: parsed };
  }
  return { ...existing };
}

