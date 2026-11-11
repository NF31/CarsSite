# User Stories Complètes - CarRental

## Vue d'Ensemble

Ce document présente toutes les User Stories du projet CarRental, organisées par acteur et par fonctionnalité.

---

## User Stories - Client

### Recherche et Navigation

#### US-001 : Recherche de véhicules
**En tant que** client  
**Je veux** rechercher des véhicules disponibles  
**Afin de** trouver le véhicule qui correspond à mes besoins

**Critères d'acceptation :**
- [ ] Recherche par date de location et retour
- [ ] Filtres par catégorie (économique, compact, SUV, luxe, etc.)
- [ ] Filtres par prix (min/max)
- [ ] Filtres par nombre de places
- [ ] Filtres par transmission (manuelle/automatique)
- [ ] Affichage des résultats avec photos et prix
- [ ] Tri par prix, popularité, note

#### US-002 : Consultation des détails d'un véhicule
**En tant que** client  
**Je veux** voir les détails complets d'un véhicule  
**Afin de** prendre une décision éclairée

**Critères d'acceptation :**
- [ ] Galerie photos (minimum 5 photos)
- [ ] Caractéristiques techniques (marque, modèle, année, kilométrage)
- [ ] Équipements inclus
- [ ] Prix par jour
- [ ] Disponibilité en calendrier
- [ ] Avis clients (note moyenne et commentaires)
- [ ] Localisation de l'agence

### Réservation

#### US-003 : Création d'une réservation
**En tant que** client  
**Je veux** réserver un véhicule en ligne  
**Afin de** garantir ma location

**Critères d'acceptation :**
- [ ] Sélection des dates de location et retour
- [ ] Choix du lieu de prise en charge et restitution
- [ ] Sélection des services additionnels (assurance, GPS, etc.)
- [ ] Récapitulatif avec calcul du prix total
- [ ] Saisie des informations personnelles
- [ ] Upload du permis de conduire
- [ ] Confirmation par email

#### US-004 : Paiement en ligne
**En tant que** client  
**Je veux** payer ma réservation en ligne  
**Afin de** sécuriser ma location

**Critères d'acceptation :**
- [ ] Intégration Stripe et PayPal
- [ ] Calcul automatique du total (véhicule + services + frais)
- [ ] Acompte ou paiement complet
- [ ] Confirmation de paiement
- [ ] Facture générée automatiquement
- [ ] Sécurité des données bancaires

#### US-005 : Modification d'une réservation
**En tant que** client  
**Je veux** modifier ma réservation  
**Afin de** ajuster mes dates ou services

**Critères d'acceptation :**
- [ ] Modification des dates (si disponible)
- [ ] Ajout/suppression de services additionnels
- [ ] Recalcul du prix
- [ ] Notification des changements
- [ ] Remboursement partiel si applicable

#### US-006 : Annulation d'une réservation
**En tant que** client  
**Je veux** annuler ma réservation  
**Afin de** récupérer mon argent si nécessaire

**Critères d'acceptation :**
- [ ] Annulation avec politique de remboursement
- [ ] Calcul automatique des frais d'annulation
- [ ] Remboursement selon les délais
- [ ] Confirmation d'annulation par email

### Gestion de Compte

#### US-007 : Création de compte
**En tant que** visiteur  
**Je veux** créer un compte  
**Afin de** accéder à mes réservations

**Critères d'acceptation :**
- [x] Formulaire d'inscription (nom, email, téléphone)
- [x] Vérification email
- [x] Choix du mot de passe sécurisé
- [x] Acceptation des CGV
- [x] Confirmation d'inscription

#### US-008 : Connexion
**En tant que** client  
**Je veux** me connecter à mon compte  
**Afin de** accéder à mes informations

**Critères d'acceptation :**
- [x] Connexion par email/mot de passe
- [x] Option "Se souvenir de moi"
- [x] Récupération de mot de passe
- [x] Session sécurisée

#### US-009 : Consultation de l'historique
**En tant que** client  
**Je veux** voir mon historique de locations  
**Afin de** suivre mes réservations passées

**Critères d'acceptation :**
- [ ] Liste des réservations (passées, en cours, à venir)
- [ ] Détails de chaque réservation
- [ ] Statut de chaque réservation
- [ ] Factures téléchargeables
- [ ] Option de réserver à nouveau

#### US-010 : Modification du profil
**En tant que** client  
**Je veux** modifier mes informations personnelles  
**Afin de** les mettre à jour

**Critères d'acceptation :**
- [x] Modification des coordonnées
- [x] Mise à jour du permis de conduire
- [x] Changement de mot de passe
- [x] Préférences de notification

### Avis et Commentaires

#### US-011 : Laisser un avis
**En tant que** client  
**Je veux** laisser un avis sur un véhicule  
**Afin de** partager mon expérience

**Critères d'acceptation :**
- [ ] Note de 1 à 5 étoiles
- [ ] Commentaire écrit
- [ ] Avis possible uniquement après location
- [ ] Modération avant publication
- [ ] Confirmation de publication

#### US-012 : Consulter les avis
**En tant que** client  
**Je veux** consulter les avis des autres clients  
**Afin de** me faire une opinion

**Critères d'acceptation :**
- [ ] Affichage des avis avec notes
- [ ] Filtres par note
- [ ] Date de publication
- [ ] Avis vérifiés (badge)

---

## User Stories - Administrateur

### Dashboard

#### US-101 : Vue d'ensemble du tableau de bord
**En tant que** administrateur  
**Je veux** voir un tableau de bord avec les statistiques clés  
**Afin de** avoir une vision globale de l'activité

**Critères d'acceptation :**
- [ ] Nombre de réservations du jour/mois
- [ ] Revenus du jour/mois
- [ ] Taux d'occupation de la flotte
- [ ] Graphiques de tendances
- [ ] Réservations récentes
- [ ] Alertes (maintenance, disponibilité)

### Gestion des Véhicules

#### US-102 : Ajouter un véhicule
**En tant que** administrateur  
**Je veux** ajouter un nouveau véhicule à la flotte  
**Afin de** l'offrir à la location

**Critères d'acceptation :**
- [ ] Formulaire complet (marque, modèle, année, etc.)
- [ ] Upload de photos (minimum 5)
- [ ] Caractéristiques techniques
- [ ] Prix par jour
- [ ] Catégorie et disponibilité
- [ ] Localisation (agence)
- [ ] Statut (disponible/en maintenance)

#### US-103 : Modifier un véhicule
**En tant que** administrateur  
**Je veux** modifier les informations d'un véhicule  
**Afin de** les mettre à jour

**Critères d'acceptation :**
- [ ] Édition de tous les champs
- [ ] Modification des photos
- [ ] Changement de prix
- [ ] Mise à jour du statut
- [ ] Historique des modifications

#### US-104 : Supprimer un véhicule
**En tant que** administrateur  
**Je veux** supprimer un véhicule de la flotte  
**Afin de** retirer un véhicule vendu ou hors service

**Critères d'acceptation :**
- [ ] Vérification des réservations actives
- [ ] Confirmation avant suppression
- [ ] Archivage des données
- [ ] Notification aux clients concernés

#### US-105 : Gérer la disponibilité
**En tant que** administrateur  
**Je veux** gérer la disponibilité des véhicules  
**Afin de** éviter les sur-réservations

**Critères d'acceptation :**
- [ ] Calendrier de disponibilité
- [ ] Blocage de dates
- [ ] Marquer comme indisponible
- [ ] Gestion des périodes de maintenance

### Gestion des Réservations

#### US-106 : Voir toutes les réservations
**En tant que** administrateur  
**Je veux** voir toutes les réservations  
**Afin de** les gérer efficacement

**Critères d'acceptation :**
- [ ] Liste complète avec filtres
- [ ] Filtres par statut, date, client, véhicule
- [ ] Tri par date, prix, client
- [ ] Recherche par référence
- [ ] Export Excel/PDF

#### US-107 : Créer une réservation manuelle
**En tant que** administrateur  
**Je veux** créer une réservation manuellement  
**Afin de** gérer les réservations par téléphone

**Critères d'acceptation :**
- [ ] Formulaire complet
- [ ] Sélection du client (ou création)
- [ ] Choix du véhicule
- [ ] Dates et services
- [ ] Génération de la facture
- [ ] Envoi de confirmation

#### US-108 : Modifier une réservation
**En tant que** administrateur  
**Je veux** modifier une réservation  
**Afin de** ajuster les détails

**Critères d'acceptation :**
- [ ] Modification de tous les champs
- [ ] Changement de véhicule
- [ ] Modification des dates
- [ ] Ajout/suppression de services
- [ ] Recalcul du prix
- [ ] Notification au client

#### US-109 : Annuler une réservation
**En tant que** administrateur  
**Je veux** annuler une réservation  
**Afin de** gérer les annulations

**Critères d'acceptation :**
- [ ] Annulation avec raison
- [ ] Calcul des frais d'annulation
- [ ] Remboursement si applicable
- [ ] Notification au client
- [ ] Libération du véhicule

#### US-110 : Marquer une réservation comme complétée
**En tant que** administrateur  
**Je veux** marquer une réservation comme complétée  
**Afin de** finaliser la location

**Critères d'acceptation :**
- [ ] Vérification de l'état du véhicule
- [ ] Enregistrement des dommages éventuels
- [ ] Calcul des frais supplémentaires
- [ ] Génération de la facture finale
- [ ] Libération pour nouvelle réservation

### Gestion des Clients

#### US-111 : Voir tous les clients
**En tant que** administrateur  
**Je veux** voir tous les clients  
**Afin de** les gérer

**Critères d'acceptation :**
- [ ] Liste complète avec recherche
- [ ] Filtres par statut, date d'inscription
- [ ] Statistiques par client
- [ ] Historique des locations

#### US-112 : Voir le profil d'un client
**En tant que** administrateur  
**Je veux** voir le profil détaillé d'un client  
**Afin de** accéder à toutes ses informations

**Critères d'acceptation :**
- [ ] Informations personnelles
- [ ] Historique des réservations
- [ ] Avis laissés
- [ ] Factures
- [ ] Notes internes

#### US-113 : Modifier un client
**En tant que** administrateur  
**Je veux** modifier les informations d'un client  
**Afin de** les mettre à jour

**Critères d'acceptation :**
- [ ] Édition de tous les champs
- [ ] Mise à jour du permis
- [ ] Changement de statut
- [ ] Ajout de notes internes

### Gestion de la Maintenance

#### US-114 : Planifier une maintenance
**En tant que** administrateur  
**Je veux** planifier une maintenance  
**Afin de** maintenir la flotte en bon état

**Critères d'acceptation :**
- [ ] Sélection du véhicule
- [ ] Type de maintenance (entretien, réparation)
- [ ] Date de début et fin
- [ ] Coût estimé
- [ ] Description
- [ ] Marquage automatique comme indisponible

#### US-115 : Voir l'historique de maintenance
**En tant que** administrateur  
**Je veux** voir l'historique de maintenance d'un véhicule  
**Afin de** suivre les entretiens

**Critères d'acceptation :**
- [ ] Liste chronologique
- [ ] Détails de chaque intervention
- [ ] Coûts cumulés
- [ ] Prochain entretien prévu

### Gestion des Services

#### US-116 : Gérer les services additionnels
**En tant que** administrateur  
**Je veux** gérer les services additionnels  
**Afin de** proposer des options aux clients

**Critères d'acceptation :**
- [ ] Ajout/modification/suppression
- [ ] Prix par service
- [ ] Description et icône
- [ ] Disponibilité par catégorie de véhicule

### Statistiques et Rapports

#### US-117 : Voir les statistiques
**En tant que** administrateur  
**Je veux** voir des statistiques détaillées  
**Afin de** analyser la performance

**Critères d'acceptation :**
- [ ] Revenus par période
- [ ] Taux d'occupation par véhicule
- [ ] Véhicules les plus populaires
- [ ] Périodes les plus chargées
- [ ] Graphiques et tableaux
- [ ] Export des données

### Facturation

#### US-118 : Générer une facture
**En tant que** administrateur  
**Je veux** générer une facture  
**Afin de** facturer les clients

**Critères d'acceptation :**
- [ ] Génération automatique ou manuelle
- [ ] Template professionnel
- [ ] Détails de la réservation
- [ ] Calcul des taxes
- [ ] Export PDF
- [ ] Envoi par email

### Gestion des Avis

#### US-119 : Modérer les avis
**En tant que** administrateur  
**Je veux** modérer les avis clients  
**Afin de** maintenir la qualité

**Critères d'acceptation :**
- [ ] Liste des avis en attente
- [ ] Approuver/refuser
- [ ] Modifier si nécessaire
- [ ] Notification au client

### Paramètres

#### US-120 : Configurer l'agence
**En tant que** administrateur  
**Je veux** configurer les paramètres de l'agence  
**Afin de** personnaliser la plateforme

**Critères d'acceptation :**
- [ ] Informations de l'agence
- [ ] Coordonnées et adresses
- [ ] Horaires d'ouverture
- [ ] Politique d'annulation
- [ ] Frais et taxes
- [ ] Configuration des emails

---

## ‍ User Stories - Employé

#### US-201 : Voir les réservations du jour
**En tant que** employé  
**Je veux** voir les réservations du jour  
**Afin de** préparer les véhicules

**Critères d'acceptation :**
- [ ] Liste des réservations du jour
- [ ] Heure de prise en charge
- [ ] Véhicule à préparer
- [ ] Statut de préparation

#### US-202 : Enregistrer la remise d'un véhicule
**En tant que** employé  
**Je veux** enregistrer la remise d'un véhicule  
**Afin de** documenter l'état

**Critères d'acceptation :**
- [ ] Vérification du permis
- [ ] État du véhicule (photos)
- [ ] Kilométrage
- [ ] Signature électronique
- [ ] Remise des clés

#### US-203 : Enregistrer la restitution d'un véhicule
**En tant que** employé  
**Je veux** enregistrer la restitution d'un véhicule  
**Afin de** vérifier l'état

**Critères d'acceptation :**
- [ ] Vérification de l'état
- [ ] Photos de dommages éventuels
- [ ] Kilométrage final
- [ ] Calcul des frais supplémentaires
- [ ] Finalisation de la réservation

---

## Priorités

### Priorité Haute (MVP)
- US-001, US-002, US-003, US-004, US-007, US-008
- US-101, US-102, US-106, US-107, US-111, US-112

### Priorité Moyenne
- US-005, US-006, US-009, US-010, US-011, US-012
- US-103, US-104, US-108, US-109, US-113, US-114, US-115, US-117, US-118

### Priorité Basse
- US-105, US-116, US-119, US-120
- US-201, US-202, US-203

---

## Définition de "Terminé"

Une User Story est considérée comme terminée quand :
- [ ] Le code est développé et testé
- [ ] Les tests unitaires passent
- [ ] Les tests d'intégration passent
- [ ] Le code est revu et approuvé
- [ ] La documentation est à jour
- [ ] L'interface est responsive et accessible
- [ ] Les performances sont acceptables


