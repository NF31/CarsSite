# Spécifications Techniques - CarRental

## Vue d'Ensemble

Ce document détaille les spécifications techniques du projet CarRental, incluant l'architecture, les technologies, les API, et les contraintes techniques.

---

## Architecture Technique

### Stack Technologique

#### Frontend
- **Framework** : Next.js 16 (App Router)
- **Langage** : TypeScript 5+
- **UI Framework** : React 19
- **Styling** : Tailwind CSS 4
- **Formulaires** : React Hook Form
- **Validation** : Zod
- **Animations** : Framer Motion
- **Icons** : Heroicons
- **Maps** : Google Maps API / Mapbox

#### Backend
- **Framework** : Next.js API Routes (Serverless)
- **Base de données** : Neon PostgreSQL (serverless)
- **ORM** : Prisma
- **Authentification** : NextAuth.js
- **Cache** : Redis (optionnel)
- **File Storage** : Cloudinary

#### Services Externes
- **Paiements** : Stripe / PayPal
- **Emails** : Nodemailer / SendGrid
- **Images** : Cloudinary
- **Maps** : Google Maps API
- **Analytics** : Google Analytics / Vercel Analytics

### Architecture Générale

```
┌─────────────────────────────────────────┐
│           Client Browser                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Next.js Application (Vercel)       │
│  ┌──────────────────────────────────┐  │
│  │      Frontend (React/TS)         │  │
│  │  - Pages (App Router)            │  │
│  │  - Components                    │  │
│  │  - Hooks & Utils                 │  │
│  └──────────────┬───────────────────┘  │
│                 │                       │
│  ┌──────────────▼───────────────────┐  │
│  │      API Routes                  │  │
│  │  - /api/auth                    │  │
│  │  - /api/bookings                │  │
│  │  - /api/vehicles                │  │
│  │  - /api/payments                │  │
│  └──────────────┬───────────────────┘  │
└─────────────────┼──────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐   ┌────▼────┐   ┌───▼────┐
│ Neon  │   │ Cloudinary│   │ Stripe │
│PostgreSQL│ │   (CDN)   │   │  API   │
└───────┘   └──────────┘   └────────┘
```

---

## Structure du Projet

```
cars/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Routes publiques
│   │   ├── page.tsx             # Page d'accueil
│   │   ├── vehicles/            # Liste et détails véhicules
│   │   ├── booking/             # Processus de réservation
│   │   ├── about/               # À propos
│   │   └── contact/             # Contact
│   │
│   ├── (auth)/                  # Routes d'authentification
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   │
│   ├── (client)/                # Routes client (protégées)
│   │   ├── dashboard/
│   │   ├── bookings/
│   │   ├── profile/
│   │   └── reviews/
│   │
│   ├── (admin)/                 # Routes admin (protégées)
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── vehicles/
│   │   │   ├── bookings/
│   │   │   ├── clients/
│   │   │   ├── maintenance/
│   │   │   ├── services/
│   │   │   ├── statistics/
│   │   │   ├── invoices/
│   │   │   └── settings/
│   │   └── api/                 # API Routes
│   │       ├── auth/
│   │       ├── vehicles/
│   │       ├── bookings/
│   │       ├── payments/
│   │       ├── upload/
│   │       └── ...
│   │
│   ├── layout.tsx               # Layout racine
│   ├── globals.css             # Styles globaux
│   └── favicon.ico
│
├── components/                  # Composants réutilisables
│   ├── ui/                     # Composants UI de base
│   ├── forms/                  # Formulaires
│   ├── vehicles/               # Composants véhicules
│   ├── booking/                # Composants réservation
│   ├── admin/                  # Composants admin
│   └── layout/                 # Composants layout
│
├── lib/                        # Utilitaires et helpers
│   ├── prisma.ts              # Client Prisma
│   ├── auth.ts                # Configuration NextAuth
│   ├── utils.ts               # Fonctions utilitaires
│   ├── validations.ts         # Schémas Zod
│   ├── email.ts               # Templates email
│   └── constants.ts           # Constantes
│
├── types/                      # Types TypeScript
│   ├── index.ts
│   ├── booking.ts
│   ├── vehicle.ts
│   └── user.ts
│
├── hooks/                      # React Hooks personnalisés
│   ├── useBooking.ts
│   ├── useVehicle.ts
│   └── useAuth.ts
│
├── prisma/                     # Schéma Prisma
│   └── schema.prisma
│
├── public/                     # Fichiers statiques
│   ├── images/
│   └── icons/
│
├── .env.example                # Exemple de variables d'environnement
├── .env.local                  # Variables d'environnement (local)
├── next.config.ts              # Configuration Next.js
├── tsconfig.json               # Configuration TypeScript
├── tailwind.config.ts          # Configuration Tailwind
├── package.json
└── README.md
```

---

## Base de Données

### Neon PostgreSQL avec Prisma

#### Tables Principales

1. **users**
   - Informations utilisateurs (clients, admins, employés)
   - Authentification et rôles

2. **vehicles**
   - Informations des véhicules
   - Disponibilité et statut

3. **bookings**
   - Réservations clients
   - Dates, prix, statut

4. **services**
   - Services additionnels
   - Prix et disponibilité

5. **reviews**
   - Avis clients
   - Notes et commentaires

6. **maintenances**
   - Entretiens et réparations
   - Historique par véhicule

7. **invoices**
   - Factures
   - Paiements et remboursements

8. **payments**
   - Transactions de paiement
   - Intégration Stripe/PayPal

9. **locations**
   - Agences et points de location
   - Coordonnées et horaires

10. **settings**
    - Paramètres de l'agence
    - Configuration système

### Index PostgreSQL

```sql
-- Optimisations d'index
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX idx_bookings_status ON bookings(status);

CREATE INDEX idx_vehicles_status_category ON vehicles(status, category);
CREATE INDEX idx_vehicles_location ON vehicles(location_id);

CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);

CREATE INDEX idx_reviews_vehicle ON reviews(vehicle_id);
CREATE INDEX idx_reviews_status ON reviews(status);

CREATE INDEX idx_maintenances_vehicle ON maintenances(vehicle_id);
CREATE INDEX idx_maintenances_dates ON maintenances(start_date, end_date);
```

---

## API Routes

### Authentification

#### `POST /api/auth/register`
Création de compte utilisateur

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+33612345678"
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... },
  "message": "Account created successfully"
}
```

#### `POST /api/auth/login`
Connexion utilisateur

#### `POST /api/auth/logout`
Déconnexion

### Véhicules

#### `GET /api/vehicles`
Liste des véhicules avec filtres

**Query Parameters:**
- `startDate` - Date de début
- `endDate` - Date de fin
- `category` - Catégorie
- `minPrice` - Prix minimum
- `maxPrice` - Prix maximum
- `seats` - Nombre de places
- `transmission` - Transmission
- `location` - Localisation

**Response:**
```json
{
  "vehicles": [...],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

#### `GET /api/vehicles/[id]`
Détails d'un véhicule

#### `POST /api/vehicles` (Admin)
Création d'un véhicule

#### `PUT /api/vehicles/[id]` (Admin)
Modification d'un véhicule

#### `DELETE /api/vehicles/[id]` (Admin)
Suppression d'un véhicule

### Réservations

#### `GET /api/bookings`
Liste des réservations (client ou admin)

#### `GET /api/bookings/[id]`
Détails d'une réservation

#### `POST /api/bookings`
Création d'une réservation

**Request:**
```json
{
  "vehicleId": "vehicle123",
  "startDate": "2024-01-15",
  "endDate": "2024-01-20",
  "pickupLocation": "location1",
  "returnLocation": "location1",
  "services": ["insurance", "gps"],
  "totalPrice": 450.00
}
```

#### `PUT /api/bookings/[id]`
Modification d'une réservation

#### `DELETE /api/bookings/[id]`
Annulation d'une réservation

### Paiements

#### `POST /api/payments/create-intent`
Création d'un intent de paiement Stripe

#### `POST /api/payments/confirm`
Confirmation d'un paiement

#### `GET /api/payments/[id]`
Détails d'un paiement

### Upload

#### `POST /api/upload`
Upload d'images vers Cloudinary

**Request:** FormData avec fichier image

**Response:**
```json
{
  "url": "https://res.cloudinary.com/...",
  "publicId": "vehicles/abc123",
  "width": 1920,
  "height": 1080
}
```

---

## Sécurité

### Authentification

- **NextAuth.js** pour la gestion des sessions
- **JWT** pour les tokens
- **Hashage** des mots de passe avec bcrypt
- **Rate Limiting** sur les routes sensibles
- **CSRF Protection** intégrée Next.js

### Validation

- **Zod** pour la validation côté client et serveur
- **Prisma** pour la validation des données
- **Sanitization** des inputs utilisateur

### Paiements

- **Stripe** en mode PCI DSS compliant
- Pas de stockage des données bancaires
- Webhooks pour les confirmations

### Données

- **HTTPS** obligatoire en production
- **Variables d'environnement** pour les secrets
- **Validation** de toutes les entrées
- **Sanitization** des sorties

---

## Emails

### Templates Email

#### Confirmation de Réservation
- Sujet : "Confirmation de votre réservation"
- Contenu : Détails de la réservation, dates, véhicule

#### Rappel de Réservation
- Sujet : "Rappel : Votre réservation arrive bientôt"
- Envoyé 24h avant le début

#### Confirmation de Paiement
- Sujet : "Confirmation de paiement"
- Contenu : Montant, méthode de paiement, facture

#### Annulation
- Sujet : "Annulation de votre réservation"
- Contenu : Détails de l'annulation, remboursement si applicable

---

## Design System

### Couleurs

```css
Primary: #3B82F6 (Blue)
Secondary: #10B981 (Green)
Danger: #EF4444 (Red)
Warning: #F59E0B (Orange)
Success: #10B981 (Green)
Dark: #1F2937 (Gray)
Light: #F9FAFB (Gray)
```

### Typographie

- **Font Family** : Geist Sans (principal), Geist Mono (code)
- **Sizes** : xs, sm, base, lg, xl, 2xl, 3xl, 4xl
- **Weights** : 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Composants UI

- **Button** : Variantes (primary, secondary, outline, ghost)
- **Input** : Text, email, password, date, select
- **Card** : Container pour contenu
- **Modal** : Dialog pour actions
- **Toast** : Notifications
- **Badge** : Étiquettes de statut

---

## Responsive Design

### Breakpoints

```css
sm: 640px   /* Mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large Desktop */
2xl: 1536px /* Extra Large */
```

### Approche Mobile-First

- Design mobile en priorité
- Progressive enhancement
- Touch-friendly (minimum 44x44px)
- Performance optimisée pour mobile

---

## Performance

### Optimisations

- **Next.js Image** : Optimisation automatique
- **Code Splitting** : Chargement à la demande
- **Lazy Loading** : Images et composants
- **Caching** : Redis pour les sessions
- **CDN** : Cloudinary pour les images
- **Compression** : Gzip/Brotli

### Métriques Cibles

- **First Contentful Paint** : < 1.5s
- **Largest Contentful Paint** : < 2.5s
- **Time to Interactive** : < 3.5s
- **Cumulative Layout Shift** : < 0.1

---

## Tests

### Types de Tests

- **Unit Tests** : Jest + React Testing Library
- **Integration Tests** : Tests d'API
- **E2E Tests** : Playwright
- **Type Safety** : TypeScript strict mode

### Coverage Cible

- **Minimum 80%** de couverture de code
- **100%** pour les fonctions critiques

---

## Déploiement

### Environnements

- **Development** : Local avec hot reload
- **Staging** : Vercel Preview
- **Production** : Vercel Production

### CI/CD

- **GitHub Actions** : Tests automatiques
- **Vercel** : Déploiement automatique
- **Prisma Migrate** : Migrations automatiques

---

## Monitoring

### Outils

- **Vercel Analytics** : Performance et usage
- **Sentry** : Error tracking
- **LogRocket** : Session replay (optionnel)

---

## Versioning

### Versioning API

- **Semantic Versioning** : Major.Minor.Patch
- **API Versioning** : `/api/v1/...`

---

## Documentation

### Code Documentation

- **JSDoc** pour les fonctions
- **TypeScript** pour le typage
- **README** pour chaque module majeur

---

## Checklist Technique

- [ ] Configuration Next.js 16 avec App Router
- [ ] Prisma avec MongoDB
- [ ] NextAuth.js configuré
- [ ] API Routes implémentées
- [ ] Validation Zod
- [ ] Upload Cloudinary
- [ ] Intégration Stripe
- [ ] Templates email
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Documentation API
- [ ] Variables d'environnement
- [ ] CI/CD configuré
- [ ] Monitoring configuré


