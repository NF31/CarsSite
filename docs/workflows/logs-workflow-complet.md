# 📋 LOGS DU WORKFLOW COMPLET - GUIDE DE SUIVI

Ce document liste TOUS les logs que vous verrez lors d'une réservation complète, du début à la fin.

---

## 🎯 STRUCTURE DES LOGS

Tous les logs suivent le format :
```
[📋 WORKFLOW ÉTAPE X.Y.Z] Description
```

### Étapes principales :
- **ÉTAPE 1** : Création de la réservation
- **ÉTAPE 2** : Email de création
- **ÉTAPE 3** : Création session Stripe
- **ÉTAPE 4** : Webhook Stripe (avec sous-étapes 4.2.1 à 4.2.9)

---

## 📝 WORKFLOW COMPLET - LOGS DÉTAILLÉS

### 🟢 ÉTAPE 1 : CRÉATION RÉSERVATION

```
[📋 WORKFLOW ÉTAPE 1] ✅ Réservation créée avec succès
  - bookingId
  - reference
  - userId
  - vehicleId
  - totalPrice
  - status: PENDING
  - workflowStep: "1/4 - CRÉATION RÉSERVATION"
  - nextStep: "2/4 - EMAIL DE CRÉATION"
```

---

### 🟢 ÉTAPE 2 : EMAIL DE CRÉATION

```
[📋 WORKFLOW ÉTAPE 2] 📧 Préparation de l'envoi de l'email de création
  - bookingId
  - reference
  - recipient
  - emailType: "Création (statut PENDING)"
  - pdfAttachments: "Aucun"
  - workflowStep: "2/4 - EMAIL DE CRÉATION"

[📋 WORKFLOW ÉTAPE 2] ✅ Email de création envoyé avec succès
  - bookingId
  - reference
  - recipient
  - messageId
  - queued
  - nextStep: "3/4 - PAIEMENT STRIPE"

[📋 WORKFLOW ÉTAPE 1-2] ✅ PHASE 1 TERMINÉE : CRÉATION RÉSERVATION
  - bookingId
  - reference
  - status: PENDING
  - summary
  - workflowStep: "FIN PHASE 1 - En attente paiement"
```

---

### 🟢 ÉTAPE 3 : CRÉATION SESSION STRIPE

```
[📋 WORKFLOW ÉTAPE 3] 🚀 DÉBUT - CRÉATION SESSION STRIPE
  - workflowStep: "3/4 - PAIEMENT STRIPE"

[📋 WORKFLOW ÉTAPE 3] ✅ Session Stripe créée avec succès
  - sessionId
  - url
  - status
  - bookingId
  - bookingReference
  - amount
  - paymentType
  - isModificationPayment
  - expiresAt
  - workflowStep: "3/4 - PAIEMENT STRIPE"
  - nextStep: "4/4 - WEBHOOK STRIPE (automatique après paiement)"
  - action: "Utilisateur redirigé vers Stripe Checkout"

[📋 WORKFLOW ÉTAPE 3] 🎉 FIN - SESSION CRÉÉE, EN ATTENTE PAIEMENT
```

---

### 🟢 ÉTAPE 4 : WEBHOOK STRIPE

#### 4.1 - RÉCEPTION ÉVÉNEMENT

```
📋 [📋 WORKFLOW ÉTAPE 4] 🔔 WEBHOOK STRIPE REÇU

[Stripe Webhook] Received event: checkout.session.completed
  - eventId
  - sessionId
  - workflowStep: "4/4 - WEBHOOK STRIPE"

📋 [📋 WORKFLOW ÉTAPE 4] 🔔 ÉVÉNEMENT checkout.session.completed REÇU
  - eventId
  - sessionId
  - paymentStatus
  - amountTotal
  - customerEmail
  - workflowStep: "4/4 - WEBHOOK STRIPE"
  - stepNumber: "4.1 - RÉCEPTION ÉVÉNEMENT"

📋 [📋 WORKFLOW ÉTAPE 4.1] ✅ Événement reçu, début du traitement
  - bookingId
  - userId
  - sessionId
  - workflowStep: "4/4 - WEBHOOK STRIPE"
  - stepNumber: "4.1 - RÉCEPTION ÉVÉNEMENT"
```

#### 4.2 - TRAITEMENT COMPLET

```
📋 [📋 WORKFLOW ÉTAPE 4.2] 📋 DÉBUT DU TRAITEMENT DU PAIEMENT
  - bookingId
  - userId
  - sessionId
  - amountTotal
  - workflowStep: "4/4 - WEBHOOK STRIPE"
  - stepNumber: "4.2 - DÉBUT TRAITEMENT"
  - substeps: [
      "4.2.1 - Récupération réservation",
      "4.2.2 - Calcul prix",
      "4.2.3 - Détection type paiement",
      "4.2.4 - Mise à jour réservation",
      "4.2.5 - Création facture",
      "4.2.6 - Création Payment",
      "4.2.7 - Mise à jour statut facture",
      "4.2.8 - Génération PDFs",
      "4.2.9 - Envoi email",
    ]
```

#### 4.2.1 - RÉCUPÉRATION RÉSERVATION

```
📋 [📋 WORKFLOW ÉTAPE 4.2.1] 🔍 Récupération de la réservation
  - bookingId
  - workflowStep: "4/4 - WEBHOOK STRIPE"
  - stepNumber: "4.2.1 - RÉCUPÉRATION RÉSERVATION"

📋 [📋 WORKFLOW ÉTAPE 4.2.1] ✅ Réservation trouvée
  - bookingId
  - reference
  - currentStatus
  - currentDepositPaid
  - totalPrice
  - vehicleId
  - serviceIds
  - startDate
  - endDate
```

#### 4.2.2 - CALCUL PRIX

```
📋 [📋 WORKFLOW ÉTAPE 4.2.2] ✅ Calcul du prix réussi
  - bookingId
  - priceBreakdown: {
      vehiclePrice
      servicesPrice
      totalPrice
      downPayment: "30%"
      securityDeposit
      remainingAmount
      numberOfDays
    }
```

#### 4.2.3 - DÉTECTION TYPE PAIEMENT

```
📋 [📋 WORKFLOW ÉTAPE 4.2.3] 🔍 Détection du type de paiement
  - bookingId
  - paymentType
  - isAuthorization
  - isDepositOnly
  - isModificationPayment
  - modificationDepositDifference
```

#### 4.2.4 - MISE À JOUR RÉSERVATION

```
📋 [📋 WORKFLOW ÉTAPE 4.2.4] ✅ Réservation mise à jour avec succès
  - bookingId
  - reference
  - status: CONFIRMED
  - depositPaid
  - securityDepositPaid
  - remainingAmount
  - isModificationPayment
```

#### 4.2.5 - CRÉATION FACTURE

```
📋 [📋 WORKFLOW ÉTAPE 4.2.5] 📋 Création automatique de facture
  - bookingId
  - reference
  - status
  - isModificationPayment
  - workflowStep: "4/4 - WEBHOOK STRIPE"
  - stepNumber: "4.2.5 - CRÉATION FACTURE"

📋 [📋 WORKFLOW ÉTAPE 4.2.5] ✅ Facture créée automatiquement
  - bookingId
  - invoiceId
  - invoiceNumber
  - workflowStep: "4/4 - WEBHOOK STRIPE"
  - stepNumber: "4.2.5 - CRÉATION FACTURE"
```

#### 4.2.6 - CRÉATION PAYMENT

```
📋 [📋 WORKFLOW ÉTAPE 4.2.6] 💳 Création de l'enregistrement de paiement
  - bookingId
  - userId
  - paymentDetails
  - method: "STRIPE"
  - status
  - transactionId

📋 [📋 WORKFLOW ÉTAPE 4.2.6] ✅ Enregistrement de paiement créé
  - paymentId
  - bookingId
  - paymentRecord: {
      amount
      status
      transactionId
      createdAt
    }
  - bookingUpdate
  - verification
```

#### 4.2.7 - MISE À JOUR STATUT FACTURE

```
📋 [📋 WORKFLOW ÉTAPE 4.2.7] 📋 Mise à jour du statut des factures
  - bookingId
  - paymentId
  - paymentAmount
  - workflowStep: "4/4 - WEBHOOK STRIPE"
  - stepNumber: "4.2.7 - MISE À JOUR STATUT FACTURE"

📋 [📋 WORKFLOW ÉTAPE 4.2.7] ✅ Statut des factures mis à jour
  - bookingId
  - paymentId
  - workflowStep: "4/4 - WEBHOOK STRIPE"
  - stepNumber: "4.2.7 - MISE À JOUR STATUT FACTURE"
```

#### 4.2.8 - GÉNÉRATION PDFS

```
📋 [📋 WORKFLOW ÉTAPE 4.2.8] 📄 Génération des PDFs pour l'email
  - bookingId
  - reference
  - workflowStep: "4/4 - WEBHOOK STRIPE"
  - stepNumber: "4.2.8 - GÉNÉRATION PDFS"
  - pdfsToGenerate: ["Réservation", "Facture"]

📋 [📋 WORKFLOW ÉTAPE 4.2.8.1] 📄 Génération du PDF de réservation
  - bookingId
  - reference
  - workflowStep: "4/4 - WEBHOOK STRIPE"
  - stepNumber: "4.2.8.1 - PDF RÉSERVATION"

📋 [📋 WORKFLOW ÉTAPE 4.2.8.1] ✅ PDF de réservation généré avec succès
  - bookingId
  - reference
  - filename
  - sizeBytes
  - workflowStep: "4/4 - WEBHOOK STRIPE"
  - stepNumber: "4.2.8.1 - PDF RÉSERVATION"

📋 [📋 WORKFLOW ÉTAPE 4.2.8.2] 📄 Génération du PDF de facture
  - bookingId
  - reference
  - workflowStep: "4/4 - WEBHOOK STRIPE"
  - stepNumber: "4.2.8.2 - PDF FACTURE"

📋 [📋 WORKFLOW ÉTAPE 4.2.8.2] ✅ PDF de facture généré avec succès
  - bookingId
  - reference
  - invoiceId
  - filename
  - sizeBytes
  - workflowStep: "4/4 - WEBHOOK STRIPE"
  - stepNumber: "4.2.8.2 - PDF FACTURE"
```

#### 4.2.9 - ENVOI EMAIL

```
📋 [📋 WORKFLOW ÉTAPE 4.2.9] 📧 Envoi de l'email de confirmation
  - bookingId
  - reference
  - recipient
  - attachmentsCount
  - attachments: ["Reservation_XXX.pdf", "Facture_XXX.pdf"]
  - workflowStep: "4/4 - WEBHOOK STRIPE"
  - stepNumber: "4.2.9 - ENVOI EMAIL"

📋 [📋 WORKFLOW ÉTAPE 4.2.9] ✅ Email de confirmation envoyé avec succès
  - bookingId
  - reference
  - recipient
  - messageId
  - queued
  - attachmentsCount
  - attachments
  - workflowStep: "4/4 - WEBHOOK STRIPE"
  - stepNumber: "4.2.9 - ENVOI EMAIL"
```

#### FIN WORKFLOW

```
📋 [📋 WORKFLOW ÉTAPE 4] ✅ WORKFLOW WEBHOOK TERMINÉ AVEC SUCCÈS
  - bookingId
  - reference
  - summary: {
      reservationUpdated: "✅"
      invoiceCreated: "✅"
      paymentCreated: "✅"
      invoiceStatusUpdated: "✅"
      pdfsGenerated: "✅ (2)"
      emailSent: "✅"
    }
  - workflowStep: "4/4 - WEBHOOK STRIPE - TERMINÉ"
```

---

## 🔍 COMMENT SUIVRE LE WORKFLOW

1. **ÉTAPE 1** : Cherchez `[📋 WORKFLOW ÉTAPE 1]` - Réservation créée
2. **ÉTAPE 2** : Cherchez `[📋 WORKFLOW ÉTAPE 2]` - Email de création envoyé
3. **ÉTAPE 3** : Cherchez `[📋 WORKFLOW ÉTAPE 3]` - Session Stripe créée
4. **ÉTAPE 4** : Cherchez `[📋 WORKFLOW ÉTAPE 4]` - Webhook Stripe

Si une étape manque, vous saurez exactement où ça bloque !

---

## ⚠️ LOGS D'ERREUR

Si une étape échoue, vous verrez :
- `❌` au lieu de `✅`
- Le détail de l'erreur dans les logs
- Le `stepNumber` pour identifier rapidement où ça bloque

---

## 📊 RÉSUMÉ DU WORKFLOW

```
ÉTAPE 1: Création réservation (PENDING)
    ↓
ÉTAPE 2: Email de création (sans PDF)
    ↓
ÉTAPE 3: Session Stripe créée
    ↓
[Utilisateur paie sur Stripe]
    ↓
ÉTAPE 4: Webhook Stripe
  ├─ 4.2.1: Récupération réservation
  ├─ 4.2.2: Calcul prix
  ├─ 4.2.3: Détection type paiement
  ├─ 4.2.4: Mise à jour réservation (CONFIRMED)
  ├─ 4.2.5: Création facture
  ├─ 4.2.6: Création Payment
  ├─ 4.2.7: Mise à jour statut facture
  ├─ 4.2.8: Génération PDFs (réservation + facture)
  └─ 4.2.9: Envoi email avec PDFs ✅
```

---

## ✅ VÉRIFICATION RAPIDE

Pour vérifier que tout fonctionne, cherchez dans les logs :

1. ✅ `[📋 WORKFLOW ÉTAPE 1] ✅ Réservation créée`
2. ✅ `[📋 WORKFLOW ÉTAPE 2] ✅ Email de création envoyé`
3. ✅ `[📋 WORKFLOW ÉTAPE 3] ✅ Session Stripe créée`
4. ✅ `[📋 WORKFLOW ÉTAPE 4] 🔔 WEBHOOK STRIPE REÇU`
5. ✅ `[📋 WORKFLOW ÉTAPE 4.2.4] ✅ Réservation mise à jour`
6. ✅ `[📋 WORKFLOW ÉTAPE 4.2.5] ✅ Facture créée`
7. ✅ `[📋 WORKFLOW ÉTAPE 4.2.6] ✅ Enregistrement de paiement créé`
8. ✅ `[📋 WORKFLOW ÉTAPE 4.2.8.1] ✅ PDF de réservation généré`
9. ✅ `[📋 WORKFLOW ÉTAPE 4.2.8.2] ✅ PDF de facture généré`
10. ✅ `[📋 WORKFLOW ÉTAPE 4.2.9] ✅ Email de confirmation envoyé`

Si tous ces logs sont présents avec ✅, le workflow est complet !
