# 🔍 Vérification des Flux et Analyse des Problèmes de Cache

## ✅ Vérification : Les Flux Correspondent-ils au Code ?

### 📋 Workflow Annulation - Vérification

#### ✅ Étape 1 : Client Demande l'Annulation
**Fichier documenté :** `docs/workflow-annulation-reservation.md`
**Code réel :** `actions/client/bookings/cancel-booking.ts`

**Vérification :**
- ✅ Calcul du remboursement : `computeRefundRate()` existe (lignes 21-31)
- ✅ Mise à jour DB avec `cancellationRequested: true` : ✅ (lignes 188-198)
- ✅ Email envoyé : ✅ (lignes 211-263)
- ✅ `revalidatePath()` appelé : ✅ (lignes 266-270)
- ✅ `invalidateBookingCache()` appelé : ✅ (lignes 273-276)
- ✅ `router.refresh()` dans le dialog : ✅ (`CancelBookingDialog.tsx` ligne 155)

**Status : ✅ CONFORME**

#### ✅ Étape 2 : Admin Accepte/Rejette
**Fichier documenté :** `docs/workflow-annulation-reservation.md`
**Code réel :** `actions/admin/bookings/moderate-booking.ts`

**Vérification :**
- ✅ Acceptation avec remboursement : ✅ (lignes 897-915)
- ✅ Rejet (Conserver la réservation) : ✅ (lignes 1015-1060)
- ✅ `revalidatePath()` appelé : ✅ (lignes 1206-1211)
- ✅ `invalidateBookingCache()` appelé : ✅ (lignes 1214-1222)

**Status : ✅ CONFORME**

---

### 📋 Workflow Modification Dates - Vérification

#### ✅ Étape 1 : Client Modifie les Dates
**Fichier documenté :** `docs/workflow-modification-dates-complet.md`
**Code réel :** `actions/client/bookings/update-booking.ts`

**Vérification :**
- ✅ Calcul du nouveau prix : ✅ `calculateBookingPriceAction()` (lignes 238-245)
- ✅ Stockage dates originales : ✅ (lignes 315-319)
- ✅ `modificationRequested: true` : ✅ (ligne 312)
- ✅ Email envoyé : ✅ (lignes 374-415)
- ✅ `revalidatePath()` appelé : ✅ (lignes 418-422)
- ✅ `invalidateBookingCache()` appelé : ✅ (lignes 425-428)
- ✅ `router.refresh()` dans le dialog : ✅ (`EditBookingDialog.tsx` ligne 201)

**Status : ✅ CONFORME**

#### ✅ Étape 2 : Admin Valide la Modification
**Fichier documenté :** `docs/workflow-modification-dates-complet.md`
**Code réel :** `actions/admin/bookings/moderate-booking.ts` → `handleModificationRequest()`

**Vérification :**
- ✅ Remboursement si différence < 0 : ✅ (lignes 187-242)
- ✅ Session Stripe si différence > 0 : ✅ (lignes 244-297)
- ✅ Statut PENDING si paiement nécessaire : ✅ (ligne 334)
- ✅ Statut CONFIRMED si pas de paiement : ✅ (ligne 287)
- ✅ `revalidatePath()` appelé : ✅ (lignes 1206-1211)
- ✅ `invalidateBookingCache()` appelé : ✅ (lignes 1214-1222)

**Status : ✅ CONFORME**

#### ⚠️ Étape 3 : Webhook Stripe (Paiement Modification)
**Fichier documenté :** `docs/workflow-modification-dates-complet.md`
**Code réel :** `app/api/webhooks/stripe/route.ts`

**Vérification :**
- ✅ Détection paiement modification : ✅ (lignes ~500-550)
- ✅ Mise à jour `depositPaid` : ✅ (lignes ~600-650)
- ✅ Statut → CONFIRMED : ✅ (ligne ~670)
- ❌ **`revalidatePath()` NON appelé** : ❌ MANQUANT
- ❌ **`invalidateBookingCache()` NON appelé** : ❌ MANQUANT

**Status : ⚠️ PROBLÈME DÉTECTÉ**

---

## 🚨 Problèmes de Cache Identifiés

### ⚠️ Problème 1 : Webhook Stripe Ne Détruit Pas le Cache

**Localisation :** `app/api/webhooks/stripe/route.ts`

**Problème :**
Quand le webhook Stripe met à jour une réservation (paiement supplémentaire, remboursement), il met à jour la base de données MAIS ne détruit pas le cache Next.js.

**Conséquence :**
- Les pages client et admin peuvent afficher des données **obsolètes** même après la mise à jour en DB
- Le statut peut rester `PENDING` dans l'interface alors qu'il est `CONFIRMED` en DB
- Le `depositPaid` peut ne pas être mis à jour dans l'interface

**Solutions actuelles :**
- `revalidatePath()` : ❌ NON appelé dans le webhook
- `invalidateBookingCache()` : ❌ NON appelé dans le webhook
- `router.refresh()` : ❌ Ne peut pas être appelé depuis le webhook (pas de router côté serveur)

**Solution recommandée :**
Ajouter l'invalidation de cache dans le webhook Stripe après chaque mise à jour de réservation.

---

### ⚠️ Problème 2 : Cache du Navigateur

**Problème potentiel :**
Le cache du navigateur peut conserver des pages HTML ou des données API même après que le serveur ait invalidé son cache.

**Conséquences possibles :**
1. **Cache HTTP du navigateur** :
   - Le navigateur peut mettre en cache les réponses API
   - Les pages peuvent être mises en cache même si Next.js les revalide

2. **Cache des composants React** :
   - Les composants React peuvent garder des états en mémoire
   - `router.refresh()` force un refresh, mais peut ne pas être immédiat

3. **Service Workers** :
   - Si un service worker est utilisé, il peut intercepter les requêtes
   - Peut servir des versions mises en cache même après invalidation serveur

**Solutions actuelles :**
- ✅ `router.refresh()` appelé dans les dialogs après succès (1 seconde de délai)
- ❌ Pas de headers `Cache-Control` explicites pour éviter le cache navigateur
- ❌ Pas de mécanisme de cache-busting avec versioning

---

### ⚠️ Problème 3 : Timing de Refresh

**Localisation :** `components/client/dashboard/*Dialog.tsx`

**Problème potentiel :**
Les dialogs appellent `router.refresh()` avec un délai de 1 seconde après le succès. Si le webhook Stripe met à jour la DB APRÈS ce refresh, les données restent obsolètes.

**Séquence problématique :**
1. Client paie sur Stripe → Redirection vers `/bookings/payment/success`
2. Page de succès appelle `router.refresh()` immédiatement
3. Webhook Stripe arrive **après** (délai réseau Stripe)
4. Résultat : Page affiche statut `PENDING` au lieu de `CONFIRMED`

**Solution actuelle :**
- La page de succès attend le webhook avant d'afficher CONFIRMED
- Mais si l'utilisateur navigue ailleurs puis revient, le cache peut être obsolète

---

## 🔧 Corrections Recommandées

### ✅ Correction 1 : Ajouter l'Invalidation de Cache dans le Webhook

**Fichier à modifier :** `app/api/webhooks/stripe/route.ts`

**Action :** Ajouter après chaque mise à jour de réservation :

```typescript
// Après la mise à jour de la réservation dans le webhook
const { invalidateBookingCache } = await import("@/lib/cache-invalidation");
await invalidateBookingCache(booking.id).catch((error) => {
  console.error("Error invalidating booking cache:", error);
});

// Revalider les chemins Next.js
import { revalidatePath } from "next/cache";
revalidatePath("/dashboard");
revalidatePath("/admin/bookings");
revalidatePath(`/admin/bookings/${booking.id}`);
revalidatePath("/admin/dashboard");
```

**Localisation :**
- Après mise à jour dans `checkout.session.completed` (paiement modification)
- Après mise à jour dans `charge.refunded` (remboursement)
- Après mise à jour dans `refund.created/updated` (remboursement)

---

### ✅ Correction 2 : Headers Cache-Control

**Fichier à modifier :** Pages client et admin qui affichent les réservations

**Action :** Ajouter des headers pour éviter le cache navigateur :

```typescript
// Dans les pages ou API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

**Ou dans les routes API :**
```typescript
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
```

---

### ✅ Correction 3 : Polling ou WebSocket (Optionnel)

**Pour les cas critiques :**
- Implémenter un mécanisme de polling sur les pages de réservation
- Ou utiliser WebSockets pour mettre à jour en temps réel
- Ou utiliser Server-Sent Events (SSE) pour les notifications

**Cependant :**
- Ces solutions sont complexes et peuvent surcharger le serveur
- La solution recommandée est de bien invalider le cache côté serveur

---

## 📊 Résumé des Problèmes

| Problème | Localisation | Impact | Solution |
|----------|--------------|--------|----------|
| **Webhook sans invalidation cache** | `app/api/webhooks/stripe/route.ts` | 🔴 Élevé | Ajouter `revalidatePath()` et `invalidateBookingCache()` |
| **Cache navigateur persistant** | Pages client/admin | 🟡 Moyen | Headers `Cache-Control`, `dynamic = 'force-dynamic'` |
| **Timing de refresh** | Dialogs client | 🟡 Moyen | Augmenter délai ou implémenter polling |
| **Cache Redis non invalidé** | Webhook | 🔴 Élevé | Appeler `invalidateBookingCache()` dans webhook |

---

## 🎯 Actions Immédiates Requises

### 1. Priorité HAUTE : Invalider le Cache dans le Webhook Stripe

**Fichier :** `app/api/webhooks/stripe/route.ts`

**Ajouter après chaque mise à jour de réservation :**
```typescript
// Invalider le cache après mise à jour
const { invalidateBookingCache } = await import("@/lib/cache-invalidation");
await invalidateBookingCache(booking.id).catch((error) => {
  console.error("[Stripe Webhook] Error invalidating booking cache:", error);
});

// Revalider les pages Next.js
import { revalidatePath } from "next/cache";
revalidatePath("/dashboard");
revalidatePath("/admin/bookings");
revalidatePath(`/admin/bookings/${booking.id}`);
revalidatePath("/admin/dashboard");
```

### 2. Priorité MOYENNE : Headers Cache-Control

**Ajouter dans les pages critiques :**
- `/dashboard` (réservations client)
- `/admin/bookings` (liste réservations admin)
- `/admin/bookings/[id]` (détails réservation admin)

```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

---

## ✅ Conclusion

**Les flux décrits dans les documents .md correspondent bien au code**, mais il y a un **problème critique** : le webhook Stripe ne détruit pas le cache, ce qui peut causer des **désynchronisations** entre la base de données et l'interface.

**Recommandation :** Implémenter la correction 1 (invalidation de cache dans le webhook) en priorité.


