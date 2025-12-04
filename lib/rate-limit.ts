import prisma from "@/lib/prisma";

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

const LOGIN_CONFIG: RateLimitConfig = {
  maxAttempts: 5, // Maximum 5 tentatives
  windowMs: 15 * 60 * 1000, // 15 minutes
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
  const rateLimitModel = (prisma as unknown as { rateLimitAttempt?: {
    count: (args?: { where?: { identifier?: string; type?: string; createdAt?: { gte?: Date } } }) => Promise<number>;
    findFirst: (args?: {
      where?: { identifier?: string; type?: string; createdAt?: { gte?: Date } };
      orderBy?: { createdAt?: "asc" | "desc" };
    }) => Promise<{ createdAt: Date } | null>;
    create: (args: { data: { identifier: string; type: string } }) => Promise<unknown>;
    deleteMany: (args?: { where?: { createdAt?: { lt?: Date } } }) => Promise<unknown>;
  } }).rateLimitAttempt;
  
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
  const rateLimitModel = (prisma as unknown as { rateLimitAttempt?: {
    count: (args?: { where?: { identifier?: string; type?: string; createdAt?: { gte?: Date } } }) => Promise<number>;
    findFirst: (args?: {
      where?: { identifier?: string; type?: string; createdAt?: { gte?: Date } };
      orderBy?: { createdAt?: "asc" | "desc" };
    }) => Promise<{ createdAt: Date } | null>;
    create: (args: { data: { identifier: string; type: string } }) => Promise<unknown>;
    deleteMany: (args?: { where?: { createdAt?: { lt?: Date } } }) => Promise<unknown>;
  } }).rateLimitAttempt;
  
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
 * Vérifie le rate limit pour le login (par email ET par IP)
 * @param email Email de l'utilisateur
 * @param ipAddress Adresse IP de la requête
 * @returns Object avec allowed, remaining et resetAt (le plus restrictif)
 */
export async function checkLoginRateLimit(
  email: string,
  ipAddress: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date; reason?: string }> {
  // Vérifier par email
  const emailLimit = await checkRateLimit(email, "email", LOGIN_CONFIG);
  
  // Vérifier par IP
  const ipLimit = await checkRateLimit(ipAddress, "ip", LOGIN_CONFIG);

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
 * Enregistre une tentative de login (par email ET par IP)
 * @param email Email de l'utilisateur
 * @param ipAddress Adresse IP de la requête
 */
export async function recordLoginAttempt(
  email: string,
  ipAddress: string
): Promise<void> {
  await Promise.all([
    recordRateLimitAttempt(email, "email"),
    recordRateLimitAttempt(ipAddress, "ip"),
  ]);
}

/**
 * Vérifie si un compte est verrouillé
 * @param userId ID de l'utilisateur
 * @returns true si le compte est verrouillé
 */
export async function isAccountLocked(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true },
  });

  if (!user || !user.lockedUntil) {
    return false;
  }

  // Si la date de déverrouillage est dans le futur, le compte est verrouillé
  return user.lockedUntil > new Date();
}

/**
 * Incrémente le nombre d'échecs de connexion et verrouille le compte si nécessaire
 * @param userId ID de l'utilisateur
 * @param maxAttempts Nombre maximum d'échecs avant verrouillage (défaut: 5)
 * @param lockDurationMinutes Durée du verrouillage en minutes (défaut: 30)
 */
export async function incrementFailedLoginAttempts(
  userId: string,
  maxAttempts: number = 5,
  lockDurationMinutes: number = 30
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true },
  });

  if (!user) {
    return;
  }

  const newAttempts = user.failedLoginAttempts + 1;

  // Si on atteint le maximum, verrouiller le compte
  if (newAttempts >= maxAttempts) {
    const lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil,
      },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: newAttempts,
      },
    });
  }
}

/**
 * Réinitialise les échecs de connexion après une connexion réussie
 * @param userId ID de l'utilisateur
 */
export async function resetFailedLoginAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
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

