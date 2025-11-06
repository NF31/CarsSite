import { prisma } from "@/lib/prisma";

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // En millisecondes
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 3, // Maximum 3 tentatives
  windowMs: 60 * 60 * 1000, // 1 heure
};

const PASSWORD_RESET_CONFIG: RateLimitConfig = {
  maxAttempts: 3, // Maximum 3 tentatives
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Vérifie si un identifier (email ou IP) a dépassé le rate limit
 * @param identifier Email, userId ou IP
 * @param type Type de limite: "email" ou "ip"
 * @param config Configuration du rate limit (optionnel)
 * @returns Object avec allowed, remaining et resetAt
 */
export async function checkRateLimit(
  identifier: string,
  type: "email" | "ip" = "email",
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const windowStart = new Date(Date.now() - config.windowMs);

  // Utiliser un accès dynamique pour éviter les erreurs TypeScript si le modèle n'est pas encore généré
  // @ts-expect-error - rateLimitAttempt peut ne pas être disponible si Prisma Client n'est pas régénéré
  const rateLimitModel = prisma.rateLimitAttempt;
  
  if (!rateLimitModel) {
    console.error("Prisma client missing rateLimitAttempt model. Please restart the Next.js server after running: npx prisma generate");
    // Retourner une valeur par défaut en cas d'erreur
    return {
      allowed: true, // Autoriser par défaut si le modèle n'existe pas encore
      remaining: config.maxAttempts,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }

  // Compter les tentatives dans la fenêtre de temps
  const recentAttempts = await rateLimitModel.count({
    where: {
      identifier,
      type,
      createdAt: {
        gte: windowStart,
      },
    },
  });

  const remaining = Math.max(0, config.maxAttempts - recentAttempts);
  const allowed = recentAttempts < config.maxAttempts;
  
  // Calculer quand le rate limit sera réinitialisé
  const oldestAttempt = await rateLimitModel.findFirst({
    where: {
      identifier,
      type,
      createdAt: {
        gte: windowStart,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const resetAt = oldestAttempt
    ? new Date(oldestAttempt.createdAt.getTime() + config.windowMs)
    : new Date(Date.now() + config.windowMs);

  return {
    allowed,
    remaining,
    resetAt,
  };
}

/**
 * Enregistre une tentative de rate limit
 * @param identifier Email, userId ou IP
 * @param type Type de limite: "email" ou "ip"
 */
export async function recordRateLimitAttempt(
  identifier: string,
  type: "email" | "ip"
): Promise<void> {
  // Utiliser un accès dynamique pour éviter les erreurs TypeScript si le modèle n'est pas encore généré
  // @ts-expect-error - rateLimitAttempt peut ne pas être disponible si Prisma Client n'est pas régénéré
  const rateLimitModel = prisma.rateLimitAttempt;
  
  if (!rateLimitModel) {
    console.error("Prisma client missing rateLimitAttempt model. Please restart the Next.js server after running: npx prisma generate");
    return; // Ne rien faire si le modèle n'existe pas
  }

  await rateLimitModel.create({
    data: {
      identifier,
      type,
    },
  });

  // Nettoyer les anciennes tentatives (plus de 1 heure)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  await rateLimitModel.deleteMany({
    where: {
      createdAt: {
        lt: oneHourAgo,
      },
    },
  });
}

/**
 * Vérifie le rate limit pour la réinitialisation de mot de passe (par email ET par IP)
 * @param email Email de l'utilisateur
 * @param ipAddress Adresse IP de la requête
 * @returns Object avec allowed, remaining et resetAt (le plus restrictif)
 */
export async function checkPasswordResetRateLimit(
  email: string,
  ipAddress: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date; reason?: string }> {
  // Vérifier par email
  const emailLimit = await checkRateLimit(email, "email", PASSWORD_RESET_CONFIG);
  
  // Vérifier par IP
  const ipLimit = await checkRateLimit(ipAddress, "ip", PASSWORD_RESET_CONFIG);

  // Si l'un des deux est dépassé, bloquer
  if (!emailLimit.allowed) {
    return {
      allowed: false,
      remaining: emailLimit.remaining,
      resetAt: emailLimit.resetAt,
      reason: "email",
    };
  }

  if (!ipLimit.allowed) {
    return {
      allowed: false,
      remaining: ipLimit.remaining,
      resetAt: ipLimit.resetAt,
      reason: "ip",
    };
  }

  // Retourner le plus restrictif
  const remaining = Math.min(emailLimit.remaining, ipLimit.remaining);
  const resetAt = emailLimit.resetAt < ipLimit.resetAt ? emailLimit.resetAt : ipLimit.resetAt;

  return {
    allowed: true,
    remaining,
    resetAt,
  };
}

/**
 * Enregistre une tentative de réinitialisation de mot de passe (par email ET par IP)
 * @param email Email de l'utilisateur
 * @param ipAddress Adresse IP de la requête
 */
export async function recordPasswordResetAttempt(
  email: string,
  ipAddress: string
): Promise<void> {
  await Promise.all([
    recordRateLimitAttempt(email, "email"),
    recordRateLimitAttempt(ipAddress, "ip"),
  ]);
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

