# 📋 Workflow Complet : Annulation d'une Réservation par un Client

## 🎯 Vue d'ensemble

Ce document explique **étape par étape** le processus complet lorsqu'un client demande l'annulation de sa réservation, depuis la demande initiale jusqu'à la finalisation (acceptation ou rejet par l'admin).

---

## 📍 Étape 1 : Le Client Demande l'Annulation

### 1.1 Interface Client

**Fichier :** `components/client/dashboard/CancelBookingDialog.tsx`

1. Le client clique sur le bouton **"Annuler la réservation"** dans son espace personnel
2. Un dialog s'ouvre avec :
   - **Aperçu du remboursement estimé** selon la politique d'annulation
   - **Champ optionnel** pour saisir un motif d'annulation (max 500 caractères)
   - **Politique d'annulation** affichée

### 1.2 Calcul du Remboursement Estimé (Aperçu)

**Fonction :** `computeRefundPreview()` dans `CancelBookingDialog.tsx`

Le système calcule automatiquement le taux de remboursement selon le délai avant le départ :

```
📊 Politique de remboursement :
├─ Plus de 7 jours avant le départ → 100% de l'acompte remboursé
├─ Entre 3 et 7 jours avant le départ → 50% de l'acompte remboursé
└─ Moins de 3 jours avant le départ → 0% (aucun remboursement)
```

**Exemple :**
- Acompte payé : 300€
- Jours avant départ : 10 jours
- Remboursement estimé : 300€ (100%)
- Frais retenus : 0€

### 1.3 Validation et Envoi de la Demande

**Fichier :** `actions/client/bookings/cancel-booking.ts`

Quand le client confirme l'annulation :

1. **Vérifications de sécurité :**
   - ✅ Client authentifié
   - ✅ Rate limiting (max 3 tentatives / 10 minutes)
   - ✅ Réservation appartient au client
   - ✅ Réservation peut être annulée (pas déjà commencée, pas déjà annulée)

2. **Calcul du remboursement :**
   ```typescript
   const daysBeforeStart = (startDate - now) / 24 heures
   const refundRate = computeRefundRate(daysBeforeStart)
   const refundAmount = depositPaid * refundRate
   const retentionAmount = depositPaid - refundAmount
   ```

3. **Mise à jour de la réservation :**
   ```typescript
   {
     status: PENDING (ou reste CONFIRMED selon le contexte),
     cancellationRequested: true,
     cancellationRequestedAt: maintenant,
     cancellationRequestedRefundRate: refundRate (0, 0.5, ou 1),
     cancellationPreviousStatus: statut avant annulation,
     cancellationReason: motif saisi par le client (optionnel)
   }
   ```

4. **Email envoyé au client :**
   - Confirmation de la demande d'annulation
   - Détails du remboursement estimé
   - Politique d'annulation
   - Information que la demande sera traitée par l'admin

5. **Notification admin :**
   - Une notification apparaît dans l'espace admin
   - Badge "Annulation demandée" sur la réservation

---

## 📍 Étape 2 : L'Admin Voit la Demande

### 2.1 Interface Admin

**Fichier :** `app/(admin)/admin/bookings/[id]/BookingDetailsPageClient.tsx`

L'admin voit :

1. **Badge "Annulation demandée"** sur la réservation
2. **Section dédiée** avec :
   - Date de la demande
   - Motif d'annulation (si fourni)
   - **Détails du remboursement :**
     - Acompte payé : X€
     - Taux de remboursement : X%
     - Montant à rembourser : X€
     - Frais retenus : X€

3. **Deux boutons d'action :**
   - ✅ **"Accepter l'annulation"** → Valide l'annulation et crée le remboursement
   - ❌ **"Conserver la réservation"** → Rejette l'annulation avec message optionnel

---

## 📍 Étape 3A : L'Admin ACCEPTE l'Annulation

### 3A.1 Traitement de l'Acceptation

**Fichier :** `actions/admin/bookings/moderate-booking.ts` → `moderateBookingStatusAction()`

Quand l'admin clique sur **"Accepter l'annulation"** :

1. **Calcul du remboursement final :**
   ```typescript
   const refundRate = booking.cancellationRequestedRefundRate ?? computeRefundRate(...)
   const refundAmount = depositPaid * refundRate
   ```

2. **Création du remboursement Stripe :**
   - Recherche du paiement Stripe associé à la réservation
   - Création d'un remboursement Stripe pour le montant calculé
   - Logs détaillés de l'opération

3. **Mise à jour de la réservation :**
   ```typescript
   {
     status: CANCELLED,
     cancelledAt: maintenant,
     remainingAmount: 0,
     cancellationRequested: false,
     cancellationRequestedAt: null,
     cancellationRequestedRefundRate: null,
     cancellationPreviousStatus: null
   }
   ```

4. **Mise à jour des factures :**
   - Toutes les factures associées passent en statut `CANCELLED`

5. **Email envoyé au client :**
   - Confirmation de l'annulation
   - Détails du remboursement (montant, taux, frais retenus)
   - Politique d'annulation
   - Information sur le délai de remboursement

### 3A.2 Webhook Stripe (Remboursement)

**Fichier :** `app/api/webhooks/stripe/route.ts`

Quand Stripe confirme le remboursement :

1. **Événements reçus :**
   - `charge.refunded`
   - `refund.created`
   - `refund.updated`

2. **Mise à jour du statut du paiement :**
   - Le paiement associé passe en statut `COMPLETED` (remboursement réussi)
   - Métadonnées mises à jour avec les infos du remboursement

3. **Si le remboursement échoue :**
   - Le `depositPaid` est restauré dans la réservation
   - Logs d'erreur pour l'admin

---

## 📍 Étape 3B : L'Admin REJETTE l'Annulation (Conserve la Réservation)

### 3B.1 Traitement du Rejet

**Fichier :** `actions/admin/bookings/moderate-booking.ts` → `moderateBookingStatusAction()`

Quand l'admin clique sur **"Conserver la réservation"** :

1. **Vérification du contexte :**
   - Y a-t-il une modification en cours ?
   - Y a-t-il des dates originales à restaurer ?

2. **Mise à jour de la réservation :**
   ```typescript
   {
     cancellationRequested: false,
     cancellationRequestedAt: null,
     cancellationRequestedRefundRate: null,
     cancellationPreviousStatus: null,
     cancellationReason: null,
     cancellationRejectionReason: message de l'admin (optionnel),
     status: statut précédent (CONFIRMED généralement)
   }
   ```

3. **Email envoyé au client :**
   - Information que l'annulation a été refusée
   - Message de justification de l'admin (si fourni)
   - Confirmation que la réservation est maintenue
   - Dates et détails de la réservation

---

## 📊 Tableau Récapitulatif des Statuts

| Étape | Statut Réservation | `cancellationRequested` | Actions Possibles |
|-------|-------------------|------------------------|-------------------|
| **Avant demande** | `CONFIRMED` ou `PENDING` | `false` | Client peut annuler |
| **Demande envoyée** | `PENDING` (ou reste `CONFIRMED`) | `true` | Admin doit valider/rejeter |
| **Annulation acceptée** | `CANCELLED` | `false` | Aucune (réservation annulée) |
| **Annulation rejetée** | `CONFIRMED` (statut précédent) | `false` | Client peut réessayer si besoin |

---

## 💰 Détails du Calcul de Remboursement

### Fonction de Calcul

```typescript
function computeRefundRate(daysBeforeStart: number): number {
  if (daysBeforeStart > 7) {
    return 1;      // 100% remboursé
  }
  if (daysBeforeStart >= 3) {
    return 0.5;    // 50% remboursé
  }
  return 0;        // 0% remboursé
}
```

### Exemples Concrets

**Exemple 1 : Annulation 10 jours avant**
- Acompte : 300€
- Jours avant : 10
- Taux : 100%
- Remboursement : 300€
- Frais retenus : 0€

**Exemple 2 : Annulation 5 jours avant**
- Acompte : 300€
- Jours avant : 5
- Taux : 50%
- Remboursement : 150€
- Frais retenus : 150€

**Exemple 3 : Annulation 1 jour avant**
- Acompte : 300€
- Jours avant : 1
- Taux : 0%
- Remboursement : 0€
- Frais retenus : 300€

---

## 🔔 Notifications et Emails

### Email 1 : Demande d'Annulation (Client → Client)

**Fichier :** `lib/templates/booking-cancellation-request-email.tsx`

**Contenu :**
- Confirmation de la demande
- Détails du remboursement estimé
- Politique d'annulation
- Information que l'admin va traiter la demande

### Email 2 : Annulation Acceptée (Admin → Client)

**Fichier :** `lib/templates/booking-cancellation-email.tsx`

**Contenu :**
- Confirmation de l'annulation
- Détails du remboursement final
- Montant remboursé et frais retenus
- Délai de remboursement
- Politique d'annulation

### Email 3 : Annulation Rejetée (Admin → Client)

**Fichier :** `lib/templates/booking-cancellation-rejected-email.tsx`

**Contenu :**
- Information que l'annulation a été refusée
- Message de justification de l'admin
- Confirmation que la réservation est maintenue
- Dates et détails de la réservation

---

## 🛡️ Sécurité et Validations

### Validations Côté Client

1. ✅ **Authentification** : Client doit être connecté
2. ✅ **Propriété** : Client ne peut annuler que ses propres réservations
3. ✅ **Rate Limiting** : Max 3 tentatives / 10 minutes
4. ✅ **Statut** : Réservation doit être `PENDING` ou `CONFIRMED`
5. ✅ **Dates** : Réservation ne doit pas avoir commencé

### Validations Côté Admin

1. ✅ **Permissions** : Seul un admin peut valider/rejeter
2. ✅ **Contexte** : Vérifie s'il y a une modification en cours
3. ✅ **Remboursement** : Vérifie que le paiement existe avant remboursement

---

## 🔄 Cas Particuliers

### Cas 1 : Annulation + Modification en Cours

**Scénario :** Le client a demandé une modification ET une annulation

**Comportement :**
- L'annulation a **priorité** sur la modification
- Si l'admin accepte l'annulation → La modification est ignorée
- Si l'admin rejette l'annulation → La modification reste en attente

### Cas 2 : Remboursement Échoue

**Scénario :** Le remboursement Stripe échoue

**Comportement :**
- Le `depositPaid` est restauré dans la réservation
- Logs d'erreur pour l'admin
- L'admin doit réessayer manuellement

### Cas 3 : Réservation Déjà Commencée

**Scénario :** Le client essaie d'annuler une réservation en cours

**Comportement :**
- ❌ Annulation refusée automatiquement
- Message : "Cette réservation est déjà en cours. Contactez le support si besoin."

---

## 📝 Logs et Traçabilité

Toutes les actions importantes sont loggées :

```
[Client Booking] ✅ Email de demande d'annulation envoyé
[Admin Moderation] ✅ Remboursement d'annulation créé: X€
[Stripe Webhook] ✅ Statut du remboursement mis à jour
```

---

## 🎯 Résumé du Flux Complet

```
1. Client → Clic "Annuler" → Dialog s'ouvre
2. Client → Saisit motif (optionnel) → Confirme
3. Système → Calcule remboursement → Met à jour DB → Envoie email
4. Admin → Voit notification → Consulte détails
5. Admin → Choisit :
   ├─ Accepter → Crée remboursement Stripe → Met statut CANCELLED → Envoie email
   └─ Rejeter → Nettoie demande → Restaure statut → Envoie email
6. Stripe → Webhook → Confirme remboursement → Met à jour statut paiement
```

---

## ✅ Checklist pour l'Admin

Quand vous traitez une demande d'annulation :

- [ ] Vérifier le délai avant le départ
- [ ] Vérifier le taux de remboursement calculé
- [ ] Vérifier le montant de l'acompte payé
- [ ] Vérifier qu'un paiement Stripe existe
- [ ] Si acceptation : Vérifier que le remboursement Stripe a été créé
- [ ] Si rejet : Saisir un message de justification (recommandé)
- [ ] Vérifier que l'email a été envoyé au client

---

**📌 Note importante :** Le remboursement est calculé uniquement sur l'**acompte** (30% du prix total). Le solde restant (70%) n'est jamais remboursé car il n'a pas encore été payé.


