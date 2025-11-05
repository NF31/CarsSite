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
        │  ÉTAPE 4 : PAIEMENT           │
        │  - Récapitulatif              │
        │  - Méthode paiement           │
        │  - Formulaire Stripe          │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  Création Payment Intent       │
        │  (API Stripe)                  │
        └───────────┬───────────────────┘
                    │
                    ├─── Succès ────┐
                    │               │
                    ▼               ▼
        ┌──────────────────┐  ┌──────────────┐
        │  Confirmation     │  │  Erreur      │
        │  Paiement         │  │  Afficher    │
        └─────────┬─────────┘  └──────────────┘
                  │
                  ▼
        ┌───────────────────────────────┐
        │  Création Réservation          │
        │  (Status: CONFIRMED)           │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  Génération Facture            │
        │  (Status: DRAFT)               │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  Envoi Email Confirmation      │
        │  (Template HTML)               │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  Page Confirmation             │
        │  - Référence                    │
        │  - Détails                     │
        │  - Prochaines étapes           │
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
3. **Paiement** : 30% d'acompte minimum, solde à la remise
4. **Annulation** : Remboursement selon politique (jours avant début)
5. **Véhicule** : Marquer comme RESERVED lors de la confirmation

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

## 🔄 Workflow : Paiement Stripe

### Flux de Paiement Complet

```
┌─────────────────────────────────────┐
│  Client → Étape Paiement            │
└───────────────┬─────────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Récapitulatif Affiché     │
    │  - Montant total           │
    │  - Acompte (30%)           │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Sélection Méthode         │
    │  - Carte bancaire          │
    │  - PayPal (optionnel)      │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Clic "Payer"              │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  POST /api/payments/       │
    │  create-intent             │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Création Payment Intent   │
    │  (Stripe API)              │
    └───────────┬────────────────┘
                │
                ├─── Succès ────┐
                │               │
                ▼               ▼
    ┌──────────────────┐  ┌──────────────┐
    │  clientSecret     │  │  Erreur      │
    │  retourné         │  │  Afficher    │
    └──────┬────────────┘  └──────────────┘
           │
           ▼
    ┌───────────────────────────┐
    │  Formulaire Stripe         │
    │  (CardElement)              │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Saisie Carte             │
    │  (Client)                  │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Soumission Formulaire     │
    │  (confirmCardPayment)       │
    └───────────┬────────────────┘
                │
                ├─── Succès ────┐
                │               │
                ▼               ▼
    ┌──────────────────┐  ┌──────────────┐
    │  Payment Intent   │  │  Erreur      │
    │  succeeded        │  │  Carte       │
    └──────┬────────────┘  └──────────────┘
           │
           ▼
    ┌───────────────────────────┐
    │  Webhook Stripe             │
    │  (payment_intent.succeeded) │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Mise à jour Réservation   │
    │  (Status: CONFIRMED)        │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Création Payment Record   │
    │  (Status: COMPLETED)       │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Mise à jour Facture       │
    │  (Status: PAID)            │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Envoi Email Confirmation  │
    │  (Paiement + Facture)      │
    └───────────┬────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  Redirection Confirmation  │
    │  (Page succès)             │
    └───────────────────────────┘
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


