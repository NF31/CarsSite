# 📋 Workflow Complet : Modification des Dates d'une Réservation par un Client

## 🎯 Vue d'ensemble

Ce document explique **étape par étape** le processus complet lorsqu'un client demande la modification des dates de sa réservation, depuis la demande initiale jusqu'à la finalisation (validation/rejet par l'admin, paiement supplémentaire si nécessaire).

---

## 📍 Étape 1 : Le Client Ouvre le Dialog de Modification

### 1.1 Interface Client

**Fichier :** `components/client/dashboard/EditBookingDialog.tsx`

1. Le client clique sur le bouton **"Modifier la réservation"** dans son espace personnel
2. Un dialog s'ouvre avec :
   - **Dates actuelles pré-remplies** (date de départ et date de retour)
   - **Prix actuel affiché**
   - **Acompte actuel affiché**
   - **Caution déjà payée** (si applicable)

### 1.2 Les Champs Sont Initialisés Avec :
- `startDate` = Date de départ actuelle
- `endDate` = Date de retour actuelle
- `depositPaid` = Acompte déjà payé (30% du prix actuel)
- `securityDepositPaid` = Caution déjà payée (si > 0)
- `totalPrice` = Prix total actuel de la réservation

---

## 📍 Étape 2 : Calcul en Temps Réel du Nouveau Prix

### 2.1 Quand le Client Change les Dates

**Fichier :** `components/client/dashboard/EditBookingDialog.tsx` (lignes 115-184)

**Actions automatiques :**

1. **Validation des dates** :
   - ✅ Vérifie que la date de fin est après la date de début
   - ✅ Vérifie que les dates sont dans le futur
   - ✅ Vérifie que les dates ont réellement changé

2. **Vérification de disponibilité** :
   - ✅ Vérifie que le véhicule est disponible pour les nouvelles dates
   - ✅ Vérifie qu'il n'y a pas de conflit avec d'autres réservations
   - ✅ Vérifie qu'il n'y a pas de maintenance prévue
   - ✅ Affiche un message de disponibilité (vert = disponible, orange = conflit)

3. **Calcul automatique du nouveau prix** :
   ```typescript
   calculateBookingPriceAction({
     vehicleId: véhicule de la réservation,
     startDate: nouvelle date de départ,
     endDate: nouvelle date de retour,
     startTime: heure extraite de la nouvelle date,
     endTime: heure extraite de la nouvelle date,
     serviceIds: services existants de la réservation
   })
   ```

### 2.2 Résultats du Calcul

**Formules :**
```
Nouveau prix total = (Prix véhicule × nombre de jours) + Prix des services
Nouvel acompte (30%) = Nouveau prix total × 0.3
Différence d'acompte = Nouvel acompte - Ancien acompte
Nouveau solde restant = Nouveau prix total - Nouvel acompte
```

**Exemple concret :**
- **Ancien prix** : 1000€ → Acompte : 300€
- **Nouveau prix** : 1500€ → Nouvel acompte : 450€
- **Différence** : +150€ (paiement supplémentaire nécessaire)

### 2.3 Affichage dans le Dialog

Le client voit en temps réel :

1. **Prix actuel vs Nouveau prix** :
   - Si augmentation → Encadré orange avec "📈 Augmentation"
   - Si réduction → Encadré vert avec "📉 Réduction"

2. **Acompte actuel vs Nouvel acompte** :
   - Acompte actuel : X€
   - Nouvel acompte (30%) : Y€
   - **Différence d'acompte** :
     - Si positif (+X€) → Rouge, message "Paiement supplémentaire requis"
     - Si négatif (-X€) → Vert, message "💰 Remboursement prévu"

3. **Caution déjà payée** :
   - Si `securityDepositPaid > 0` → Affiche "ℹ️ La caution de garantie (X€) a déjà été payée et ne sera pas redemandée"

4. **Nouveau solde à payer** :
   - Ancien solde : X€
   - Nouveau solde : Y€
   - Différence de solde : ±Z€

---

## 📍 Étape 3 : Le Client Soumet la Demande

### 3.1 Validation Finale

**Fichier :** `components/client/dashboard/EditBookingDialog.tsx`

Quand le client clique sur **"Enregistrer les nouvelles dates"** :

1. **Vérifications côté client** :
   - ✅ Dates valides
   - ✅ Véhicule disponible
   - ✅ Aucun conflit détecté

2. **Envoi du formulaire** :
   - Appel à `updateClientBookingAction(formData)`
   - Données envoyées : `bookingId`, `startDate`, `endDate`

### 3.2 Traitement Serveur

**Fichier :** `actions/client/bookings/update-booking.ts`

**Vérifications de sécurité :**

1. ✅ **Authentification** : Client connecté
2. ✅ **Rate limiting** : Max 5 tentatives / 10 minutes
3. ✅ **Propriété** : Réservation appartient au client
4. ✅ **Statut** : Réservation peut être modifiée (pas déjà commencée, pas annulée, pas terminée)
5. ✅ **Disponibilité** : Aucun conflit avec d'autres réservations
6. ✅ **Maintenance** : Aucune maintenance prévue sur cette période

### 3.3 Recalcul du Prix Serveur

**Fonction :** `calculateBookingPriceAction()`

**Calculs effectués :**
```typescript
// Extraire les heures des nouvelles dates
startTime = "10:00" (heure de départ)
endTime = "10:00" (heure de retour)

// Calculer le nouveau prix
priceResult = calculateBookingPriceAction({
  vehicleId,
  startDate: nouvelles dates,
  endDate: nouvelles dates,
  startTime,
  endTime,
  serviceIds: services existants
})

// Résultats
newTotalPrice = priceResult.data.totalPrice
newDownPayment = newTotalPrice × 0.3 (30%)
depositDifference = newDownPayment - oldDepositPaid
newRemainingAmount = newTotalPrice - newDownPayment
```

### 3.4 Stockage des Informations (SANS Actions Stripe)

**⚠️ IMPORTANT :** À ce stade, **AUCUN remboursement ni paiement Stripe n'est créé**. On stocke uniquement les informations pour que l'admin puisse valider/rejeter.

**Données stockées dans la base de données :**

```typescript
{
  // Nouvelles dates (appliquées immédiatement)
  startDate: nouvelle date de départ,
  endDate: nouvelle date de retour,
  
  // Nouveaux montants (appliqués immédiatement)
  totalPrice: nouveau prix total,
  depositPaid: nouvel acompte (30% du nouveau prix),
  remainingAmount: nouveau solde restant,
  
  // Demande de modification (pour l'admin)
  modificationRequested: true,
  modificationRequestedAt: maintenant,
  
  // Dates et prix originaux (pour restauration si refus)
  originalStartDate: ancienne date de départ,
  originalEndDate: ancienne date de retour,
  originalTotalPrice: ancien prix total,
  originalDepositPaid: ancien acompte payé,
  
  // Différence d'acompte (pour l'admin)
  modificationDepositDifference: différence (positif = paiement, négatif = remboursement),
  
  // Statut
  status: PENDING (retour en attente pour validation admin),
  
  // Caution préservée (si déjà payée)
  securityDepositPaid: caution déjà payée (PRÉSERVÉE)
}
```

**Points importants :**
- ✅ `securityDepositPaid` est **TOUJOURS préservée** si elle a déjà été payée
- ✅ Les dates sont **déjà mises à jour** (pas besoin de restaurer si acceptation)
- ✅ Le statut passe à `PENDING` pour **attendre la validation admin**

### 3.5 Email Envoyé au Client

**Fichier :** `lib/email.ts` → `sendBookingUpdateEmail()`

**Contenu de l'email :**
- Confirmation de la demande de modification
- Nouvelles dates proposées
- Nouveau prix total
- Nouvel acompte
- Différence d'acompte (paiement ou remboursement)
- **Statut : En attente de validation admin**
- Information que la modification sera traitée prochainement

### 3.6 Notification Admin

- Une **notification apparaît** dans l'espace admin
- Badge **"Modification demandée"** sur la réservation
- L'admin voit :
  - Dates originales vs nouvelles dates
  - Prix original vs nouveau prix
  - Différence d'acompte (remboursement ou paiement nécessaire)

---

## 📍 Étape 4 : L'Admin Voit la Demande

### 4.1 Interface Admin

**Fichier :** `app/(admin)/admin/bookings/[id]/BookingDetailsPageClient.tsx`

L'admin voit :

1. **Badge "Modification demandée"** sur la réservation
2. **Section dédiée** avec :
   - Date de la demande
   - **Dates originales** vs **nouvelles dates**
   - **Prix original** vs **nouveau prix**
   - **Acompte original** vs **nouvel acompte**
   - **Différence d'acompte** :
     - Si positif → Montant à payer en plus
     - Si négatif → Montant à rembourser
   - **Caution** (préservée si déjà payée)

3. **Deux boutons d'action :**
   - ✅ **"Valider la modification"** → Accepte et déclenche les actions Stripe
   - ❌ **"Refuser la modification"** → Rejette et restaure les dates originales

---

## 📍 Étape 5A : L'Admin VALIDE la Modification

### 5A.1 Traitement de la Validation

**Fichier :** `actions/admin/bookings/moderate-booking.ts` → `handleModificationRequest()`

Quand l'admin clique sur **"Valider la modification"** :

#### Cas 1 : Différence d'acompte < 0 (Remboursement nécessaire)

**Exemple :** Nouveau prix < Ancien prix
- Ancien acompte : 300€
- Nouvel acompte : 210€
- Différence : -90€ (remboursement de 90€)

**Actions :**

1. **Création d'un remboursement Stripe** :
   ```typescript
   createRefundAction({
     bookingId: booking.id,
     amount: 90, // Montant à rembourser
     reason: "booking_modification"
   })
   ```

2. **Mise à jour de la réservation** :
   ```typescript
   {
     modificationRequested: false,
     modificationRequestedAt: null,
     originalStartDate: null,
     originalEndDate: null,
     originalTotalPrice: null,
     originalDepositPaid: null,
     modificationDepositDifference: null,
     status: CONFIRMED (car pas de paiement supplémentaire nécessaire)
   }
   ```

3. **Email envoyé au client** :
   - Confirmation de la modification
   - Détails du remboursement
   - Dates mises à jour
   - Statut : CONFIRMED

#### Cas 2 : Différence d'acompte > 0 (Paiement supplémentaire nécessaire)

**Exemple :** Nouveau prix > Ancien prix
- Ancien acompte : 300€
- Nouvel acompte : 450€
- Différence : +150€ (paiement supplémentaire de 150€)

**Actions :**

1. **Création d'une session de paiement Stripe** :
   ```typescript
   createCheckoutSessionAction({
     bookingId: booking.id,
     amount: 150, // SEULEMENT la différence d'acompte
     description: "Acompte supplémentaire pour la modification de dates",
     paymentType: "deposit",
     isModificationPayment: true,
     modificationMetadata: {
       originalTotalPrice: ...,
       originalDepositPaid: ...,
       depositDifference: 150,
       // ...
     }
   })
   ```

2. **Mise à jour de la réservation** :
   ```typescript
   {
     modificationRequested: false,
     modificationRequestedAt: null,
     originalStartDate: null,
     originalEndDate: null,
     originalTotalPrice: null,
     originalDepositPaid: null,
     modificationDepositDifference: 150, // CONSERVÉ jusqu'au paiement
     status: PENDING (car paiement supplémentaire nécessaire)
   }
   ```

3. **L'URL de paiement est générée** :
   - Loggée dans la console
   - (TODO: À envoyer par email au client)
   - Le client peut accéder à sa réservation et voir le bouton "Payer maintenant"

4. **Email envoyé au client** :
   - Confirmation que la modification est validée
   - Information qu'un paiement supplémentaire est nécessaire
   - Montant à payer : 150€ (seulement la différence)
   - URL de paiement (si envoyée par email)

#### Cas 3 : Différence d'acompte = 0 (Pas de changement financier)

**Exemple :** Nouveau prix = Ancien prix (même nombre de jours, même véhicule)

**Actions :**

1. **Pas de remboursement** ❌
2. **Pas de paiement supplémentaire** ❌
3. **Mise à jour de la réservation** :
   ```typescript
   {
     modificationRequested: false,
     // ... nettoyage des champs
     status: CONFIRMED (car pas de paiement nécessaire)
   }
   ```

4. **Email envoyé au client** :
   - Confirmation de la modification
   - Dates mises à jour
   - Statut : CONFIRMED

---

## 📍 Étape 5B : L'Admin REJETTE la Modification

### 5B.1 Traitement du Rejet

**Fichier :** `actions/admin/bookings/moderate-booking.ts` → `handleModificationRequest()`

Quand l'admin clique sur **"Refuser la modification"** :

**Actions :**

1. **Restauration des dates et prix originaux** :
   ```typescript
   {
     startDate: originalStartDate, // Restaurer
     endDate: originalEndDate, // Restaurer
     totalPrice: originalTotalPrice, // Restaurer
     depositPaid: originalDepositPaid, // Restaurer
     remainingAmount: originalTotalPrice - originalDepositPaid, // Recalculer
     
     // Nettoyer les champs de demande
     modificationRequested: false,
     modificationRequestedAt: null,
     originalStartDate: null,
     originalEndDate: null,
     originalTotalPrice: null,
     originalDepositPaid: null,
     modificationDepositDifference: null,
     
     // Stocker le motif de refus
     modificationRejectionReason: message de l'admin (optionnel),
     
     // Restaurer le statut
     status: CONFIRMED
   }
   ```

2. **Email envoyé au client** :
   - Information que la modification a été refusée
   - Message de justification de l'admin (si fourni)
   - Confirmation que les dates originales sont conservées
   - Détails de la réservation originale

---

## 📍 Étape 6 : Paiement Supplémentaire (si nécessaire)

### 6.1 Accès au Paiement

**⚠️ IMPORTANT :** Cette étape se produit uniquement si l'admin a validé la modification ET si un paiement supplémentaire est nécessaire.

**Où le client peut payer :**

1. **Depuis sa réservation** :
   - Le client accède à sa réservation
   - Voit le badge "En attente de paiement"
   - Bouton **"Payer maintenant"** qui redirige vers Stripe Checkout

2. **Via l'URL de paiement** (si envoyée par email) :
   - L'admin peut envoyer l'URL de paiement par email
   - Ou le client peut la récupérer depuis sa réservation

### 6.2 Paiement sur Stripe Checkout

1. **Le client est redirigé vers Stripe Checkout**
2. **Montant affiché** : Seulement la différence d'acompte (ex: 150€)
3. **Description** : "Acompte supplémentaire pour la modification de dates - Réservation BK-2025-0006"
4. **Important** : La caution n'est PAS incluse si elle a déjà été payée
5. **Le client paie** avec sa carte bancaire

### 6.3 Redirection après Paiement

**Fichier :** `app/(public)/bookings/payment/success/page.tsx`

Quand le paiement réussit :

1. **Redirection vers** : `/bookings/payment/success?session_id=...`
2. **Page de succès affiche** :
   - ✅ "Paiement supplémentaire confirmé !"
   - Détails de la modification
   - Comparaison des prix (avant/après)
   - Montant payé (différence d'acompte)
   - Statut : En attente de confirmation par webhook

**⚠️ IMPORTANT :** À ce stade, la page de succès **NE MET PAS** le statut à CONFIRMED. Elle attend que le webhook Stripe le fasse.

---

## 📍 Étape 7 : Webhook Stripe (Validation du Paiement)

### 7.1 Réception du Webhook

**Fichier :** `app/api/webhooks/stripe/route.ts`

**Événement Stripe :** `checkout.session.completed`

### 7.2 Détection du Type de Paiement

**Vérifications :**

1. **Métadonnées de la session Stripe** :
   ```typescript
   isModificationPayment = session.metadata?.isModificationPayment === "true"
   ```

2. **Base de données** :
   ```typescript
   hasModificationDepositDifference = (booking.modificationDepositDifference ?? 0) > 0
   ```

3. **Détection finale** :
   ```typescript
   isModificationPayment = 
     metadataIsModification || 
     hasModificationDepositDifference
   ```

### 7.3 Mise à Jour de la Réservation

**Si paiement de modification détecté :**

```typescript
{
  // L'acompte total = ancien acompte + montant payé
  depositPaid: currentDepositPaid + roundedAmountPaid,
  
  // La caution est PRÉSERVÉE (déjà payée)
  securityDepositPaid: currentSecurityDepositPaid,
  
  // Nouveau solde restant
  remainingAmount: booking.totalPrice - newDepositPaid,
  
  // Statut → CONFIRMED (après validation du paiement)
  status: CONFIRMED,
  
  // Nettoyer la différence (paiement effectué)
  modificationDepositDifference: null
}
```

### 7.4 Création de l'Enregistrement de Paiement

```typescript
prisma.payment.create({
  amount: montant payé (différence d'acompte),
  method: "STRIPE",
  status: "COMPLETED",
  transactionId: session.id,
  metadata: {
    stripeSessionId: session.id,
    paymentType: "deposit",
    isModificationPayment: true,
    downPayment: montant payé,
    securityDeposit: 0 (car déjà payée)
  }
})
```

### 7.5 Email Final au Client

**Fichier :** `lib/email.ts` → `sendBookingUpdateEmail()`

**Contenu :**
- ✅ Confirmation que le paiement supplémentaire est reçu
- Détails de la modification (dates, prix)
- Comparaison avant/après
- Montant du paiement supplémentaire
- **Statut : CONFIRMÉ**

---

## 📊 Tableau Récapitulatif des Statuts

| Étape | Statut Réservation | `modificationRequested` | Actions Possibles |
|-------|-------------------|------------------------|-------------------|
| **Avant modification** | `CONFIRMED` | `false` | Client peut modifier |
| **Demande envoyée** | `PENDING` | `true` | Admin doit valider/rejeter |
| **Validation admin (pas de paiement)** | `CONFIRMED` | `false` | Modification terminée |
| **Validation admin (paiement nécessaire)** | `PENDING` | `false` | Client doit payer |
| **Paiement reçu (webhook)** | `CONFIRMED` | `false` | Modification terminée |
| **Rejet admin** | `CONFIRMED` | `false` | Dates originales restaurées |

---

## 💰 Exemples Concrets de Calcul

### Exemple 1 : Modification avec Augmentation de Prix

**Situation initiale :**
- Prix : 1000€
- Acompte payé : 300€ (30%)
- Caution payée : 800€
- Solde restant : 700€

**Nouvelle situation (dates plus longues) :**
- Nouveau prix : 1500€
- Nouvel acompte requis : 450€ (30%)
- Différence d'acompte : +150€

**Résultat :**
1. Client paie **150€ supplémentaire** (pas 450€ !)
2. Acompte total après paiement : **450€** (300€ + 150€)
3. Caution **préservée** : 800€ (pas touchée)
4. Nouveau solde restant : **1050€** (1500€ - 450€)

---

### Exemple 2 : Modification avec Réduction de Prix

**Situation initiale :**
- Prix : 1000€
- Acompte payé : 300€ (30%)
- Caution payée : 800€
- Solde restant : 700€

**Nouvelle situation (dates plus courtes) :**
- Nouveau prix : 700€
- Nouvel acompte requis : 210€ (30%)
- Différence d'acompte : -90€

**Résultat :**
1. Client reçoit un **remboursement de 90€**
2. Acompte après remboursement : **210€** (300€ - 90€)
3. Caution **préservée** : 800€ (pas touchée)
4. Nouveau solde restant : **490€** (700€ - 210€)

---

### Exemple 3 : Modification Sans Changement de Prix

**Situation initiale :**
- Prix : 1000€
- Acompte payé : 300€ (30%)
- Caution payée : 800€
- Solde restant : 700€

**Nouvelle situation (même nombre de jours, dates différentes) :**
- Nouveau prix : 1000€ (identique)
- Nouvel acompte requis : 300€ (identique)
- Différence d'acompte : 0€

**Résultat :**
1. ✅ **Pas de remboursement**
2. ✅ **Pas de paiement supplémentaire**
3. ✅ Seules les **dates changent**
4. Tous les montants restent identiques

---

## 🔔 Points Importants à Retenir

### ✅ Ce qui est TOUJOURS Préservé

1. **La caution** (`securityDepositPaid`) :
   - Si elle a déjà été payée, elle **n'est JAMAIS modifiée**
   - Elle n'est pas incluse dans les remboursements
   - Elle n'est pas redemandée lors d'un paiement supplémentaire

2. **Les services** :
   - Les services sélectionnés restent identiques
   - Seul le prix du véhicule change selon les dates

### ⚠️ Ce qui Change

1. **Le prix total** : Recalculé selon les nouvelles dates
2. **L'acompte** : Ajusté à 30% du nouveau prix total
3. **Le solde restant** : Recalculé (nouveau prix - nouvel acompte)

### 💡 Règles de Calcul

1. **Différence d'acompte positive** → Paiement supplémentaire nécessaire
   - Montant à payer : **SEULEMENT la différence**
   - Exemple : Ancien acompte 300€, nouveau 450€ → Payer 150€

2. **Différence d'acompte négative** → Remboursement nécessaire
   - Montant remboursé : **SEULEMENT la différence**
   - Exemple : Ancien acompte 300€, nouveau 210€ → Rembourser 90€

3. **Différence d'acompte = 0** → Pas de changement financier
   - Seules les dates changent
   - Pas de paiement, pas de remboursement

---

## 🔄 Flux Complet Résumé

```
1. Client → Clic "Modifier" → Dialog s'ouvre
2. Client → Change les dates → Calcul en temps réel du nouveau prix
3. Client → Voit la différence → Confirme la modification
4. Système → Calcule le nouveau prix → Met à jour DB → Envoie email
5. Admin → Voit notification → Consulte détails
6. Admin → Choisit :
   ├─ Valider (pas de paiement) → Statut CONFIRMED → Email
   ├─ Valider (paiement nécessaire) → Crée session Stripe → Statut PENDING
   │   └─ Client → Paie sur Stripe → Webhook → Statut CONFIRMED
   └─ Rejeter → Restaure dates originales → Statut CONFIRMED → Email
```

---

## 🎯 Résultat Final

Après modification des dates **validée par l'admin** :

1. ✅ Les dates sont mises à jour
2. ✅ Le prix est recalculé
3. ✅ L'acompte est ajusté (30% du nouveau prix)
4. ✅ La caution est préservée si déjà payée
5. ✅ Un remboursement est créé si nécessaire (après validation admin)
6. ✅ Un paiement supplémentaire est demandé si nécessaire (après validation admin)
7. ✅ Un email est envoyé au client à chaque étape
8. ✅ La réservation passe en statut `CONFIRMED` après paiement (si nécessaire)
9. ✅ Le statut est synchronisé entre client et admin

---

**📌 Note importante :** Le webhook Stripe est **essentiel** pour finaliser le paiement supplémentaire. Le statut ne passe à `CONFIRMED` qu'**après validation du webhook**, garantissant que le paiement est bien reçu et traité.


