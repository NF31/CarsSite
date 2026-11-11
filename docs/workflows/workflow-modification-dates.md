# Workflow de Modification des Dates de Réservation

## Vue d'ensemble

Quand un utilisateur modifie les dates d'une réservation, plusieurs étapes se déroulent automatiquement pour recalculer les prix, gérer les remboursements/paiements supplémentaires, et mettre à jour la réservation.

---

## Étape 1 : Ouverture du Dialog de Modification

**Fichier :** `components/client/dashboard/EditBookingDialog.tsx`

1. L'utilisateur clique sur "Modifier la réservation"
2. Le dialog s'ouvre avec les dates actuelles pré-remplies
3. Les champs sont initialisés avec :
   - `startDate` et `endDate` actuels
   - `depositPaid` (acompte déjà payé)
   - `securityDepositPaid` (caution déjà payée, si applicable)
   - `totalPrice` (prix actuel de la réservation)

---

## Étape 2 : Calcul en Temps Réel du Nouveau Prix

**Fichier :** `components/client/dashboard/EditBookingDialog.tsx` (lignes 115-184)

Quand l'utilisateur change les dates :

1. **Validation des dates** :
   - Vérifie que la date de fin est après la date de début
   - Vérifie que les dates sont dans le futur
   - Vérifie que les dates ont réellement changé

2. **Calcul du nouveau prix** :
   ```typescript
   calculateBookingPriceAction({
     vehicleId,
     startDate: nouvelles dates,
     endDate: nouvelles dates,
     startTime: heure de départ,
     endTime: heure de retour,
     serviceIds: services sélectionnés
   })
   ```

3. **Calculs effectués** :
   - `newTotalPrice` = prix du véhicule (prorata) + prix des services
   - `newDownPayment` = 30% de `newTotalPrice` (nouvel acompte)
   - `depositDifference` = `newDownPayment` - `oldDepositPaid` (différence)
   - `newRemainingAmount` = `newTotalPrice` - `newDownPayment` (nouveau solde)

4. **Affichage dans le dialog** :
   - Prix actuel vs nouveau prix
   - Acompte actuel vs nouvel acompte
   - **Caution déjà payée** (si `securityDepositPaid > 0`)
   - Différence d'acompte (en vert si remboursement, en rouge si paiement)
   - Message informatif selon le cas

---

## Étape 3 : Validation et Soumission

**Fichier :** `components/client/dashboard/EditBookingDialog.tsx` (lignes 186-231)

Quand l'utilisateur clique sur "Enregistrer les nouvelles dates" :

1. **Vérification de disponibilité** :
   - Vérifie que le véhicule est disponible pour les nouvelles dates
   - Vérifie qu'il n'y a pas de conflit avec d'autres réservations
   - Vérifie qu'il n'y a pas de maintenance prévue

2. **Soumission du formulaire** :
   - Appel à `updateClientBookingAction(formData)`

---

## Étape 4 : Traitement Serveur de la Modification (SANS Actions Stripe)

**Fichier :** `actions/client/bookings/update-booking.ts`

**IMPORTANT :**À cette étape, les remboursements et paiements Stripe ne sont **PAS**déclenchés. Ils le seront uniquement après validation par l'admin.

### 4.1 Validation et Vérifications

1. **Authentification** :
   - Vérifie que l'utilisateur est connecté
   - Vérifie le rate limiting (max 5 tentatives / 10 minutes)

2. **Validation des données** :
   - Vérifie que `bookingId` est valide
   - Vérifie que les dates sont valides
   - Vérifie que la date de départ est dans le futur
   - Vérifie que la date de fin est après la date de début

3. **Vérification de la réservation** :
   - Récupère la réservation existante avec :
     - `depositPaid` (acompte déjà payé)
     - `securityDepositPaid` (caution déjà payée)
     - `totalPrice` (prix actuel)
     - `status` (statut actuel)

4. **Vérifications de sécurité** :
   - Vérifie que la réservation appartient à l'utilisateur
   - Vérifie que la réservation n'a pas déjà commencé
   - Vérifie que la réservation n'est pas annulée ou terminée

5. **Vérification de disponibilité** :
   - Vérifie qu'il n'y a pas de conflit avec d'autres réservations
   - Vérifie qu'il n'y a pas de maintenance prévue

### 4.2 Recalcul du Prix

```typescript
calculateBookingPriceAction({
  vehicleId: existingBooking.vehicleId,
  startDate: nouvelles dates,
  endDate: nouvelles dates,
  startTime: heure extraite des nouvelles dates,
  endTime: heure extraite des nouvelles dates,
  serviceIds: services existants
})
```

**Résultat :**
- `newTotalPrice` = nouveau prix total
- `newDownPayment` = 30% de `newTotalPrice`
- `depositDifference` = `newDownPayment` - `oldDepositPaid`

### 4.3 Stockage des Informations (PAS d'Actions Stripe)

**IMPORTANT :**Les remboursements et paiements Stripe ne sont **PAS**créés maintenant. On stocke uniquement les informations nécessaires.

**Ce qui est stocké :**
- `modificationRequested: true` → Marque la réservation comme demande de modification
- `modificationRequestedAt: new Date()` → Date de la demande
- `originalStartDate` → Date de départ avant modification (pour restauration si refus)
- `originalEndDate` → Date de retour avant modification (pour restauration si refus)
- `originalTotalPrice` → Prix total avant modification
- `originalDepositPaid` → Acompte payé avant modification
- `modificationDepositDifference` → Différence d'acompte (positif = paiement nécessaire, négatif = remboursement nécessaire)

### 4.4 Mise à Jour de la Réservation

```typescript
prisma.booking.update({
  where: { id: bookingId },
  data: {
    startDate: nouvelles dates,
    endDate: nouvelles dates,
    totalPrice: newTotalPrice,
    depositPaid: newDownPayment, // Nouvel acompte (30% du nouveau prix)
    securityDepositPaid: securityDepositPaid, // PRÉSERVÉ si > 0
    remainingAmount: newRemainingAmount,
    status: BookingStatus.PENDING // Retour en attente pour validation admin
  }
})
```

**Points importants :**
- `securityDepositPaid` est **PRÉSERVÉ** si elle a déjà été payée
- Le statut passe à `PENDING` pour validation par l'admin
- Tous les montants sont arrondis à 2 décimales

### 4.5 Pas de Paiement Immédiat

**IMPORTANT :**Aucune session de paiement Stripe n'est créée maintenant. Le paiement sera géré après validation admin.

### 4.6 Envoi d'Email de Notification

```typescript
sendBookingUpdateEmail({
  to: user.email,
  name: user.name,
  booking: {
    reference: booking.reference,
    totalPrice: newTotalPrice,
    depositPaid: newDownPayment,
    remainingAmount: newRemainingAmount,
    startDate: nouvelles dates,
    endDate: nouvelles dates,
    status: PENDING
  },
  vehicle: { ... },
  locations: { ... }
})
```

**Contenu de l'email :**
- Confirmation de la modification
- Nouvelles dates
- Nouveau prix total
- Nouvel acompte
- Nouveau solde restant
- Statut (en attente de validation)

### 4.7 Invalidation du Cache

```typescript
invalidateBookingCache(bookingId)
revalidatePath("/dashboard")
revalidatePath("/admin/bookings")
```

---

## Étape 5 : Notification Admin et Validation

**Fichier :** `lib/admin/notifications.ts` et `actions/admin/bookings/moderate-booking.ts`

### 5.1 Notification Admin

1. **Détection de la demande de modification** :
   - Le système détecte `modificationRequested === true`
   - La réservation apparaît dans les notifications admin avec le type `"modification"`

2. **Affichage dans l'interface admin** :
   - La notification apparaît dans la navbar admin
   - L'admin peut voir :
     - Les dates originales vs nouvelles dates
     - Le prix original vs nouveau prix
     - La différence d'acompte (remboursement ou paiement nécessaire)
     - Les informations du client et du véhicule

3. **Actions disponibles** :
   - **"Valider"** → Accepte la modification et déclenche les actions Stripe
   - **"Refuser"** → Refuse la modification et restaure les dates originales

### 5.2 Validation Admin (Acceptation)

**Fichier :** `actions/admin/bookings/moderate-booking.ts` → `handleModificationRequest()`

Quand l'admin clique sur **"Valider"** :

1. **Si nouveau prix < ancien prix** → Création d'un remboursement Stripe :
   ```typescript
   createRefundAction({
     bookingId: booking.id,
     amount: Math.abs(depositDifference),
     reason: "booking_modification"
   })
   ```

2. **Si nouveau prix > ancien prix** → Création d'une session de paiement Stripe :
   ```typescript
   createCheckoutSessionAction({
     bookingId: booking.id,
     amount: depositDifference, // Seulement la différence d'acompte
     description: "Acompte supplémentaire pour la modification de dates..."
   })
   ```

3. **Mise à jour de la réservation** :
   - `modificationRequested: false` → Nettoyer les champs de demande
   - `status: CONFIRMED` (si pas de paiement nécessaire) ou `PENDING` (si paiement nécessaire)
   - Les dates et prix sont déjà à jour (mis à jour à l'étape 4)

4. **Email de confirmation** :
   - Email envoyé au client confirmant la modification
   - Si un paiement est nécessaire, l'URL de paiement est loggée (TODO: l'envoyer par email)

### 5.3 Refus Admin

**Fichier :** `actions/admin/bookings/moderate-booking.ts` → `handleModificationRequest()`

Quand l'admin clique sur **"Refuser"** :

1. **Restauration des dates originales** :
   ```typescript
   prisma.booking.update({
     data: {
       startDate: originalStartDate, // Restaurer
       endDate: originalEndDate, // Restaurer
       totalPrice: originalTotalPrice, // Restaurer
       depositPaid: originalDepositPaid, // Restaurer
       remainingAmount: originalTotalPrice - originalDepositPaid, // Recalculer
       status: CONFIRMED, // Restaurer le statut
       // Nettoyer les champs de demande
       modificationRequested: false,
       modificationRequestedAt: null,
       originalStartDate: null,
       originalEndDate: null,
       originalTotalPrice: null,
       originalDepositPaid: null,
       modificationDepositDifference: null,
     }
   })
   ```

2. **Email de refus** :
   - Email envoyé au client informant que la modification a été refusée
   - Les dates originales sont conservées

---

## Étape 6 : Paiement Supplémentaire (si nécessaire, après validation admin)

**NOTE :**Cette étape se produit uniquement si l'admin a validé la modification ET si un paiement supplémentaire est nécessaire.

**Fichier :** `actions/admin/bookings/moderate-booking.ts` → `handleModificationRequest()`

Quand l'admin valide une modification qui nécessite un paiement :

1. **Création de la session Stripe** :
   - Une session de paiement Stripe est créée avec l'URL de paiement
   - L'URL est loggée dans la console (TODO: l'envoyer par email au client)

2. **Le client doit payer** :
   - L'admin peut envoyer l'URL de paiement au client par email
   - Ou le client peut accéder à sa réservation et voir le bouton "Payer maintenant"
   - Montant : uniquement la différence d'acompte
   - La caution n'est PAS incluse si elle a déjà été payée

---

## Étape 7 : Webhook Stripe (Paiement Supplémentaire)

**Fichier :** `app/api/webhooks/stripe/route.ts` (lignes 122-151)

Quand Stripe confirme le paiement :

1. **Détection du type de paiement** :
   ```typescript
   const isAdditionalPayment = oldDepositPaid > 0
   ```

2. **Si c'est un paiement supplémentaire** :
   ```typescript
   // Le montant payé est juste la différence d'acompte
   roundedDownPayment = oldDepositPaid + roundedAmountPaid
   
   // La caution reste inchangée (déjà payée)
   roundedSecurityDeposit = existingSecurityDepositPaid
   
   // Nouveau solde
   roundedRemainingAmount = totalPrice - roundedDownPayment
   ```

3. **Mise à jour de la réservation** :
   ```typescript
   prisma.booking.update({
     data: {
       depositPaid: roundedDownPayment, // Ancien acompte + différence payée
       securityDepositPaid: roundedSecurityDeposit, // PRÉSERVÉ
       remainingAmount: roundedRemainingAmount,
       status: BookingStatus.CONFIRMED
     }
   })
   ```

4. **Création d'un enregistrement de paiement** :
   ```typescript
   prisma.payment.create({
     amount: roundedAmountPaid,
     method: "STRIPE",
     status: "COMPLETED",
     transactionId: session.id,
     metadata: {
       stripePaymentIntentId: ...,
       downPayment: ...,
       securityDeposit: ...
     }
   })
   ```

---

## Résumé des Scénarios

### Scénario 1 : Nouveau prix < Ancien prix (Remboursement)

**Exemple :**
- Ancien prix : 1000€ → Acompte : 300€
- Nouveau prix : 700€ → Nouvel acompte : 210€
- Différence : -90€

**Workflow :**
1. Calcul du nouveau prix
2. Mise à jour : `depositPaid = 210€`, `totalPrice = 700€`
3. Stockage des dates originales et de la différence
4. Préservation de `securityDepositPaid` si > 0
5. Statut → `PENDING` (attente validation admin)
6. **Notification admin** → L'admin voit la demande
7. **Admin valide** → Création d'un remboursement Stripe de 90€
8. Email de confirmation au client
9. Statut → `CONFIRMED`

---

### Scénario 2 : Nouveau prix > Ancien prix (Paiement supplémentaire)

**Exemple :**
- Ancien prix : 1000€ → Acompte : 300€, Caution : 500€ (déjà payée)
- Nouveau prix : 1500€ → Nouvel acompte : 450€
- Différence : +150€

**Workflow :**
1. Calcul du nouveau prix
2. Mise à jour : `depositPaid = 450€`, `totalPrice = 1500€`
3. Stockage des dates originales et de la différence
4. Préservation de `securityDepositPaid = 500€`
5. Statut → `PENDING` (attente validation admin)
6. **Notification admin** → L'admin voit la demande
7. **Admin valide** → Création d'une session Stripe pour 150€ (SEULEMENT la différence)
8. Email de confirmation au client avec URL de paiement (TODO)
9. Statut → `PENDING` (attente paiement)
10. Client paie sur Stripe → Webhook met à jour `depositPaid = 450€`
11. Statut → `CONFIRMED`

---

### Scénario 3 : Nouveau prix = Ancien prix (Pas de changement)

**Exemple :**
- Ancien prix : 1000€ → Acompte : 300€
- Nouveau prix : 1000€ → Nouvel acompte : 300€
- Différence : 0€

**Workflow :**
1. Calcul du nouveau prix
2. Mise à jour des dates uniquement
3. Stockage des dates originales
4. Préservation de `depositPaid` et `securityDepositPaid`
5. Statut → `PENDING` (attente validation admin)
6. **Notification admin** → L'admin voit la demande
7. **Admin valide** → Pas de remboursement, pas de paiement
8. Email de confirmation au client
9. Statut → `CONFIRMED`
10. Pas de remboursement
11. Pas de paiement supplémentaire

### Scénario 4 : Admin refuse la modification

**Exemple :**
- Client demande modification de dates
- Admin refuse

**Workflow :**
1. Calcul du nouveau prix (côté client)
2. Mise à jour temporaire des dates
3. Stockage des dates originales
4. Statut → `PENDING` (attente validation admin)
5. **Notification admin** → L'admin voit la demande
6. **Admin refuse** → Restauration des dates originales
7. Restauration du prix original et de l'acompte original
8. Email de refus au client
9. Statut → `CONFIRMED` (dates originales conservées)
10. Pas de remboursement
11. Pas de paiement supplémentaire

---

## Points de Sécurité

1. **Rate Limiting** : Max 5 modifications / 10 minutes par utilisateur
2. **Vérification de propriété** : L'utilisateur ne peut modifier que ses propres réservations
3. **Vérification de disponibilité** : Le véhicule doit être disponible pour les nouvelles dates
4. **Préservation de la caution** : La caution déjà payée n'est jamais perdue
5. **Arrondissement** : Tous les montants sont arrondis à 2 décimales pour éviter les erreurs de précision

---

## Logs et Traçabilité

Toutes les actions importantes sont loggées :
- `[Booking Update] Remboursement créé: X€`
- `[Booking Update] Session de paiement créée pour: X€`
- `[Stripe Webhook] Payment processed for booking...`
- `[Client Booking] Email de mise à jour envoyé`

---

## Résultat Final

Après la modification des dates :

1. Les dates sont mises à jour
2. Le prix est recalculé
3. L'acompte est ajusté (30% du nouveau prix)
4. La caution est préservée si déjà payée
5. Un remboursement est créé si nécessaire
6. Un paiement supplémentaire est demandé si nécessaire
7. Un email est envoyé au client
8. La réservation passe en statut `PENDING` pour validation admin
9. Après paiement supplémentaire (si applicable), le statut passe à `CONFIRMED`

