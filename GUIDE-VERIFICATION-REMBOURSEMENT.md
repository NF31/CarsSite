# Guide de vérification des remboursements

## 📋 Comment vérifier qu'un remboursement a été effectué

### 1. Vérification dans les logs serveur

Après avoir cliqué sur "Valider" une modification, vérifiez les logs dans votre terminal :

#### ✅ Logs à rechercher :

**Étape 1 : Recherche du paiement initial**
```
[Refund] 🔍 Recherche du paiement initial pour modification
[Refund] ⚠️  Aucun paiement non-modification trouvé dans la DB, mais originalDepositPaid existe
[Refund] 🔍 Recherche du paiement initial dans Stripe via l'API...
```

**Étape 2 : Résultat de la recherche Stripe**
- ✅ **Succès** : `[Refund] ✅ Payment Intent initial trouvé dans Stripe`
- ❌ **Échec** : `[Refund] ⚠️  Aucun Payment Intent initial trouvé dans Stripe`

**Étape 3 : Création du remboursement**
```
[Refund] 💾 Enregistrement du remboursement dans la base de données
[Refund] ✅ Remboursement créé avec succès
[Refund] ✅ Remboursement enregistré dans la table Payment
```

**Étape 4 : Mise à jour de la réservation**
```
[Refund] ✅ depositPaid mis à jour
```

### 2. Vérification dans Stripe Dashboard

1. Allez sur https://dashboard.stripe.com/test/refunds (mode test) ou https://dashboard.stripe.com/refunds (mode production)
2. Recherchez le remboursement par :
   - **Refund ID** : visible dans les logs `refundId: re_xxxxx`
   - **Payment Intent ID** : visible dans les logs `paymentIntentId: pi_xxxxx`
   - **Métadonnées** : `bookingId` ou `bookingReference` dans les métadonnées du remboursement

3. Vérifiez :
   - ✅ **Status** : `succeeded` (réussi) ou `pending` (en attente)
   - ✅ **Amount** : doit correspondre au montant à rembourser
   - ✅ **Metadata** : doit contenir `bookingId`, `bookingReference`, `reason`

### 3. Vérification dans la base de données

#### Via Prisma Studio (recommandé)
```bash
npx prisma studio
```

1. Ouvrez la table `Payment`
2. Filtrez par `bookingId` de la réservation
3. Recherchez un paiement avec :
   - ✅ **amount** : négatif (ex: `-684.00`)
   - ✅ **method** : `STRIPE`
   - ✅ **status** : `COMPLETED` ou `PENDING`
   - ✅ **transactionId** : commence par `re_` (ID du remboursement Stripe)
   - ✅ **metadata** : contient `stripeRefundId`, `stripePaymentIntentId`, `reason: "booking_modification"`

#### Via requête SQL directe
```sql
SELECT * FROM payments 
WHERE "bookingId" = 'cmi6j5wk40005ft1kk3hftmb1' 
AND amount < 0 
ORDER BY "createdAt" DESC;
```

### 4. Vérification de la réservation

#### Vérifier que `depositPaid` a été mis à jour
```sql
SELECT 
  id,
  reference,
  "depositPaid",
  "originalDepositPaid",
  "modificationDepositDifference",
  status
FROM bookings 
WHERE id = 'cmi6j5wk40005ft1kk3hftmb1';
```

**Résultat attendu après remboursement :**
- `depositPaid` : doit être réduit du montant remboursé
- `modificationDepositDifference` : doit être `null` (nettoyé après remboursement)

### 5. Vérification via webhook Stripe

Si le webhook Stripe est configuré, vous devriez voir dans les logs :

```
[Stripe Webhook] 💰 Event refund.created reçu
[Stripe Webhook] ✅ Statut du remboursement mis à jour
```

**Pour vérifier les webhooks Stripe :**
1. Allez sur https://dashboard.stripe.com/test/webhooks (mode test)
2. Cliquez sur votre endpoint webhook
3. Vérifiez les événements `refund.created`, `refund.updated`, `charge.refunded`

### 6. Checklist complète de vérification

- [ ] **Logs serveur** : Recherche Stripe effectuée
- [ ] **Logs serveur** : Payment Intent trouvé OU message d'erreur clair
- [ ] **Logs serveur** : Remboursement créé avec succès
- [ ] **Stripe Dashboard** : Remboursement visible avec status `succeeded`
- [ ] **Base de données** : Enregistrement Payment créé (montant négatif)
- [ ] **Base de données** : `depositPaid` mis à jour correctement
- [ ] **Base de données** : `modificationDepositDifference` nettoyé
- [ ] **Webhook** : Événement `refund.created` reçu (si configuré)

### 7. Cas d'erreur courants

#### ❌ "Montant insuffisant"
**Cause** : Le paiement initial n'existe ni en DB ni dans Stripe
**Solution** : Remboursement manuel requis via Stripe Dashboard

#### ❌ "Impossible de trouver le Payment Intent"
**Cause** : Le Payment Intent n'a pas été trouvé dans les métadonnées
**Solution** : Vérifier les logs pour voir quelle étape a échoué

#### ❌ "Payment Intent non trouvé dans Stripe"
**Cause** : Le paiement initial n'existe pas dans Stripe (peut-être supprimé)
**Solution** : Remboursement manuel requis

### 8. Commandes utiles pour le débogage

#### Voir tous les remboursements d'une réservation
```sql
SELECT 
  p.id,
  p.amount,
  p.status,
  p."transactionId",
  p."createdAt",
  p.metadata
FROM payments p
WHERE p."bookingId" = 'cmi6j5wk40005ft1kk3hftmb1'
AND p.amount < 0
ORDER BY p."createdAt" DESC;
```

#### Voir tous les paiements d'une réservation
```sql
SELECT 
  p.id,
  p.amount,
  p.status,
  p.method,
  p."transactionId",
  p."createdAt",
  p.metadata->>'isModificationPayment' as is_modification
FROM payments p
WHERE p."bookingId" = 'cmi6j5wk40005ft1kk3hftmb1'
ORDER BY p."createdAt" ASC;
```

#### Vérifier l'état actuel de la réservation
```sql
SELECT 
  reference,
  status,
  "depositPaid",
  "originalDepositPaid",
  "modificationDepositDifference",
  "totalPrice",
  "remainingAmount"
FROM bookings
WHERE id = 'cmi6j5wk40005ft1kk3hftmb1';
```



