# Vue d'Ensemble de l'Architecture Globale - CarRental

## 📋 Vue d'Ensemble

Ce document présente une vue d'ensemble complète de l'architecture du projet CarRental, incluant les composants, les flux de données, et les interactions.

---

## 🏗️ Architecture Générale

### Diagramme de Haut Niveau

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Public     │  │   Client     │  │    Admin     │      │
│  │   Pages      │  │   Dashboard  │  │  Interface   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────┐
│              NEXT.JS APPLICATION (Vercel)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  FRONTEND LAYER                       │  │
│  │  • React 19 + TypeScript                              │  │
│  │  • Tailwind CSS                                       │  │
│  │  • Framer Motion                                      │  │
│  │  • React Hook Form + Zod                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  API LAYER                           │  │
│  │  • Next.js API Routes                                │  │
│  │  • Server Actions                                      │  │
│  │  • Middleware (Auth, Validation)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  BUSINESS LOGIC                      │  │
│  │  • Prisma ORM                                        │  │
│  │  • NextAuth.js                                      │  │
│  │  • Validation Logic                                 │  │
│  │  • Payment Processing                               │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼──────┐   ┌─────────▼─────────┐  ┌──────▼──────┐
│ NEON POSTGRESQL │ │     CLOUDINARY    │  │   STRIPE    │
│ (Database)      │   │      (Images)     │  │  (Payments)  │
└──────────────┘   └───────────────────┘  └─────────────┘
```

---

## 🔄 Flux de Données

### Flux : Réservation Client

```
1. Client → Recherche véhicules
   ↓
2. Frontend → API /api/vehicles (filtres)
   ↓
3. API → Prisma → PostgreSQL (requête véhicules)
   ↓
4. PostgreSQL → Prisma → API (résultats)
   ↓
5. API → Frontend (véhicules disponibles)
   ↓
6. Client → Sélection véhicule
   ↓
7. Frontend → API /api/bookings (création)
   ↓
8. API → Validation (Zod)
   ↓
9. API → Prisma → PostgreSQL (création booking)
   ↓
10. API → Stripe (création intent paiement)
    ↓
11. Stripe → Frontend (formulaire paiement)
    ↓
12. Client → Paiement
    ↓
13. Stripe Webhook → API /api/webhooks/stripe
    ↓
14. API → Prisma → PostgreSQL (mise à jour booking)
    ↓
15. API → Email (confirmation)
    ↓
16. Client → Confirmation
```

### Flux : Dashboard Admin

```
1. Admin → Connexion
   ↓
2. Frontend → NextAuth (authentification)
   ↓
3. NextAuth → PostgreSQL (vérification user)
   ↓
4. Frontend → API /api/admin/dashboard
   ↓
5. API → Prisma → PostgreSQL (agrégations)
   ↓
6. PostgreSQL → Prisma → API (statistiques)
   ↓
7. API → Frontend (données dashboard)
   ↓
8. Frontend → Affichage (graphiques, métriques)
```

---

## 📦 Composants Principaux

### Frontend

#### Pages Publiques
- **Page d'accueil** : Recherche, catégories, véhicules populaires
- **Liste véhicules** : Filtres, résultats, tri
- **Détails véhicule** : Galerie, caractéristiques, réservation
- **Réservation** : Processus en 4 étapes
- **À propos** : Informations agence
- **Contact** : Formulaire contact

#### Pages Client
- **Dashboard** : Réservations, historique
- **Profil** : Informations personnelles
- **Réservations** : Liste et détails
- **Avis** : Laisser un avis

#### Pages Admin
- **Dashboard** : Vue d'ensemble, métriques
- **Véhicules** : Gestion flotte
- **Réservations** : Gestion réservations
- **Clients** : Base de données clients
- **Services** : Services additionnels
- **Maintenance** : Suivi entretiens
- **Statistiques** : Analyses et rapports
- **Facturation** : Factures et paiements
- **Avis** : Modération
- **Paramètres** : Configuration

### Backend

#### API Routes

**Authentification**
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion

**Véhicules**
- `GET /api/vehicles` - Liste avec filtres
- `GET /api/vehicles/[id]` - Détails
- `POST /api/vehicles` - Création (admin)
- `PUT /api/vehicles/[id]` - Modification (admin)
- `DELETE /api/vehicles/[id]` - Suppression (admin)

**Réservations**
- `GET /api/bookings` - Liste
- `GET /api/bookings/[id]` - Détails
- `POST /api/bookings` - Création
- `PUT /api/bookings/[id]` - Modification
- `DELETE /api/bookings/[id]` - Annulation

**Paiements**
- `POST /api/payments/create-intent` - Création intent Stripe
- `POST /api/payments/confirm` - Confirmation
- `POST /api/webhooks/stripe` - Webhooks Stripe

**Upload**
- `POST /api/upload` - Upload images Cloudinary

### Services Externes

#### Neon PostgreSQL
- **Usage** : Base de données principale
- **Tables** : Users, Vehicles, Bookings, etc.
- **Index** : Optimisés pour les requêtes fréquentes

#### Cloudinary
- **Usage** : Stockage et transformation d'images
- **Fonctionnalités** : Upload, resize, optimisation
- **CDN** : Distribution globale

#### Stripe
- **Usage** : Paiements en ligne
- **Fonctionnalités** : Cartes, PayPal, webhooks
- **Sécurité** : PCI DSS compliant

#### NextAuth.js
- **Usage** : Authentification
- **Providers** : Credentials, OAuth (optionnel)
- **Sessions** : JWT

---

## 🔐 Sécurité

### Couches de Sécurité

```
┌─────────────────────────────────────┐
│  HTTPS (TLS 1.3)                    │
├─────────────────────────────────────┤
│  Rate Limiting                      │
├─────────────────────────────────────┤
│  CORS Configuration                 │
├─────────────────────────────────────┤
│  Authentication (NextAuth)         │
├─────────────────────────────────────┤
│  Authorization (Roles)              │
├─────────────────────────────────────┤
│  Input Validation (Zod)             │
├─────────────────────────────────────┤
│  SQL Injection Protection (Prisma) │
├─────────────────────────────────────┤
│  XSS Protection (React)             │
└─────────────────────────────────────┘
```

### Authentification

- **NextAuth.js** : Gestion des sessions
- **JWT** : Tokens sécurisés
- **Hashage** : bcrypt pour les mots de passe
- **Rôles** : CLIENT, ADMIN, EMPLOYEE

### Validation

- **Zod** : Validation côté client et serveur
- **Prisma** : Validation des types
- **Sanitization** : Nettoyage des inputs

---

## ⚡ Performance

### Optimisations

#### Frontend
- **Next.js Image** : Optimisation automatique
- **Code Splitting** : Chargement à la demande
- **Lazy Loading** : Images et composants
- **Static Generation** : Pages statiques

#### Backend
- **Caching** : Redis (sessions, données fréquentes)
- **Index PostgreSQL** : Requêtes optimisées
- **CDN** : Cloudinary pour images
- **Compression** : Gzip/Brotli

### Métriques Cibles

- **First Contentful Paint** : < 1.5s
- **Largest Contentful Paint** : < 2.5s
- **Time to Interactive** : < 3.5s
- **Cumulative Layout Shift** : < 0.1

---

## 🗄️ Base de Données

### Architecture PostgreSQL

```
Tables:
├── users (Users, authentification)
├── vehicles (Flotte de véhicules)
├── bookings (Réservations)
├── services (Services additionnels)
├── reviews (Avis clients)
├── maintenances (Entretiens)
├── invoices (Factures)
├── payments (Paiements)
├── locations (Agences)
└── settings (Paramètres)
```

### Relations Principales

- **User 1:N Booking** : Un utilisateur peut avoir plusieurs réservations
- **Vehicle 1:N Booking** : Un véhicule peut être réservé plusieurs fois
- **Booking 1:1 Review** : Une réservation peut avoir un avis
- **Vehicle 1:N Maintenance** : Un véhicule peut avoir plusieurs maintenances

---

## 🚀 Déploiement

### Architecture de Déploiement

```
┌─────────────────────────────────────┐
│         VERCEL (Hosting)            │
│  ┌───────────────────────────────┐ │
│  │   Next.js Application          │ │
│  │   • Automatic Deployments      │ │
│  │   • Edge Network               │ │
│  │   • Analytics                  │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
           │
           ├── Neon PostgreSQL
           ├── Cloudinary
           ├── Stripe
           └── Email Service
```

### Environnements

- **Development** : Local avec hot reload
- **Staging** : Vercel Preview (branches)
- **Production** : Vercel Production

---

## 📊 Monitoring

### Outils

- **Vercel Analytics** : Performance et usage
- **Sentry** : Error tracking (optionnel)
- **LogRocket** : Session replay (optionnel)

### Métriques

- **Performance** : Temps de chargement, TTI
- **Erreurs** : Taux d'erreur, types d'erreurs
- **Usage** : Pages vues, utilisateurs actifs
- **Business** : Réservations, revenus

---

## ✅ Résumé Architecture

### Points Clés

1. **Stack Moderne** : Next.js 16, React 19, TypeScript
2. **Scalable** : Neon PostgreSQL, Cloudinary, Stripe
3. **Sécurisé** : NextAuth, validation, HTTPS
4. **Performant** : Optimisations Next.js, CDN, cache
5. **Maintenable** : TypeScript, Prisma, structure claire

### Technologies

- **Frontend** : Next.js, React, Tailwind CSS
- **Backend** : Next.js API Routes, Prisma
- **Database** : Neon PostgreSQL
- **Storage** : Cloudinary
- **Payments** : Stripe
- **Auth** : NextAuth.js
- **Hosting** : Vercel

---

## ✅ Conclusion

L'architecture de CarRental est **moderne, scalable et sécurisée**. Elle utilise les meilleures pratiques et technologies actuelles pour créer une plateforme de location de voitures performante et maintenable.

**Statut** : ✅ **Architecture prête pour le développement**


