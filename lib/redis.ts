import Redis from "ioredis";

// Singleton pour le client Redis
let redis: Redis | null = null;

/**
 * Obtient ou crée une instance Redis
 * Utilise un singleton pour éviter les multiples connexions
 */
export function getRedisClient(): Redis {
  if (redis) {
    return redis;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is not set");
  }

  // Créer une nouvelle instance Redis
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    enableReadyCheck: true,
    enableOfflineQueue: true, // Permettre la queue offline pour les scripts de test
    lazyConnect: false, // Se connecter immédiatement
  });

  // Gestion des erreurs
  redis.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  redis.on("connect", () => {
    console.log("Redis Client Connected");
  });

  redis.on("ready", () => {
    console.log("Redis Client Ready");
  });

  return redis;
}

/**
 * Ferme la connexion Redis (utile pour les tests ou le shutdown)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    try {
      await redis.quit();
    } catch (error) {
      // Ignorer les erreurs lors de la fermeture
      console.error("Error closing Redis connection:", error);
    }
    redis = null;
  }
}

/**
 * Vérifie si Redis est disponible
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = getRedisClient();
    // Vérifier si la connexion est prête
    if (client.status !== "ready" && client.status !== "connect") {
      // Essayer de se connecter
      if (client.status === "end") {
        await client.connect().catch(() => {
          // Ignorer les erreurs de connexion
        });
      }
    }
    await client.ping();
    return true;
  } catch (error) {
    console.error("Redis is not available:", error);
    return false;
  }
}

