import { prisma } from "@/lib/prisma";

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // En millisecondes
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 3, // Maximum 3 tentatives
  windowMs: 60 * 60 * 1000, // 1 heure
};

/**
 * Vérifie si un email a dépassé le rate limit
 * @param identifier Email ou userId
 * @param config Configuration du rate limit (optionnel)
 * @returns true si le rate limit est dépassé, false sinon
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const windowStart = new Date(Date.now() - config.windowMs);

  // Compter les tokens créés dans la fenêtre de temps
  const recentTokens = await prisma.verificationToken.count({
    where: {
      identifier,
      createdAt: {
        gte: windowStart,
      },
    },
  });

  const remaining = Math.max(0, config.maxAttempts - recentTokens);
  const allowed = recentTokens < config.maxAttempts;
  
  // Calculer quand le rate limit sera réinitialisé
  const oldestToken = await prisma.verificationToken.findFirst({
    where: {
      identifier,
      createdAt: {
        gte: windowStart,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const resetAt = oldestToken
    ? new Date(oldestToken.createdAt.getTime() + config.windowMs)
    : new Date(Date.now() + config.windowMs);

  return {
    allowed,
    remaining,
    resetAt,
  };
}

/**
 * Nettoyer les anciens tokens expirés (maintenance)
 */
export async function cleanupExpiredTokens() {
  await prisma.verificationToken.deleteMany({
    where: {
      expires: {
        lt: new Date(),
      },
    },
  });
}

