# 🚗 CarRental - Plateforme de Location de Voitures

## 🎯 Description du Projet

CarRental est une plateforme web moderne de location de voitures qui permet aux clients de réserver facilement des véhicules en ligne et aux administrateurs de gérer efficacement la flotte et les réservations.

## ✨ Fonctionnalités Principales

### 👤 Côté Client

- **Recherche de véhicules** : Filtres avancés (catégorie, prix, disponibilité)
- **Réservation en ligne** : Processus simplifié en 4 étapes
- **Choix du véhicule** : Sélection avec photos détaillées et caractéristiques
- **Services additionnels** : Assurance, GPS, siège enfant, etc.
- **Galerie** : Photos des véhicules disponibles
- **Avis clients** : Système d'évaluation et de commentaires
- **Gestion de compte** : Historique des locations, factures, préférences
- **Paiement sécurisé** : Intégration Stripe/PayPal

### 🎛️ Côté Admin

- **Dashboard** : Vue d'ensemble des activités et statistiques
- **Gestion des véhicules** : Ajout, modification, suivi de la flotte
- **Gestion des réservations** : Création, modification, annulation
- **Gestion des clients** : Base de données et historique
- **Gestion des services** : Services additionnels et tarifs
- **Galerie** : Upload et organisation des photos de véhicules
- **Maintenance** : Suivi des entretiens et réparations
- **Avis** : Modération des commentaires
- **Statistiques** : Revenus, taux d'occupation, analyses
- **Notifications** : Emails automatiques (confirmations, rappels)
- **Paramètres** : Configuration de l'agence, tarifs, disponibilités
- **Facturation** : Génération de factures et reçus

## 🚀 Technologies Utilisées

### Frontend
- **Next.js 16** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS
- **React Hook Form** - Gestion des formulaires
- **Zod** - Validation des données
- **Framer Motion** - Animations fluides

### Backend
- **Next.js API Routes** - API Serverless
- **Neon PostgreSQL** - Base de données PostgreSQL serverless
- **Prisma** - ORM pour PostgreSQL
- **Redis** - Cache et sessions (optionnel)
- **NextAuth.js** - Authentification

### Services Externes
- **Cloudinary** - Gestion des images
- **Stripe/PayPal** - Paiements en ligne
- **Nodemailer** - Envoi d'emails
- **Neon** - Base de données PostgreSQL cloud
- **Google Maps API** - Géolocalisation et itinéraires

## 📚 Documentation Complète

### 📋 Documents Principaux

1. **[01-user-stories-complete.md](./01-user-stories-complete.md)** - User Stories détaillées
2. **[02-technical-specifications.md](./02-technical-specifications.md)** - Spécifications techniques
3. **[03-user-experience-design.md](./03-user-experience-design.md)** - Design UX et parcours client
4. **[04-admin-interface-detailed.md](./04-admin-interface-detailed.md)** - Interface admin complète
5. **[05-admin-navbar-dashboard.md](./05-admin-navbar-dashboard.md)** - Navigation et dashboard admin
6. **[06-data-models.md](./06-data-models.md)** - Modèles de données TypeScript
7. **[07-data-dictionary.md](./07-data-dictionary.md)** - Dictionnaire de données
8. **[08-prisma-schema.md](./08-prisma-schema.md)** - Schéma Prisma complet
9. **[09-admin-directory-structure.md](./09-admin-directory-structure.md)** - Structure du répertoire admin
10. **[10-documentation-checklist.md](./10-documentation-checklist.md)** - Checklist de la documentation
11. **[11-complete-documentation-review.md](./11-complete-documentation-review.md)** - Vérification complète
12. **[12-final-readiness-assessment.md](./12-final-readiness-assessment.md)** - Évaluation finale
13. **[13-global-architecture-overview.md](./13-global-architecture-overview.md)** - Architecture globale complète

### 📄 Documents Spécialisés

- **[14-api-reference-complete.md](./14-api-reference-complete.md)** - Référence API complète avec exemples de code
- **[15-implementation-examples.md](./15-implementation-examples.md)** - Exemples d'implémentation complets
- **[16-workflows-detailed.md](./16-workflows-detailed.md)** - Workflows détaillés avec diagrammes de flux
- **[17-insurance-services-detailed.md](./17-insurance-services-detailed.md)** - Assurances et services détaillés (inspiré SIXT)
- **[18-competitive-analysis.md](./18-competitive-analysis.md)** - Analyse comparative des sites de référence
- **[content-strategy.md](./content-strategy.md)** - Stratégie de contenu et navigation
- **[design-system.md](./design-system.md)** - Design system et composants UI
- **[roadmap-projet.md](./roadmap-projet.md)** - Roadmap complète du projet

## 🎯 Fonctionnalités Clés

### Processus de Réservation (4 Étapes)

1. **Recherche et Sélection** - Filtres et choix du véhicule
2. **Services Additionnels** - Options (assurance, GPS, etc.)
3. **Informations Client** - Coordonnées et permis de conduire
4. **Paiement et Confirmation** - Paiement sécurisé et validation

### Interface Admin (12 Sections)

1. **Dashboard** - Vue d'ensemble
2. **Véhicules** - Gestion de la flotte
3. **Réservations** - Gestion des locations
4. **Clients** - Base de données clients
5. **Services** - Services additionnels
6. **Maintenance** - Suivi des entretiens
7. **Galerie** - Photos des véhicules
8. **Avis** - Modération des commentaires
9. **Statistiques** - Analyses et rapports
10. **Facturation** - Factures et reçus
11. **Notifications** - Emails et templates
12. **Paramètres** - Configuration de l'agence

## 🛠️ Installation et Développement

### Prérequis

- Node.js 18+
- MongoDB (local ou Atlas)
- Redis (optionnel pour le cache)

### Installation

```bash
# Cloner le projet
git clone [url-du-repo]
cd cars

# Installer les dépendances
npm install

# Configuration des variables d'environnement
cp .env.example .env.local

# Éditer .env.local avec vos configurations
```

### Variables d'Environnement

```env
# Base de données Neon PostgreSQL
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Redis (optionnel)
REDIS_URL="redis://localhost:6379"

# Cloudinary
CLOUDINARY_CLOUD_NAME="votre-cloud-name"
CLOUDINARY_API_KEY="votre-api-key"
CLOUDINARY_API_SECRET="votre-api-secret"

# NextAuth
NEXTAUTH_SECRET="votre-secret"
NEXTAUTH_URL="http://localhost:3000"

# Paiement
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
PAYPAL_CLIENT_ID="votre-paypal-id"
PAYPAL_CLIENT_SECRET="votre-paypal-secret"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
GMAIL_USER="votre-email"
GMAIL_PASSWORD="votre-password"

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="votre-google-maps-key"
```

### Démarrage

```bash
# Développement
npm run dev

# Production
npm run build
npm start

# Base de données
npx prisma generate
npx prisma migrate dev
```

## 📊 Architecture de la Base de Données

### Tables Principales (12)

- **users** - Utilisateurs (clients, admins, employés)
- **vehicles** - Véhicules de la flotte
- **bookings** - Réservations clients
- **services** - Services additionnels
- **reviews** - Avis et commentaires
- **maintenances** - Entretiens et réparations
- **invoices** - Factures et reçus
- **payments** - Transactions de paiement
- **locations** - Agences et points de location
- **settings** - Paramètres de l'agence

### Relations PostgreSQL

- **User (1) ←→ (N) Booking** - Un utilisateur peut avoir plusieurs réservations
- **Vehicle (1) ←→ (N) Booking** - Un véhicule peut être réservé plusieurs fois
- **Booking (1) ←→ (1) Review** - Une réservation peut avoir un avis
- **Booking (1) ←→ (N) Service** - Une réservation peut inclure plusieurs services (via table de liaison)
- **Vehicle (1) ←→ (N) Maintenance** - Un véhicule peut avoir plusieurs entretiens
- **Location (1) ←→ (N) Vehicle** - Une agence peut avoir plusieurs véhicules

## 🎨 Design et UX

### Principe Fondamental

"Un client doit pouvoir réserver un véhicule en 4 étapes maximum"

### Design System

- **Couleurs** : Palette professionnelle et moderne
- **Typographie** : Lisible et élégante
- **Composants** : Interface cohérente et responsive
- **Responsive** : Mobile-first design

### Parcours Client

1. **Découverte** - Page d'accueil attractive avec recherche
2. **Recherche** - Filtres et sélection de véhicules
3. **Réservation** - Processus simplifié
4. **Confirmation** - Validation et rappels

## 🔒 Sécurité

### Authentification

- **NextAuth.js** - Gestion des sessions
- **JWT** - Tokens sécurisés
- **Rôles** - Client, Admin, Employé

### Validation

- **Zod** - Validation côté client et serveur
- **Prisma** - Validation des données
- **Rate Limiting** - Protection contre les abus

### Données

- **Mots de passe** - Hashage sécurisé
- **Paiements** - Conformité PCI DSS
- **Images** - Upload sécurisé via Cloudinary

## 📈 Performance

### Optimisations

- **Next.js** - Optimisations automatiques
- **Images** - Cloudinary avec transformations
- **Cache** - Redis pour les sessions
- **Base de données** - Index MongoDB optimisés

### Métriques

- Temps de chargement < 2s
- SEO - Optimisé pour les moteurs de recherche
- Mobile - Performance optimale sur mobile

## 🚀 Déploiement

### Plateformes Recommandées

- **Vercel** - Déploiement Next.js optimisé
- **MongoDB Atlas** - Base de données cloud
- **Cloudinary** - CDN pour les images

### Configuration Production

- Variables d'environnement - Configuration sécurisée
- SSL - Certificats HTTPS
- Monitoring - Surveillance des performances

## 📞 Support et Contact

### Documentation

- **User Stories** - Fonctionnalités détaillées
- **Spécifications** - Architecture technique
- **Design** - Interface et UX
- **Base de données** - Modèles et relations

### Développement

- **Structure** - Architecture du projet
- **Composants** - Réutilisables et modulaires
- **API** - Routes et endpoints
- **Tests** - Validation et qualité

---

**CarRental - La Location de Voitures Simplifiée** 🚗
