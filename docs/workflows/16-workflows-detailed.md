# Workflows Détaillés - CarRental

## 📋 Vue d'Ensemble

Ce document détaille tous les workflows du système avec diagrammes de flux, états, transitions et règles métier.

---

## 🔄 Workflow : Réservation Client

### Diagramme de Flux Complet

```
┌─────────────────────────────────────────────────────────────┐
│                    DÉBUT : Recherche                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Recherche Véhicules │
            │  (Filtres appliqués) │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Résultats Affichés   │
            │  (Liste véhicules)    │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Sélection Véhicule   │
            │  (Clic sur véhicule)  │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Page Détails         │
            │  (Photos, specs)     │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Clic "Réserver"       │
            └───────────┬───────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  ÉTAPE 1 : RÉSUMÉ             │
        │  - Véhicule sélectionné        │
        │  - Sélection dates             │
        │  - Sélection lieux             │
        │  - Calcul prix véhicule        │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  Validation Disponibilité     │
        │  (API vérifie conflits)       │
        └───────────┬───────────────────┘
                    │
                    ├─── Disponible ────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  Disponible  │    │ Indisponible │
            │  Continuer   │    │  Erreur      │
            └──────┬───────┘    └──────────────┘
                   │
                   ▼
        ┌───────────────────────────────┐
        │  ÉTAPE 2 : SERVICES           │
        │  - Liste services             │
        │  - Sélection optionnelle      │
        │  - Calcul prix services       │
        │  - Total mis à jour           │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  ÉTAPE 3 : INFORMATIONS       │
        │  - Nom, Prénom                │
        │  - Email, Téléphone           │
        │  - Upload permis              │
        │  - Acceptation CGV            │
        └───────────┬───────────────────┘
                    │
                    ├─── Non connecté ───┐
                    │                    │
                    ▼                    ▼
            ┌──────────────┐    ┌──────────────┐
            │  Connecté    │    │ Créer compte │
            │  Continuer   │    │  Ou Login    │
            └──────┬───────┘    └──────┬───────┘
                   │                   │
                   └────────┬──────────┘
                            │
                            ▼
        ┌───────────────────────────────┐
        │  Création Réservation          │
        │  (Status: PENDING)             │
        │  - depositPaid: 0              │
        │  - remainingAmount: totalPrice │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  Email Création Envoyé         │
        │  (Statut: PENDING)             │
        │  - Pas de PDF à ce stade       │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  ÉTAPE 4 : PAIEMENT           │
        │  - Récapitulatif              │
        │  - Options:                   │
        │    • Acompte (30%)            │
        │    • Paiement complet         │
        │    • Empreinte bancaire       │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  Création Session Stripe       │
        │  (Checkout Session)            │
        │  - Métadonnées:                │
        │    • bookingId                 │
        │    • userId                    │
        │    • paymentType               │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  Redirection Stripe Checkout   │
        │  (Paiement externe)            │
        └───────────┬───────────────────┘
                    │
                    ├─── Paiement réussi ────┐
                    │                         │
                    ▼                         ▼
        ┌──────────────────────┐    ┌──────────────┐
        │  Page Succès         │    │  Page Erreur │
        │  (/payment/success)   │    │              │
        └──────┬───────────────┘    └──────────────┘
               │
               ▼
        ┌───────────────────────────────┐
        │  Webhook Stripe Reçu           │
        │  (checkout.session.completed)  │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  WORKFLOW WEBHOOK              │
        │  1. Récupération réservation   │
        │  2. Calcul prix                │
        │  3. Détection type paiement    │
        │  4. Mise à jour réservation    │
        │     (Status: CONFIRMED)        │
        │  5. Création facture (DRAFT)   │
        │  6. Création Payment DB        │
        │  7. Mise à jour statut facture │
        │  8. Génération PDF réservation │
        │  9. Génération PDF facture     │
        │  10. Envoi email avec PDFs ✅  │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  Page Confirmation             │
        │  - Référence                    │
        │  - Détails                     │
        │  - Lien facture                │
        └───────────────────────────────┘
```

### États de la Réservation

```typescript
enum BookingStatus {
  PENDING,      // En attente de paiement
  CONFIRMED,    // Paiement reçu, confirmée
  IN_PROGRESS,  // Location en cours
  COMPLETED,    // Location terminée
  CANCELLED     // Annulée
}
```

### Transitions d'État

```
PENDING ──[Paiement reçu]──> CONFIRMED
CONFIRMED ──[Date début atteinte]──> IN_PROGRESS
IN_PROGRESS ──[Date fin atteinte]──> COMPLETED
PENDING ──[Annulation]──> CANCELLED
CONFIRMED ──[Annulation]──> CANCELLED
```

### Règles Métier

1. **Disponibilité** : Vérifier qu'aucune réservation en conflit n'existe
2. **Dates** : `endDate` doit être > `startDate`
3. **Paiement** : 
   - 30% d'acompte minimum pour confirmer
   - Solde à payer à la remise du véhicule
   - Caution bloquée (empreinte) ou payée avec acompte
4. **Création Réservation** : Statut initial `PENDING` (en attente de paiement)
5. **Confirmation** : Statut passe à `CONFIRMED` après paiement réussi (webhook Stripe)
6. **Facture** : Créée automatiquement après confirmation (statut `DRAFT` → `SENT` après génération PDF)
7. **Annulation** : Remboursement selon politique (jours avant début)

---

## 🔄 Workflow : Gestion Admin - Véhicule

### Ajout de Véhicule

```
┌─────────────────────────────────────┐
│  Admin → Nouveau Véhicule           │
└───────────────┬─────────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Formulaire Complet        │
    │  - Informations base       │
    │  - Caractéristiques        │
    │  - Prix                    │
    │  - Localisation            │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Upload Photos             │
    │  (Min 5, Max 10)          │
    └───────────┬────────────────┘
                │
                ├─── Validation ───┐
                │                  │
                ▼                  ▼
    ┌──────────────────┐  ┌──────────────┐
    │  Photos OK       │  │  Erreur      │
    │  (Cloudinary)    │  │  Réessayer   │
    └──────┬───────────┘  └──────────────┘
           │
           ▼
    ┌───────────────────────────┐
    │  Validation Données       │
    │  (Zod schema)             │
    └───────────┬────────────────┘
                │
                ├─── Erreur ────┐
                │               │
                ▼               ▼
    ┌──────────────────┐  ┌──────────────┐
    │  Valide          │  │  Afficher    │
    │  Créer           │  │  Erreurs     │
    └──────┬───────────┘  └──────────────┘
           │
           ▼
    ┌───────────────────────────┐
    │  Création DB               │
    │  (Status: AVAILABLE)       │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Succès                    │
    │  - Redirection liste       │
    │  - Message confirmation    │
    └───────────────────────────┘
```

### Modification de Véhicule

```
┌─────────────────────────────────────┐
│  Admin → Modifier Véhicule          │
└───────────────┬─────────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Charger Données           │
    │  (Prisma findUnique)      │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Formulaire Pré-rempli     │
    │  (Édition des champs)      │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Validation Modifications  │
    │  (Vérifier conflits)      │
    └───────────┬────────────────┘
                │
                ├─── Réservations actives ───┐
                │                            │
                ▼                            ▼
    ┌──────────────────┐          ┌──────────────────┐
    │  Bloquer         │          │  Autoriser       │
    │  Modification    │          │  Modification    │
    └──────────────────┘          └──────┬───────────┘
                                         │
                                         ▼
                            ┌───────────────────────────┐
                            │  Mise à jour DB            │
                            │  (Prisma update)          │
                            └───────────┬───────────────┘
                                         │
                                         ▼
                            ┌───────────────────────────┐
                            │  Succès                    │
                            │  - Historique sauvegardé   │
                            │  - Notification si besoin  │
                            └───────────────────────────┘
```

---

## 🔄 Workflow : Paiement Stripe (Checkout Session)

### Flux de Paiement Complet avec Webhook

```
┌─────────────────────────────────────┐
│  Client → Étape Paiement            │
│  (Réservation créée: PENDING)       │
└───────────────┬─────────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Récapitulatif Affiché     │
    │  - Montant total           │
    │  - Acompte (30%)           │
    │  - Caution                 │
    │  - Solde à la remise       │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Sélection Option Paiement │
    │  - Acompte seulement       │
    │  - Paiement complet        │
    │  - Empreinte bancaire      │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Clic "Payer"              │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Création Checkout Session │
    │  (Stripe API)              │
    │  - Métadonnées incluses    │
    │    • bookingId             │
    │    • userId                │
    │    • paymentType           │
    └───────────┬────────────────┘
                │
                ├─── Succès ────┐
                │               │
                ▼               ▼
    ┌──────────────────┐  ┌──────────────┐
    │  Redirection      │  │  Erreur      │
    │  Stripe Checkout  │  │  Afficher    │
    └──────┬────────────┘  └──────────────┘
           │
           ▼
    ┌───────────────────────────┐
    │  Paiement sur Stripe       │
    │  (Page externe)            │
    └───────────┬────────────────┘
                │
                ├─── Paiement réussi ────┐
                │                         │
                ▼                         ▼
    ┌──────────────────┐          ┌──────────────┐
    │  Redirection      │          │  Page Annul  │
    │  /payment/success │          │              │
    └──────┬────────────┘          └──────────────┘
           │
           ▼
    ┌───────────────────────────┐
    │  WEBHOOK STRIPE            │
    │  (checkout.session.completed) │
    │  /api/webhooks/stripe      │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Ordre d'exécution:        │
    │  1. Vérification signature │
    │  2. Récupération réservation│
    │  3. Calcul prix            │
    │  4. Détection type paiement│
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  5. Mise à jour Réservation│
    │     - Status: CONFIRMED    │
    │     - depositPaid          │
    │     - remainingAmount      │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  6. Création Facture       │
    │     - Numéro: INV-YYYY-NNN │
    │     - Status: DRAFT        │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  7. Création Payment DB    │
    │     - Status: COMPLETED    │
    │     - Métadonnées Stripe   │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  8. Mise à jour Statut     │
    │     Facture (PAID si total)│
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  9. Génération PDFs        │
    │     - PDF Réservation      │
    │     - PDF Facture          │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  10. Envoi Email           │
    │      - Avec 2 PDFs         │
    │      - Via Queue (BullMQ)  │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Page Succès Affichée      │
    │  - Détails réservation     │
    │  - Lien télécharger facture│
    └───────────────────────────┘
```

### Fallback: Page de Succès

Si le webhook est lent ou n'a pas été traité, la page `/payment/success` exécute les workflows manquants :

```
┌───────────────────────────┐
│  Vérification Webhook      │
│  (Payment existe?)         │
└───────────┬────────────────┘
            │
            ├─── Webhook traité ────┐
            │                        │
            ▼                        ▼
    ┌──────────────┐        ┌──────────────────┐
    │  Afficher     │        │  Exécuter         │
    │  Page succès  │        │  Workflows:       │
    │               │        │  - Création facture│
    │               │        │  - Génération PDFs │
    │               │        │  - Envoi email     │
    └───────────────┘        └───────────────────┘
```

### États du Paiement

```typescript
enum PaymentStatus {
  PENDING,      // En attente
  PROCESSING,   // En cours de traitement
  COMPLETED,   // Réussi
  FAILED,      // Échoué
  REFUNDED     // Remboursé
}
```

---

## 🔄 Workflow : Annulation de Réservation

### Processus d'Annulation

```
┌─────────────────────────────────────┐
│  Client/Admin → Annuler Réservation  │
└───────────────┬─────────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Vérifier Statut           │
    │  (Doit être PENDING ou    │
    │   CONFIRMED)              │
    └───────────┬────────────────┘
                │
                ├─── IN_PROGRESS ───┐
                │                   │
                ▼                   ▼
    ┌──────────────────┐  ┌──────────────────┐
    │  Autoriser        │  │  Refuser          │
    │  Annulation       │  │  (Location        │
    │                   │  │   en cours)       │
    └──────┬────────────┘  └──────────────────┘
           │
           ▼
    ┌───────────────────────────┐
    │  Calculer Politique        │
    │  Annulation                │
    │  - Jours avant début       │
    │  - Frais d'annulation      │
    └───────────┬────────────────┘
                │
                ├─── > 7 jours ───┐
                │                 │
                ├─── 3-7 jours ──┤
                │                 │
                └─── < 3 jours ──┘
                │
                ▼
    ┌───────────────────────────┐
    │  Calcul Remboursement      │
    │  - > 7j : 100%             │
    │  - 3-7j : 50%              │
    │  - < 3j : 0%               │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Mise à jour Réservation   │
    │  (Status: CANCELLED)       │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Libération Véhicule       │
    │  (Status: AVAILABLE)       │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Création Remboursement    │
    │  (Stripe Refund)           │
    └───────────┬────────────────┘
                │
                ├─── Succès ────┐
                │               │
                ▼               ▼
    ┌──────────────────┐  ┌──────────────┐
    │  Payment Status   │  │  Erreur      │
    │  REFUNDED         │  │  Logger      │
    └──────┬────────────┘  └──────────────┘
           │
           ▼
    ┌───────────────────────────┐
    │  Envoi Email Annulation    │
    │  (Détails + Remboursement) │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Confirmation              │
    │  (Message succès)          │
    └───────────────────────────┘
```

---

## 🔄 Workflow : Maintenance Véhicule

### Planification Maintenance

```
┌─────────────────────────────────────┐
│  Admin → Planifier Maintenance       │
└───────────────┬─────────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Sélection Véhicule         │
    │  (Vérifier disponibilité)  │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Choix Dates               │
    │  (Début + Fin)             │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Vérifier Conflits         │
    │  (Réservations existantes) │
    └───────────┬────────────────┘
                │
                ├─── Conflit ────┐
                │                 │
                ▼                 ▼
    ┌──────────────────┐  ┌──────────────────┐
    │  Avertir Admin   │  │  Aucun Conflit   │
    │  (Réservations    │  │  Continuer       │
    │   à modifier)     │  │                  │
    └──────────────────┘  └──────┬───────────┘
                                 │
                                 ▼
                    ┌───────────────────────────┐
                    │  Création Maintenance      │
                    │  (Status: SCHEDULED)       │
                    └───────────┬───────────────┘
                                 │
                                 ▼
                    ┌───────────────────────────┐
                    │  Marquer Véhicule          │
                    │  (Status: MAINTENANCE)      │
                    └───────────┬───────────────┘
                                 │
                                 ▼
                    ┌───────────────────────────┐
                    │  Notifier Réservations     │
                    │  Affectées (si conflit)   │
                    └───────────┬───────────────┘
                                 │
                                 ▼
                    ┌───────────────────────────┐
                    │  Succès                    │
                    │  (Maintenance planifiée)   │
                    └───────────────────────────┘
```

### États Maintenance

```
SCHEDULED ──[Début]──> IN_PROGRESS
IN_PROGRESS ──[Fin]──> COMPLETED
SCHEDULED ──[Annulation]──> CANCELLED
IN_PROGRESS ──[Annulation]──> CANCELLED
```

---

## 🔄 Workflow : Modération Avis

### Processus de Modération

```
┌─────────────────────────────────────┐
│  Client → Laisser Avis               │
│  (Après location terminée)          │
└───────────────┬─────────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Formulaire Avis           │
    │  - Note (1-5)              │
    │  - Commentaire             │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Validation                │
    │  (Zod schema)             │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Création Avis              │
    │  (Status: PENDING)         │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Notification Admin        │
    │  (Nouvel avis à modérer)   │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Admin → Modération         │
    │  (Voir liste avis)         │
    └───────────┬────────────────┘
                │
                ├─── Approuver ───┐
                │                 │
                ├─── Refuser ────┤
                │                 │
                └─── Modifier ────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Mise à jour Statut        │
    │  (APPROVED/REJECTED)      │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Si APPROVED               │
    │  - Afficher sur véhicule   │
    │  - Mettre à jour note moy. │
    └───────────────────────────┘
```

---

## 📊 Règles Métier Globales

### Disponibilité Véhicule

1. **Vérification** : Avant chaque réservation, vérifier :
   - Pas de réservation active (non CANCELLED) en conflit
   - Pas de maintenance active (non COMPLETED/CANCELLED) en conflit
   - Statut du véhicule = AVAILABLE

2. **Conflit de dates** : Deux réservations sont en conflit si :
   ```
   (startDate1 <= endDate2) AND (endDate1 >= startDate2)
   ```

### Calcul de Prix

1. **Prix véhicule** : `pricePerDay * nombreJours`
2. **Prix services** :
   - PER_DAY : `price * nombreJours`
   - FIXED : `price`
   - PERCENTAGE : `(prixVéhicule * price) / 100`
3. **Total** : `prixVéhicule + prixServices`
4. **Acompte** : `total * 0.3` (30%)
5. **Solde** : `total - acompte`

### Politique d'Annulation

| Jours avant début | Remboursement |
|-------------------|---------------|
| > 7 jours         | 100%          |
| 3-7 jours         | 50%           |
| < 3 jours         | 0%            |

---

## ✅ Checklist Workflows

- [x] Workflow réservation client
- [x] Workflow paiement Stripe
- [x] Workflow annulation
- [x] Workflow gestion véhicule admin
- [x] Workflow maintenance
- [x] Workflow modération avis
- [x] Règles métier documentées
- [ ] Tests de workflows
- [ ] Diagrammes visuels (optionnel)


