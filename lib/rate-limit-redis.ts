import { getRedisClient, isRedisAvailable } from "./redis";

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
 * Vérifie si un identifier (email ou IP) a dépassé le rate limit avec Redis
 * @param identifier Email, userId ou IP
 * @param type Type de limite: "email" ou "ip"
 * @param config Configuration du rate limit (optionnel)
 * @returns Object avec allowed, remaining et resetAt
 */
export async function checkRateLimitRedis(
  identifier: string,
  type: "email" | "ip" = "email",
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  // Fallback vers la base de données si Redis n'est pas disponible
  if (!(await isRedisAvailable())) {
    // Importer dynamiquement la version Prisma
    const { checkRateLimit } = await import("./rate-limit");
    return checkRateLimit(identifier, type, config);
  }

  try {
    const client = getRedisClient();
    const key = `ratelimit:${type}:${identifier}`;
    const windowSeconds = Math.floor(config.windowMs / 1000);

    // Récupérer le nombre actuel de tentatives
    const attempts = await client.get(key);
    const currentAttempts = attempts ? parseInt(attempts, 10) : 0;

    // Vérifier si la limite est dépassée
    const allowed = currentAttempts < config.maxAttempts;
    const remaining = Math.max(0, config.maxAttempts - currentAttempts);

    // Calculer la date de réinitialisation
    const ttl = await client.ttl(key);
    const resetAt =
      ttl > 0
        ? new Date(Date.now() + ttl * 1000)
        : new Date(Date.now() + config.windowMs);

    return {
      allowed,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error("Error checking rate limit with Redis:", error);
    // Fallback vers la base de données en cas d'erreur
    const { checkRateLimit } = await import("./rate-limit");
    return checkRateLimit(identifier, type, config);
  }
}

/**
 * Enregistre une tentative de rate limit avec Redis
 * @param identifier Email, userId ou IP
 * @param type Type de limite: "email" ou "ip"
 */
export async function recordRateLimitAttemptRedis(
  identifier: string,
  type: "email" | "ip"
): Promise<void> {
  // Fallback vers la base de données si Redis n'est pas disponible
  if (!(await isRedisAvailable())) {
    const { recordRateLimitAttempt } = await import("./rate-limit");
    return recordRateLimitAttempt(identifier, type);
  }

  try {
    const client = getRedisClient();
    const key = `ratelimit:${type}:${identifier}`;
    const windowSeconds = Math.floor(DEFAULT_CONFIG.windowMs / 1000);

    // Incrémenter le compteur et définir l'expiration
    await client.incr(key);
    await client.expire(key, windowSeconds);
  } catch (error) {
    console.error("Error recording rate limit attempt with Redis:", error);
    // Fallback vers la base de données en cas d'erreur
    const { recordRateLimitAttempt } = await import("./rate-limit");
    return recordRateLimitAttempt(identifier, type);
  }
}

/**
 * Vérifie le rate limit pour la réinitialisation de mot de passe (par email ET par IP) avec Redis
 * @param email Email de l'utilisateur
 * @param ipAddress Adresse IP de la requête
 * @returns Object avec allowed, remaining et resetAt (le plus restrictif)
 */
export async function checkPasswordResetRateLimitRedis(
  email: string,
  ipAddress: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date; reason?: string }> {
  // Vérifier par email
  const emailLimit = await checkRateLimitRedis(
    email,
    "email",
    PASSWORD_RESET_CONFIG
  );

  // Vérifier par IP
  const ipLimit = await checkRateLimitRedis(
    ipAddress,
    "ip",
    PASSWORD_RESET_CONFIG
  );

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
  const resetAt =
    emailLimit.resetAt < ipLimit.resetAt ? emailLimit.resetAt : ipLimit.resetAt;

  return {
    allowed: true,
    remaining,
    resetAt,
  };
}

/**
 * Enregistre une tentative de réinitialisation de mot de passe (par email ET par IP) avec Redis
 * @param email Email de l'utilisateur
 * @param ipAddress Adresse IP de la requête
 */
export async function recordPasswordResetAttemptRedis(
  email: string,
  ipAddress: string
): Promise<void> {
  await Promise.all([
    recordRateLimitAttemptRedis(email, "email"),
    recordRateLimitAttemptRedis(ipAddress, "ip"),
  ]);
}

/**
 * Vérifie le rate limit pour le login (par email ET par IP) avec Redis
 * @param email Email de l'utilisateur
 * @param ipAddress Adresse IP de la requête
 * @returns Object avec allowed, remaining et resetAt (le plus restrictif)
 */
export async function checkLoginRateLimitRedis(
  email: string,
  ipAddress: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date; reason?: string }> {
  // Vérifier par email
  const emailLimit = await checkRateLimitRedis(email, "email", LOGIN_CONFIG);

  // Vérifier par IP
  const ipLimit = await checkRateLimitRedis(ipAddress, "ip", LOGIN_CONFIG);

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
  const resetAt =
    emailLimit.resetAt < ipLimit.resetAt ? emailLimit.resetAt : ipLimit.resetAt;

  return {
    allowed: true,
    remaining,
    resetAt,
  };
}

/**
 * Enregistre une tentative de login (par email ET par IP) avec Redis
 * @param email Email de l'utilisateur
 * @param ipAddress Adresse IP de la requête
 */
export async function recordLoginAttemptRedis(
  email: string,
  ipAddress: string
): Promise<void> {
  await Promise.all([
    recordRateLimitAttemptRedis(email, "email"),
    recordRateLimitAttemptRedis(ipAddress, "ip"),
  ]);
}

// Exporter les fonctions génériques avec des alias pour compatibilité
export {
  checkRateLimitRedis as checkRateLimit,
  recordRateLimitAttemptRedis as recordRateLimitAttempt,
};

