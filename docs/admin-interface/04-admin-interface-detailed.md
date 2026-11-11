# Interface Admin Détaillée - CarRental

## Vue d'Ensemble

Ce document détaille l'interface d'administration complète de CarRental, incluant toutes les sections, fonctionnalités et workflows.

---

## Structure de l'Interface Admin

### Navigation Principale

```
┌─────────────────────────────────────────┐
│  Logo CarRental  [Dashboard] [Véhicules] [Réservations] ... │
└─────────────────────────────────────────┘
```

**Sections Principales :**
1. Dashboard
2. Véhicules
3. Réservations
4. Clients
5. Services
6. Maintenance
7. Galerie
8. Avis
9. Statistiques
10. Facturation
11. Notifications
12. Paramètres

---

## Dashboard

### Vue d'Ensemble

**Objectif** : Avoir une vision globale de l'activité en un coup d'œil

#### Métriques Principales (Cards)

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│Réserv.   │  │Revenus   │  │Véhicules │  │Taux      │
│  Aujourd'hui│  │  Ce Mois │  │Disponibles│  │Occupation│
│    12     │  │  45,230€ │  │   28/35  │  │   85%    │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

#### Graphiques

**Revenus sur 30 jours**
- Graphique en ligne
- Revenus quotidiens
- Comparaison avec mois précédent

**Réservations par catégorie**
- Graphique en barres
- Répartition par type de véhicule

**Taux d'occupation**
- Graphique circulaire
- Disponible / Réservé / Maintenance

#### Réservations Récentes

Tableau avec :
- Client
- Véhicule
- Dates
- Statut
- Actions (Voir, Modifier)

#### Alertes

- Véhicules en maintenance depuis X jours
- Réservations à confirmer
- Paiements en attente
- Véhicules nécessitant un entretien

---

## Gestion des Véhicules

### Liste des Véhicules

**Filtres :**
- Statut (Disponible, Réservé, Maintenance)
- Catégorie
- Marque
- Localisation
- Recherche par modèle/plaque

**Colonnes du tableau :**
- Photo
- Marque/Modèle
- Catégorie
- Statut
- Prix/jour
- Disponibilité
- Actions

**Actions :**
- Voir détails
- Modifier
- Supprimer
- Marquer indisponible
- Ajouter photos

### Ajout/Modification de Véhicule

**Formulaire :**

```
┌─────────────────────────────────────────┐
│  Informations de Base                   │
│  ┌─────────────────────────────────┐   │
│  │ Marque: [Peugeot        ▼]     │   │
│  │ Modèle: [208              ]     │   │
│  │ Année: [2023              ]     │   │
│  │ Plaque: [AB-123-CD        ]     │   │
│  │ Kilométrage: [12000        ]     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Caractéristiques                       │
│  ┌─────────────────────────────────┐   │
│  │ Catégorie: [Compact      ▼]     │   │
│  │ Nombre de places: [5      ▼]     │   │
│  │ Transmission: [Automatique ▼]   │   │
│  │ Carburant: [Essence       ▼]     │   │
│  │ Couleur: [Blanc          ]     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Équipements                            │
│  ☑ Climatisation                        │
│  ☑ GPS                                  │
│  ☑ Bluetooth                            │
│  ☑ Caméra de recul                      │
│                                         │
│  Tarification                           │
│  ┌─────────────────────────────────┐   │
│  │ Prix/jour: [45€            ]     │   │
│  │ Prix/semaine: [280€        ]     │   │
│  │ Prix/mois: [1200€          ]     │   │
│  │ Dépôt de garantie: [500€   ]     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Localisation                           │
│  ┌─────────────────────────────────┐   │
│  │ Agence: [Paris Centre    ▼]     │   │
│  │ Adresse: [123 Rue...      ]     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Photos                                 │
│  [Upload zone - Drag & Drop]            │
│  Minimum 5 photos requis                │
│                                         │
│  [Enregistrer] [Annuler]                │
└─────────────────────────────────────────┘
```

### Calendrier de Disponibilité

Vue calendrier pour chaque véhicule :
- Dates réservées (rouge)
- Dates disponibles (vert)
- Dates en maintenance (orange)
- Actions : Bloquer/Débloquer dates

---

## Gestion des Réservations

### Liste des Réservations

**Filtres :**
- Statut (En attente, Confirmée, En cours, Terminée, Annulée)
- Date de début
- Date de fin
- Client
- Véhicule
- Recherche par référence

**Colonnes :**
- Référence
- Client
- Véhicule
- Dates
- Prix total
- Statut
- Actions

**Actions :**
- Voir détails
- Modifier
- Annuler
- Confirmer
- Générer facture
- Envoyer email

### Détails d'une Réservation

```
┌─────────────────────────────────────────┐
│  Réservation #BK-2024-001                │
│  Statut: [Confirmée ▼]                  │
│                                         │
│  Client                                  │
│  ┌─────────────────────────────────┐   │
│  │ John Doe                          │   │
│  │ john@example.com                  │   │
│  │ +33612345678                      │   │
│  │ [Voir profil client]              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Véhicule                                │
│  ┌─────────────────────────────────┐   │
│  │ Peugeot 208 - 2023               │   │
│  │ Plaque: AB-123-CD                │   │
│  │ [Voir véhicule]                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Dates                                   │
│  ┌─────────────────────────────────┐   │
│  │ Début: 15/01/2024 10:00         │   │
│  │ Fin: 20/01/2024 18:00           │   │
│  │ Durée: 5 jours                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Lieux                                   │
│  ┌─────────────────────────────────┐   │
│  │ Prise en charge: Paris Centre    │   │
│  │ Restitution: Paris Centre        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Services Additionnels                  │
│  • Assurance complète: +50€             │
│  • GPS: +10€/jour                      │
│                                         │
│  Tarification                           │
│  ┌─────────────────────────────────┐   │
│  │ Véhicule (5j): 450€              │   │
│  │ Services: 100€                    │   │
│  │ Total: 550€                       │   │
│  │ Acompte: 165€ (payé)              │   │
│  │ Solde: 385€                       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Paiement                                │
│  ┌─────────────────────────────────┐   │
│  │ Méthode: Carte bancaire          │   │
│  │ Statut: Partiel                  │   │
│  │ [Voir détails paiement]          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Actions                                 │
│  [Modifier] [Annuler] [Confirmer]       │
│  [Générer facture] [Envoyer email]       │
└─────────────────────────────────────────┘
```

### Création Manuelle de Réservation

Formulaire similaire au processus client, mais avec :
- Sélection du client (ou création)
- Possibilité de modifier les prix
- Notes internes
- Statut personnalisé

---

## Gestion des Clients

### Liste des Clients

**Filtres :**
- Date d'inscription
- Nombre de réservations
- Statut (actif, inactif)
- Recherche par nom/email

**Colonnes :**
- Nom
- Email
- Téléphone
- Réservations
- Dernière location
- Actions

### Profil Client

```
┌─────────────────────────────────────────┐
│  John Doe                                │
│  john@example.com                        │
│                                         │
│  Informations                            │
│  ┌─────────────────────────────────┐   │
│  │ Téléphone: +33612345678          │   │
│  │ Date d'inscription: 01/01/2023   │   │
│  │ Statut: Actif                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Statistiques                            │
│  ┌─────────────────────────────────┐   │
│  │ Réservations totales: 5          │   │
│  │ Dépenses totales: 2,450€        │   │
│  │ Note moyenne: 4.5/5              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Historique des Réservations            │
│  [Tableau avec toutes les réservations] │
│                                         │
│  Avis Laissés                            │
│  [Liste des avis]                       │
│                                         │
│  Notes Internes                          │
│  ┌─────────────────────────────────┐   │
│  │ [Zone de texte]                 │   │
│  │ [Enregistrer]                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Actions                                 │
│  [Modifier] [Envoyer email] [Créer RDV] │
└─────────────────────────────────────────┘
```

---

## Gestion de la Maintenance

### Liste des Maintenances

**Filtres :**
- Statut (Planifiée, En cours, Terminée)
- Type (Entretien, Réparation)
- Véhicule
- Date

### Planification de Maintenance

```
┌─────────────────────────────────────────┐
│  Nouvelle Maintenance                    │
│                                         │
│  Véhicule: [Peugeot 208        ▼]      │
│                                         │
│  Type:                                   │
│  ○ Entretien                            │
│  ○ Réparation                           │
│                                         │
│  Dates                                   │
│  ┌─────────────────────────────────┐   │
│  │ Début: [15/01/2024        ]     │   │
│  │ Fin: [17/01/2024          ]     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Description                             │
│  ┌─────────────────────────────────┐   │
│  │ [Zone de texte]                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Coût                                    │
│  ┌─────────────────────────────────┐   │
│  │ Coût estimé: [250€        ]     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Enregistrer] [Annuler]                │
└─────────────────────────────────────────┘
```

### Historique par Véhicule

Vue détaillée de tous les entretiens d'un véhicule :
- Liste chronologique
- Coûts cumulés
- Prochain entretien prévu

---

## Gestion des Services

### Liste des Services Additionnels

**Services :**
- Assurance complète
- GPS
- Siège enfant
- Chauffeur
- etc.

**Actions par service :**
- Modifier
- Supprimer
- Activer/Désactiver

### Ajout/Modification de Service

```
┌─────────────────────────────────────────┐
│  Nom: [GPS                        ]     │
│                                         │
│  Description                             │
│  ┌─────────────────────────────────┐   │
│  │ [Zone de texte]                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Prix                                    │
│  ┌─────────────────────────────────┐   │
│  │ Type: [Par jour          ▼]     │   │
│  │ Montant: [10€            ]     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Disponibilité                           │
│  ☑ Toutes catégories                     │
│  ☐ Économique uniquement                 │
│                                         │
│  Icône: [Sélectionner]                  │
│                                         │
│  [Enregistrer] [Annuler]                │
└─────────────────────────────────────────┘
```

---

## Statistiques

### Vue Globale

**Graphiques :**
- Revenus par période (ligne)
- Réservations par catégorie (barres)
- Taux d'occupation (circulaire)
- Top 10 véhicules (barres horizontales)

**Tableaux :**
- Revenus détaillés
- Réservations par mois
- Performance par véhicule

### Exports

- Export Excel
- Export PDF
- Export CSV

---

## Facturation

### Liste des Factures

**Filtres :**
- Date
- Client
- Statut (Payée, En attente, Annulée)
- Montant

### Génération de Facture

Génération automatique ou manuelle avec :
- Template professionnel
- Logo de l'agence
- Détails de la réservation
- Calcul des taxes
- Export PDF
- Envoi par email

---

## Paramètres

### Informations de l'Agence

- Nom
- Logo
- Adresse
- Coordonnées
- Horaires d'ouverture

### Configuration

- Devise (€)
- Langue
- Fuseau horaire
- Politique d'annulation
- Frais et taxes
- Dépôt de garantie

### Emails

- Templates d'emails
- Configuration SMTP
- Notifications automatiques

---

## Checklist Interface Admin

- [ ] Dashboard avec métriques
- [ ] Gestion complète des véhicules
- [ ] Gestion des réservations
- [ ] Gestion des clients
- [ ] Gestion de la maintenance
- [ ] Gestion des services
- [ ] Statistiques et rapports
- [ ] Facturation
- [ ] Paramètres
- [ ] Responsive design
- [ ] Permissions et rôles


