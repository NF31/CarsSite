# Stratégie de Cache Redis

## Important : Cache vs Queue

**Redis est un CACHE, pas une QUEUE** :
- **Cache** : Stocke temporairement des données pour accès rapide
- **Queue** : Pour les emails en arrière-plan, il faudrait un système comme **Bull/BullMQ** avec Redis

Le cache ne se "relance" pas seul - il stocke juste des données avec expiration (TTL).

---

## Où utiliser le cache (priorités)

### **Déjà implémenté**

1. **Locations** (`actions/admin/vehicles/get-locations.ts`)
   - Cache 30 minutes
   - Invalidation lors des modifications

2. **Véhicules** (`actions/admin/vehicles/actions.ts`)
   - Cache 5 minutes pour les listes filtrées
   - Invalidation lors création/mise à jour

3. **Rate-limiting** (toutes les actions d'auth)
   - Utilise Redis pour limiter les tentatives

---

### **À implémenter (priorité haute)**

#### 1. **Options de réservation** (`actions/admin/bookings/get-options.ts`)
**Pourquoi** : Chargé à chaque ouverture du formulaire de réservation
```typescript
// Cache les users, vehicles, locations, services
// TTL: 5 minutes (changement peu fréquent)
```

#### 2. **Settings/Configuration** (`actions/admin/settings/shared.ts`)
**Pourquoi** : Lus très souvent, changent rarement
```typescript
// Cache les settings admin
// TTL: 30 minutes
// Invalidation lors de la mise à jour des settings
```

#### 3. **Détails d'une réservation** (`actions/admin/bookings/get-booking.ts`)
**Pourquoi** : Consulté plusieurs fois après modification
```typescript
// Cache par bookingId
// TTL: 2 minutes (données peuvent changer)
// Invalidation lors de modification de la réservation
```

#### 4. **Services actifs** (utilisé dans plusieurs formulaires)
**Pourquoi** : Liste stable, consultée souvent
```typescript
// Cache la liste des services actifs
// TTL: 15 minutes
```

---

### **À implémenter (priorité moyenne)**

#### 5. **Réservations récentes client** (`actions/client/bookings/get-recent.ts`)
**Pourquoi** : Pagination, données historiques qui changent peu
```typescript
// Cache par userId + page
// TTL: 2 minutes (les nouvelles réservations doivent apparaître rapidement)
```

#### 6. **Liste des réservations admin** (`actions/admin/bookings/get-bookings.ts`)
**Pourquoi** : Pagination avec filtres complexes
```typescript
// Cache par combinaison de filtres + page
// TTL: 1 minute (données changent souvent)
// Ne pas cacher si recherche textuelle
```

#### 7. **Détails d'un véhicule** (`actions/admin/vehicles/get-by-id.ts`)
**Pourquoi** : Consulté souvent lors de l'édition
```typescript
// Cache par vehicleId
// TTL: 5 minutes
// Invalidation lors de modification
```

---

### **Ne PAS mettre en cache**

1. **Modifications de dates de réservation** (`actions/client/bookings/update-booking.ts`)
   - Données critiques, doivent être à jour immédiatement
   - Mais invalider le cache des réservations après modification

2. **Envoi d'emails**
   - Ne pas cacher (opération asynchrone)
   - **Pour une vraie queue d'emails** : Utiliser Bull/BullMQ

3. **Recherches textuelles**
   - Trop variables, cache inefficace

4. **Données utilisateur sensibles**
   - Mot de passe, tokens, etc.

---

## Implémentation recommandée

### Exemple : Cache des options de réservation

```typescript
// actions/admin/bookings/get-options.ts
import { getOrSetCache, CACHE_PREFIXES, CACHE_TTL } from "@/lib/cache";

export async function getBookingOptionsAction(
  params: GetBookingOptionsParams = {}
): Promise<GetBookingOptionsResult> {
  // ... auth check ...

  // Cache key basé sur les paramètres
  const cacheKey = `options:${JSON.stringify(params)}`;

  const data = await getOrSetCache(
    cacheKey,
    async () => {
      const [users, vehicles, locations, services] = await Promise.all([
        // ... requêtes Prisma ...
      ]);
      return { users, vehicles, locations, services };
    },
    {
      prefix: CACHE_PREFIXES.BOOKING,
      ttl: 5 * 60, // 5 minutes
    }
  );

  return { success: true, data };
}
```

### Exemple : Cache des settings

```typescript
// actions/admin/settings/shared.ts
import { getOrSetCache, CACHE_PREFIXES, CACHE_TTL } from "@/lib/cache";

export async function getAdminSettings(): Promise<AdminSettingsData> {
  return await getOrSetCache(
    "all",
    async () => {
      // ... récupération depuis Prisma ...
    },
    {
      prefix: "settings",
      ttl: CACHE_TTL.USER, // 10 minutes
    }
  );
}
```

### Invalidation lors des modifications

```typescript
// Après modification d'une réservation
import { invalidateCacheByPrefix } from "@/lib/cache";

// Invalider le cache des réservations
await invalidateCacheByPrefix(CACHE_PREFIXES.BOOKING);
```

---

## TTL recommandés par type

| Type de données | TTL | Raison |
|----------------|-----|--------|
| Settings | 10-30 min | Changent rarement |
| Locations | 30 min | Changent rarement |
| Services | 15 min | Changent peu |
| Véhicules (liste) | 5 min | Changent modérément |
| Options réservation | 5 min | Changent modérément |
| Réservations (liste) | 1-2 min | Changent souvent |
| Détails réservation | 2 min | Doivent être à jour |
| Détails véhicule | 5 min | Changent modérément |

---

## Pour une vraie queue d'emails

Si tu veux une queue pour les emails (envoi en arrière-plan), utilise **BullMQ** :

```bash
npm install bullmq
```

```typescript
// lib/email-queue.ts
import { Queue } from 'bullmq';
import { getRedisClient } from './redis';

const emailQueue = new Queue('emails', {
  connection: getRedisClient(),
});

export async function queueEmail(jobData: {
  type: 'confirmation' | 'update' | 'cancellation';
  to: string;
  data: any;
}) {
  await emailQueue.add('send-email', jobData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}
```

Mais pour l'instant, le cache suffit pour améliorer les performances !

