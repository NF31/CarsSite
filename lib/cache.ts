import { getRedisClient, isRedisAvailable } from "./redis";

/**
 * Préfixes pour les clés de cache
 */
export const CACHE_PREFIXES = {
  VEHICLE: "vehicle",
  VEHICLES_LIST: "vehicles:list",
  LOCATION: "location",
  LOCATIONS_LIST: "locations:list",
  USER: "user",
  BOOKING: "booking",
  BOOKING_OPTIONS: "booking:options",
  SETTINGS: "settings",
  SERVICE: "service",
} as const;

/**
 * Durées de cache par défaut (en secondes)
 */
export const CACHE_TTL = {
  VEHICLE: 60 * 15, // 15 minutes
  VEHICLES_LIST: 60 * 5, // 5 minutes
  LOCATION: 60 * 30, // 30 minutes
  LOCATIONS_LIST: 60 * 30, // 30 minutes
  USER: 60 * 10, // 10 minutes
  BOOKING: 60 * 2, // 2 minutes (données changent souvent)
  BOOKING_OPTIONS: 60 * 5, // 5 minutes
  SETTINGS: 60 * 30, // 30 minutes (changent rarement)
  SERVICE: 60 * 15, // 15 minutes
} as const;

/**
 * Options pour les opérations de cache
 */
export interface CacheOptions {
  ttl?: number; // Time to live en secondes
  prefix?: string;
}

/**
 * Génère une clé de cache
 */
function getCacheKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}

/**
 * Récupère une valeur depuis le cache
 */
export async function getCache<T>(
  key: string,
  prefix: string = "cache"
): Promise<T | null> {
  try {
    if (!(await isRedisAvailable())) {
      return null;
    }

    const client = getRedisClient();
    const cacheKey = getCacheKey(prefix, key);
    const value = await client.get(cacheKey);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
}

/**
 * Stocke une valeur dans le cache
 */
export async function setCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    if (!(await isRedisAvailable())) {
      return false;
    }

    const client = getRedisClient();
    const { ttl, prefix = "cache" } = options;
    const cacheKey = getCacheKey(prefix, key);
    const serialized = JSON.stringify(value);

    if (ttl) {
      await client.setex(cacheKey, ttl, serialized);
    } else {
      await client.set(cacheKey, serialized);
    }

    return true;
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
    return false;
  }
}

/**
 * Supprime une valeur du cache
 */
export async function deleteCache(
  key: string,
  prefix: string = "cache"
): Promise<boolean> {
  try {
    if (!(await isRedisAvailable())) {
      return false;
    }

    const client = getRedisClient();
    const cacheKey = getCacheKey(prefix, key);
    await client.del(cacheKey);
    return true;
  } catch (error) {
    console.error(`Error deleting cache for key ${key}:`, error);
    return false;
  }
}

/**
 * Supprime toutes les clés correspondant à un pattern
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  try {
    if (!(await isRedisAvailable())) {
      return 0;
    }

    const client = getRedisClient();
    const keys = await client.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    await client.del(...keys);
    return keys.length;
  } catch (error) {
    console.error(`Error deleting cache pattern ${pattern}:`, error);
    return 0;
  }
}

/**
 * Invalide le cache pour un préfixe spécifique
 * Utile pour invalider tous les caches liés à une entité
 */
export async function invalidateCacheByPrefix(prefix: string): Promise<number> {
  return deleteCachePattern(`${prefix}:*`);
}

/**
 * Récupère ou met en cache une valeur
 * Si la valeur n'est pas en cache, exécute la fonction et met en cache le résultat
 */
export async function getOrSetCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Essayer de récupérer depuis le cache
  const cached = await getCache<T>(key, options.prefix);

  if (cached !== null) {
    return cached;
  }

  // Si pas en cache, exécuter la fonction
  const value = await fetchFn();

  // Mettre en cache
  await setCache(key, value, options);

  return value;
}

/**
 * Incrémente une valeur dans le cache
 */
export async function incrementCache(
  key: string,
  prefix: string = "cache",
  by: number = 1
): Promise<number> {
  try {
    if (!(await isRedisAvailable())) {
      return 0;
    }

    const client = getRedisClient();
    const cacheKey = getCacheKey(prefix, key);
    return await client.incrby(cacheKey, by);
  } catch (error) {
    console.error(`Error incrementing cache for key ${key}:`, error);
    return 0;
  }
}

/**
 * Définit une expiration pour une clé existante
 */
export async function expireCache(
  key: string,
  ttl: number,
  prefix: string = "cache"
): Promise<boolean> {
  try {
    if (!(await isRedisAvailable())) {
      return false;
    }

    const client = getRedisClient();
    const cacheKey = getCacheKey(prefix, key);
    await client.expire(cacheKey, ttl);
    return true;
  } catch (error) {
    console.error(`Error setting expiration for key ${key}:`, error);
    return false;
  }
}

