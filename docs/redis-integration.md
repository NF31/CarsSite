# Intégration Redis

Ce document décrit l'intégration de Redis dans l'application pour le cache et le rate-limiting.

## Configuration

### Variables d'environnement

Assurez-vous d'avoir la variable `REDIS_URL` configurée dans votre fichier `.env` :

```env
REDIS_URL="rediss://default:password@host:6379"
```

Pour Upstash Redis, la connexion utilise le protocole `rediss://` (Redis avec SSL).

### Installation

Redis est déjà installé via `ioredis` :

```bash
npm install ioredis
```

## Architecture

### Client Redis

Le client Redis est géré via un singleton dans `lib/redis.ts` :

- **Connexion unique** : Une seule instance Redis est créée et réutilisée
- **Gestion d'erreurs** : Retry automatique en cas d'échec de connexion
- **Fallback** : Si Redis n'est pas disponible, les fonctions utilisent automatiquement Prisma comme fallback

### Cache

Le système de cache est implémenté dans `lib/cache.ts` avec les fonctionnalités suivantes :

- **Préfixes** : Organisation des clés par type d'entité (`VEHICLE`, `LOCATION`, etc.)
- **TTL** : Durées de cache configurables par type
- **Invalidation** : Fonctions pour invalider le cache lors des mises à jour

#### Utilisation du cache

```typescript
import { getOrSetCache, CACHE_PREFIXES, CACHE_TTL } from "@/lib/cache";

// Récupérer ou mettre en cache une valeur
const data = await getOrSetCache(
  "cache-key",
  async () => {
    // Fonction qui récupère les données depuis la base
    return await prisma.vehicle.findMany();
  },
  {
    prefix: CACHE_PREFIXES.VEHICLES_LIST,
    ttl: CACHE_TTL.VEHICLES_LIST,
  }
);
```

#### Invalidation du cache

```typescript
import { invalidateVehiclesCache } from "@/lib/cache-invalidation";

// Après création/mise à jour d'un véhicule
await invalidateVehiclesCache();
```

### Rate Limiting

Le rate-limiting utilise Redis pour un meilleur performance. L'implémentation se trouve dans `lib/rate-limit-redis.ts`.

#### Fonctionnalités

- **Fallback automatique** : Si Redis n'est pas disponible, utilise Prisma
- **Double vérification** : Par email ET par IP pour une meilleure sécurité
- **Configurations** : Différentes limites pour login, reset password, etc.

#### Utilisation

```typescript
import {
  checkLoginRateLimitRedis,
  recordLoginAttemptRedis,
} from "@/lib/rate-limit-redis";

// Vérifier le rate limit
const rateLimit = await checkLoginRateLimitRedis(email, ipAddress);
if (!rateLimit.allowed) {
  return { error: "Trop de tentatives" };
}

// Enregistrer une tentative
await recordLoginAttemptRedis(email, ipAddress);
```

## Intégrations existantes

### Cache

- **Locations** : `actions/admin/vehicles/get-locations.ts`
- **Véhicules** : `actions/admin/vehicles/actions.ts` (listes filtrées)

### Rate Limiting

- **Login** : `actions/auth/login/actions.ts`
- **Password Reset** : `actions/auth/forgot-password/actions.ts`

### Invalidation automatique

- **Création véhicule** : `actions/admin/vehicles/create.ts`
- **Mise à jour véhicule** : `actions/admin/vehicles/update.ts`

## Durées de cache (TTL)

| Type | Durée | Description |
|------|-------|-------------|
| `VEHICLES_LIST` | 5 minutes | Listes de véhicules avec filtres |
| `VEHICLE` | 15 minutes | Détails d'un véhicule |
| `LOCATIONS_LIST` | 30 minutes | Liste des locations actives |
| `LOCATION` | 30 minutes | Détails d'une location |

## Rate Limiting - Configurations

| Type | Max tentatives | Fenêtre |
|------|----------------|---------|
| Login | 5 | 15 minutes |
| Password Reset | 3 | 1 minute |
| Par défaut | 3 | 1 heure |

## Monitoring

### Vérifier la disponibilité de Redis

```typescript
import { isRedisAvailable } from "@/lib/redis";

const available = await isRedisAvailable();
console.log("Redis available:", available);
```

### Logs

Le client Redis log automatiquement :
- Connexion réussie
- Erreurs de connexion
- Erreurs lors des opérations

## Bonnes pratiques

1. **Toujours utiliser `getOrSetCache`** pour les données fréquemment accédées
2. **Invalider le cache** après chaque modification (création, mise à jour, suppression)
3. **Ne pas mettre en cache** les recherches textuelles (trop variables)
4. **Utiliser des TTL appropriés** selon la fréquence de mise à jour des données
5. **Gérer les erreurs** : Le système fallback vers Prisma si Redis échoue

## Troubleshooting

### Redis non disponible

Si Redis n'est pas disponible, le système utilise automatiquement Prisma comme fallback. Vérifiez :

1. La variable `REDIS_URL` est correctement configurée
2. La connexion réseau vers Redis est accessible
3. Les logs pour les erreurs de connexion

### Cache obsolète

Si vous voyez des données obsolètes :

1. Vérifiez que l'invalidation du cache est appelée après les modifications
2. Réduisez le TTL si nécessaire
3. Invalidez manuellement le cache si besoin

### Performance

Pour optimiser les performances :

1. Utilisez des clés de cache spécifiques (basées sur les filtres)
2. Évitez de mettre en cache les requêtes avec trop de variations
3. Surveillez la taille du cache Redis

