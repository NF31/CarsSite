# Workflow de Remboursement Complet

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Types de remboursements](#types-de-remboursements)
3. [Workflow de remboursement lors d'une annulation](#workflow-de-remboursement-lors-dune-annulation)
4. [Workflow de remboursement lors d'une modification](#workflow-de-remboursement-lors-dune-modification)
5. [Gestion des erreurs et cas limites](#gestion-des-erreurs-et-cas-limites)
6. [Détails techniques](#détails-techniques)

---

## Vue d'ensemble

Le système de remboursement gère automatiquement les remboursements via Stripe lors des annulations et modifications de réservation. Il prend en compte :

- Les remboursements partiels ou complets
- Les Payment Intents déjà partiellement remboursés
- Les paiements initiaux et les paiements de modification
- La synchronisation entre la base de données et Stripe
- Les cas où le Payment Intent n'existe plus ou a été complètement remboursé

**Fichier principal :** `actions/public/payments/create-refund.ts`

---

## Types de remboursements

### 1. Remboursement d'annulation (`reason: "cancellation"`)

Lorsqu'un admin accepte une demande d'annulation de réservation, un remboursement est créé selon le taux de remboursement calculé.

### 2. Remboursement de modification (`reason: "booking_modification"`)

Lorsqu'une modification de dates réduit le prix total, un remboursement de la différence d'acompte est effectué.

---

## Workflow de remboursement lors d'une annulation

### Étape 1 : Le client demande l'annulation

**Fichier :** `actions/client/bookings/cancel-booking.ts`

1. **Calcul du taux de remboursement :**
   ```typescript
   const refundRate = computeRefundRate(booking.startDate, now);
   // - > 7 jours avant : 100% (taux = 1)
   // - 3 à 7 jours avant : 50% (taux = 0.5)
   // - < 3 jours avant : 0% (taux = 0)
   ```

2. **Calcul du montant à rembourser :**
   ```typescript
   const refundAmount = depositPaid * refundRate;
   const retentionAmount = depositPaid - refundAmount;
   ```

3. **Mise à jour de la réservation :**
   ```typescript
   {
     status: PENDING (ou reste CONFIRMED),
     cancellationRequested: true,
     cancellationRequestedAt: maintenant,
     cancellationRequestedRefundRate: refundRate,
     cancellationPreviousStatus: statut avant annulation
   }
   ```

### Étape 2 : L'admin accepte l'annulation

**Fichier :** `actions/admin/bookings/moderate-booking.ts` → `moderateBookingStatusAction()`

1. **Calcul du remboursement final :**
   ```typescript
   const refundRate = booking.cancellationRequestedRefundRate ?? computeRefundRate(...);
   const refundAmount = depositPaid * refundRate;
   ```

2. **Création du remboursement Stripe :**
   ```typescript
   if (refundAmount > 0 && depositPaid > 0) {
     const refundResult = await createRefundAction({
       bookingId: booking.id,
       amount: refundAmount,
       reason: "cancellation",
     });
   }
   ```

3. **Gestion des erreurs récupérables :**
   - Si le Payment Intent a déjà été complètement remboursé, l'annulation est quand même acceptée
   - L'erreur est considérée comme "récupérable" et ne bloque pas le processus

### Étape 3 : Traitement du remboursement dans `createRefundAction`

**Fichier :** `actions/public/payments/create-refund.ts`

1. **Récupération de la réservation et des paiements :**
   ```typescript
   const booking = await prisma.booking.findUnique({
     where: { id: bookingId },
     select: {
       depositPaid: true,
       originalDepositPaid: true, // Pour les modifications
       payments: {
         where: {
           method: "STRIPE",
           status: { in: ["COMPLETED", "PENDING"] },
           amount: { gt: 0 }
         }
       }
     }
   });
   ```

2. **Sélection du paiement à rembourser :**
   - Pour les annulations : utilise le premier paiement (paiement initial)
   - Pour les modifications : cherche le paiement initial (non-modification)

3. **Récupération du Payment Intent ID :**
   - Depuis les métadonnées du paiement : `metadata.stripePaymentIntentId`
   - Depuis la session Stripe : `stripe.checkout.sessions.retrieve(sessionId)`
   - Recherche directe dans Stripe si le paiement n'existe pas en DB

4. **Vérification des remboursements existants :**
   ```typescript
   const existingRefunds = await stripe.refunds.list({
     payment_intent: paymentIntentId,
     limit: 100,
   });
   
   const totalRefunded = existingRefunds.data.reduce((sum, refund) => 
     sum + (refund.amount || 0), 0
   );
   
   const originalAmount = paymentIntent.amount;
   const refundableAmount = (originalAmount - totalRefunded) / 100; // En euros
   ```

5. **Vérification du montant remboursable :**
   ```typescript
   // ⚠️ VÉRIFICATION CRITIQUE : Si le montant remboursable est <= 0
   if (refundableAmount <= 0) {
     return {
       success: false,
       error: "Le Payment Intent a déjà été complètement remboursé. Montant remboursable disponible : 0.00€."
     };
   }
   
   // Vérifier que le montant demandé ne dépasse pas le montant remboursable
   if (input.amount > refundableAmount) {
     return {
       success: false,
       error: `Le montant du remboursement (${input.amount}€) dépasse le montant remboursable disponible (${refundableAmount}€).`
     };
   }
   ```

6. **Création du remboursement Stripe :**
   ```typescript
   const refund = await stripe.refunds.create({
     payment_intent: paymentIntentId,
     amount: effectiveRefundAmountInCents, // Montant réellement remboursable
     reason: "requested_by_customer",
     metadata: {
       bookingId: booking.id,
       bookingReference: booking.reference,
       reason: input.reason,
       requestedAmount: input.amount,
       effectiveRefundAmount: effectiveRefundAmount,
       isPartialRefund: (effectiveRefundAmount < input.amount).toString(),
     },
   });
   ```

7. **Enregistrement dans la base de données :**
   ```typescript
   const createdRefundPayment = await prisma.payment.create({
     data: {
       bookingId: booking.id,
       userId: booking.userId,
       amount: -effectiveRefundAmount, // Montant négatif pour un remboursement
       method: "STRIPE",
       status: refund.status === "succeeded" ? "COMPLETED" : "PENDING",
       transactionId: refund.id,
       metadata: {
         stripeRefundId: refund.id,
         stripePaymentIntentId: paymentIntentId,
         reason: input.reason,
         originalPaymentId: payment.id,
         requestedAmount: input.amount,
         effectiveRefundAmount: effectiveRefundAmount,
         isPartialRefund: effectiveRefundAmount < input.amount,
       },
     },
   });
   ```

8. **Mise à jour de l'acompte payé :**
   ```typescript
   await prisma.booking.update({
     where: { id: booking.id },
     data: {
       depositPaid: {
         decrement: effectiveRefundAmount, // Réduire l'acompte payé
       },
     },
   });
   ```

### Étape 4 : Webhook Stripe (Confirmation du remboursement)

**Fichier :** `app/api/webhooks/stripe/route.ts`

Quand Stripe confirme le remboursement :

1. **Événements reçus :**
   - `charge.refunded`
   - `refund.created`
   - `refund.updated`

2. **Mise à jour du statut du paiement :**
   - Le paiement associé passe en statut `COMPLETED` (remboursement réussi)
   - Métadonnées mises à jour avec les infos du remboursement

---

## Workflow de remboursement lors d'une modification

### Étape 1 : Le client demande une modification de dates

**Fichier :** `actions/client/bookings/update-booking.ts`

1. **Calcul de la différence de prix :**
   ```typescript
   const newTotalPrice = calculateTotalPrice(newStartDate, newEndDate, vehicle);
   const depositDifference = newDepositPaid - originalDepositPaid;
   ```

2. **Stockage des données originales :**
   ```typescript
   {
     originalStartDate: booking.startDate,
     originalEndDate: booking.endDate,
     originalTotalPrice: booking.totalPrice,
     originalDepositPaid: booking.depositPaid,
     modificationDepositDifference: depositDifference, // Peut être négatif (remboursement)
     modificationRequested: true
   }
   ```

### Étape 2 : L'admin accepte la modification

**Fichier :** `actions/admin/bookings/moderate-booking.ts` → `handleModificationRequest()`

1. **Calcul de la différence d'acompte :**
   ```typescript
   const depositDifference = booking.depositPaid - originalDepositPaid;
   // Si < 0 : remboursement nécessaire
   // Si > 0 : paiement supplémentaire nécessaire
   ```

2. **Création du remboursement si nécessaire :**
   ```typescript
   if (depositDifference < 0 && originalDepositPaid > 0) {
     const refundAmount = Math.abs(depositDifference);
     const refundResult = await createRefundAction({
       bookingId: booking.id,
       amount: refundAmount,
       reason: "booking_modification",
     });
   }
   ```

3. **Recherche du paiement initial :**
   - Pour les modifications, le système cherche spécifiquement le **paiement initial** (non-modification)
   - Utilise `originalDepositPaid` pour trouver le bon paiement
   - Si le paiement n'existe pas en DB, recherche dans Stripe via l'API

### Étape 3 : Traitement du remboursement de modification

Le processus est similaire au remboursement d'annulation, mais avec des spécificités :

1. **Recherche du paiement initial :**
   - Filtre les paiements pour exclure ceux avec `isModificationPayment: true`
   - Cherche un paiement qui correspond à `originalDepositPaid` (tolérance de 5€)
   - Si non trouvé en DB, recherche dans Stripe via l'API

2. **Gestion des remboursements partiels :**
   - Si le Payment Intent a déjà été partiellement remboursé, on rembourse seulement le montant disponible
   - Un message d'avertissement est retourné pour informer de la différence

---

## Gestion des erreurs et cas limites

### 1. Payment Intent déjà complètement remboursé

**Problème :** Le Payment Intent a déjà été remboursé (ex: lors d'une annulation précédente ou d'une modification).

**Solution :**
```typescript
if (refundableAmount <= 0) {
  return {
    success: false,
    error: "Le Payment Intent a déjà été complètement remboursé. Montant remboursable disponible : 0.00€."
  };
}
```

**Gestion dans `moderate-booking.ts` :**
- L'erreur est considérée comme "récupérable"
- L'annulation/modification est quand même acceptée
- Aucun remboursement automatique n'est effectué
- L'admin est informé que le remboursement a déjà été géré

### 2. Paiement initial introuvable dans la base de données

**Problème :** Le paiement initial n'existe pas en DB (ex: après une migration ou une suppression).

**Solution :**
- Recherche directe dans Stripe via l'API
- Filtrage par métadonnées (`bookingId`, `bookingReference`)
- Si non trouvé, recherche par montant seul (tolérance de 5€)
- Utilisation des Checkout Sessions comme fallback

### 3. Montant remboursable insuffisant

**Problème :** Le montant demandé dépasse le montant remboursable disponible.

**Solution :**
```typescript
if (input.amount > refundableAmount) {
  return {
    success: false,
    error: `Le montant du remboursement (${input.amount}€) dépasse le montant remboursable disponible (${refundableAmount}€).`
  };
}
```

### 4. Remboursement partiel

**Cas :** Le montant remboursable est inférieur au montant demandé (ex: Payment Intent partiellement remboursé).

**Solution :**
- Le système rembourse le **montant maximum disponible**
- Un message d'avertissement est retourné
- Les métadonnées indiquent `isPartialRefund: true`

---

## Détails techniques

### Calcul du montant remboursable

```typescript
// 1. Récupérer tous les remboursements existants sur le Payment Intent
const existingRefunds = await stripe.refunds.list({
  payment_intent: paymentIntentId,
  limit: 100,
});

// 2. Calculer le total remboursé
const totalRefunded = existingRefunds.data.reduce((sum, refund) => 
  sum + (refund.amount || 0), 0
); // En centimes

// 3. Calculer le montant remboursable
const originalAmount = paymentIntent.amount; // En centimes
const refundableAmountInCents = originalAmount - totalRefunded;
const refundableAmount = refundableAmountInCents / 100; // En euros
```

### Sélection du paiement à rembourser

**Pour les annulations :**
```typescript
// Utilise le premier paiement (le plus ancien)
payment = booking.payments[0];
```

**Pour les modifications :**
```typescript
// 1. Chercher un paiement qui correspond à originalDepositPaid
//    et qui n'est PAS un paiement de modification
let initialPayment = booking.payments.find(p => {
  const metadata = p.metadata as PaymentMetadata;
  const isModificationPayment = metadata?.isModificationPayment === true;
  const matchesAmount = Math.abs(p.amount - originalDepositPaid) < 5;
  return !isModificationPayment && matchesAmount;
});

// 2. Si non trouvé, prendre le paiement le plus ancien non-modification
if (!initialPayment) {
  initialPayment = booking.payments.find(p => {
    const metadata = p.metadata as PaymentMetadata;
    return metadata?.isModificationPayment !== true;
  });
}

// 3. Si toujours non trouvé, rechercher dans Stripe
```

### Synchronisation avec Stripe

**Stratégie de recherche :**
1. **Dans la base de données :** Recherche directe dans la table `Payment`
2. **Dans Stripe (métadonnées) :** Recherche par `bookingId` ou `bookingReference`
3. **Dans Stripe (montant) :** Recherche par montant seul si les métadonnées sont absentes
4. **Via Checkout Sessions :** Utilisation des Checkout Sessions comme fallback

### Logs et débogage

Le système génère des logs détaillés à chaque étape :

```
[Refund] 🔄 Début du processus de remboursement
[Refund] ✅ Réservation trouvée
[Refund] 💳 Paiement sélectionné pour le remboursement
[Refund] 🔍 Recherche du Payment Intent dans les métadonnées
[Refund] 🔍 Vérification des remboursements existants sur le Payment Intent
[Refund] 💰 Vérification du montant remboursable
[Refund] 💳 Création du remboursement Stripe
[Refund] 💾 Enregistrement du remboursement dans la base de données
[Refund] ✅ Remboursement créé avec succès
```

---

## Tableau récapitulatif des cas d'usage

| Cas | Montant demandé | Montant remboursable | Résultat | Message |
|-----|----------------|---------------------|----------|---------|
| **Paiement initial non remboursé** | 100€ | 100€ | Remboursement complet de 100€ | Succès |
| **Payment Intent partiellement remboursé** | 100€ | 50€ | Attention : Remboursement partiel de 50€ | Avertissement |
| **Payment Intent complètement remboursé** | 100€ | 0€ | Non Erreur récupérable | Annulation acceptée sans remboursement |
| **Montant demandé trop élevé** | 100€ | 50€ | Non Erreur | Montant dépasse le remboursable |

---

## Sécurité et validations

1. **Vérification du montant :** Le montant doit être > 0
2. **Vérification du Payment Intent :** Le Payment Intent doit exister et être en statut `succeeded`
3. **Vérification du montant remboursable :** Le montant remboursable doit être > 0
4. **Limitation du montant :** Le montant remboursé ne peut pas dépasser le montant remboursable
5. **Enregistrement dans la DB :** Tous les remboursements sont enregistrés dans la table `Payment`

---

## Notes importantes

- Les remboursements sont **irréversibles** dans Stripe
- Les remboursements partiels sont supportés
- Le système gère automatiquement les cas où le Payment Intent a déjà été remboursé
- Les remboursements sont enregistrés comme des paiements négatifs dans la table `Payment`
- Le `depositPaid` de la réservation est automatiquement mis à jour après un remboursement

---

**Dernière mise à jour :** 21 novembre 2025

