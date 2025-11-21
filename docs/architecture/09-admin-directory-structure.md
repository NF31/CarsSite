# Structure du Répertoire Admin - CarRental

## 📋 Vue d'Ensemble

Ce document détaille la structure complète du répertoire admin avec toutes les routes, composants et fichiers.

---

## 📁 Structure Complète

```
app/
├── (admin)/                          # Routes admin (protégées)
│   ├── admin/
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Dashboard principal
│   │   │
│   │   ├── vehicles/
│   │   │   ├── page.tsx              # Liste des véhicules
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx          # Détails véhicule
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx      # Édition véhicule
│   │   │   └── new/
│   │   │       └── page.tsx          # Nouveau véhicule
│   │   │
│   │   ├── bookings/
│   │   │   ├── page.tsx              # Liste des réservations
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Détails réservation
│   │   │   └── new/
│   │   │       └── page.tsx          # Nouvelle réservation
│   │   │
│   │   ├── clients/
│   │   │   ├── page.tsx              # Liste des clients
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Profil client
│   │   │
│   │   ├── services/
│   │   │   ├── page.tsx              # Liste des services
│   │   │   ├── [id]/
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx      # Édition service
│   │   │   └── new/
│   │   │       └── page.tsx          # Nouveau service
│   │   │
│   │   ├── maintenance/
│   │   │   ├── page.tsx              # Liste des maintenances
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Détails maintenance
│   │   │   └── new/
│   │   │       └── page.tsx          # Nouvelle maintenance
│   │   │
│   │   ├── statistics/
│   │   │   └── page.tsx              # Statistiques et rapports
│   │   │
│   │   ├── invoices/
│   │   │   ├── page.tsx              # Liste des factures
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Détails facture
│   │   │
│   │   ├── reviews/
│   │   │   ├── page.tsx              # Liste des avis
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Modération avis
│   │   │
│   │   └── settings/
│   │       ├── page.tsx              # Paramètres généraux
│   │       ├── locations/
│   │       │   └── page.tsx          # Gestion des agences
│   │       ├── emails/
│   │       │   └── page.tsx          # Templates emails
│   │       └── users/
│   │           └── page.tsx          # Gestion utilisateurs
│   │
│   └── api/                           # API Routes admin
│       ├── vehicles/
│       │   ├── route.ts              # GET, POST
│       │   └── [id]/
│       │       └── route.ts          # GET, PUT, DELETE
│       │
│       ├── bookings/
│       │   ├── route.ts              # GET, POST
│       │   └── [id]/
│       │       └── route.ts          # GET, PUT, DELETE
│       │
│       ├── clients/
│       │   ├── route.ts              # GET
│       │   └── [id]/
│       │       └── route.ts          # GET, PUT
│       │
│       ├── services/
│       │   ├── route.ts              # GET, POST
│       │   └── [id]/
│       │       └── route.ts          # GET, PUT, DELETE
│       │
│       ├── maintenance/
│       │   ├── route.ts              # GET, POST
│       │   └── [id]/
│       │       └── route.ts          # GET, PUT, DELETE
│       │
│       ├── statistics/
│       │   └── route.ts              # GET
│       │
│       ├── invoices/
│       │   ├── route.ts              # GET, POST
│       │   └── [id]/
│       │       └── route.ts          # GET
│       │       └── generate/
│       │           └── route.ts      # POST (génération PDF)
│       │
│       └── reviews/
│           ├── route.ts              # GET
│           └── [id]/
│               └── route.ts          # PUT (modération)
│
├── components/
│   ├── admin/
│   │   ├── AdminNavbar.tsx           # Navigation admin
│   │   ├── AdminSidebar.tsx          # Sidebar admin
│   │   ├── AdminHeader.tsx           # Header avec notifications
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardStats.tsx    # Cards métriques
│   │   │   ├── RevenueChart.tsx      # Graphique revenus
│   │   │   ├── BookingChart.tsx      # Graphique réservations
│   │   │   ├── OccupancyChart.tsx    # Graphique occupation
│   │   │   ├── RecentBookings.tsx    # Tableau réservations
│   │   │   └── Alerts.tsx            # Section alertes
│   │   │
│   │   ├── vehicles/
│   │   │   ├── VehicleList.tsx       # Liste véhicules
│   │   │   ├── VehicleCard.tsx      # Card véhicule
│   │   │   ├── VehicleForm.tsx      # Formulaire véhicule
│   │   │   ├── VehicleDetails.tsx    # Détails véhicule
│   │   │   └── AvailabilityCalendar.tsx # Calendrier disponibilité
│   │   │
│   │   ├── bookings/
│   │   │   ├── BookingList.tsx       # Liste réservations
│   │   │   ├── BookingCard.tsx       # Card réservation
│   │   │   ├── BookingForm.tsx       # Formulaire réservation
│   │   │   ├── BookingDetails.tsx     # Détails réservation
│   │   │   └── BookingStatusBadge.tsx # Badge statut
│   │   │
│   │   ├── clients/
│   │   │   ├── ClientList.tsx        # Liste clients
│   │   │   ├── ClientCard.tsx        # Card client
│   │   │   ├── ClientProfile.tsx     # Profil client
│   │   │   └── ClientStats.tsx       # Statistiques client
│   │   │
│   │   ├── services/
│   │   │   ├── ServiceList.tsx       # Liste services
│   │   │   ├── ServiceCard.tsx      # Card service
│   │   │   └── ServiceForm.tsx      # Formulaire service
│   │   │
│   │   ├── maintenance/
│   │   │   ├── MaintenanceList.tsx   # Liste maintenances
│   │   │   ├── MaintenanceCard.tsx   # Card maintenance
│   │   │   ├── MaintenanceForm.tsx   # Formulaire maintenance
│   │   │   └── MaintenanceHistory.tsx # Historique véhicule
│   │   │
│   │   ├── statistics/
│   │   │   ├── StatisticsOverview.tsx # Vue d'ensemble
│   │   │   ├── RevenueStats.tsx      # Statistiques revenus
│   │   │   ├── BookingStats.tsx      # Statistiques réservations
│   │   │   └── VehicleStats.tsx      # Statistiques véhicules
│   │   │
│   │   ├── invoices/
│   │   │   ├── InvoiceList.tsx       # Liste factures
│   │   │   ├── InvoiceCard.tsx       # Card facture
│   │   │   ├── InvoiceDetails.tsx    # Détails facture
│   │   │   └── InvoiceTemplate.tsx   # Template PDF
│   │   │
│   │   ├── reviews/
│   │   │   ├── ReviewList.tsx        # Liste avis
│   │   │   ├── ReviewCard.tsx        # Card avis
│   │   │   └── ReviewModeration.tsx  # Modération avis
│   │   │
│   │   └── settings/
│   │       ├── SettingsForm.tsx      # Formulaire paramètres
│   │       ├── LocationForm.tsx       # Formulaire agence
│   │       ├── EmailTemplates.tsx    # Templates emails
│   │       └── UserManagement.tsx    # Gestion utilisateurs
│   │
│   └── ui/                            # Composants UI réutilisables
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       ├── Table.tsx
│       ├── Badge.tsx
│       ├── Select.tsx
│       ├── DatePicker.tsx
│       └── ...
│
├── lib/
│   ├── admin/
│   │   ├── vehicle-utils.ts          # Utilitaires véhicules
│   │   ├── booking-utils.ts          # Utilitaires réservations
│   │   ├── statistics-utils.ts       # Utilitaires statistiques
│   │   └── invoice-utils.ts          # Utilitaires factures
│   │
│   └── ...
│
└── types/
    └── admin.ts                       # Types spécifiques admin
```

---

## 🗂️ Détails par Section

### Dashboard

**Fichiers :**
- `app/(admin)/admin/dashboard/page.tsx` - Page principale
- `components/admin/dashboard/*.tsx` - Composants dashboard

**Fonctionnalités :**
- Métriques principales
- Graphiques
- Réservations récentes
- Alertes

### Véhicules

**Fichiers :**
- `app/(admin)/admin/vehicles/page.tsx` - Liste
- `app/(admin)/admin/vehicles/new/page.tsx` - Création
- `app/(admin)/admin/vehicles/[id]/page.tsx` - Détails
- `app/(admin)/admin/vehicles/[id]/edit/page.tsx` - Édition

**API :**
- `app/(admin)/api/vehicles/route.ts` - GET, POST
- `app/(admin)/api/vehicles/[id]/route.ts` - GET, PUT, DELETE

### Réservations

**Fichiers :**
- `app/(admin)/admin/bookings/page.tsx` - Liste
- `app/(admin)/admin/bookings/new/page.tsx` - Création manuelle
- `app/(admin)/admin/bookings/[id]/page.tsx` - Détails

**API :**
- `app/(admin)/api/bookings/route.ts` - GET, POST
- `app/(admin)/api/bookings/[id]/route.ts` - GET, PUT, DELETE

### Clients

**Fichiers :**
- `app/(admin)/admin/clients/page.tsx` - Liste
- `app/(admin)/admin/clients/[id]/page.tsx` - Profil

**API :**
- `app/(admin)/api/clients/route.ts` - GET
- `app/(admin)/api/clients/[id]/route.ts` - GET, PUT

### Services

**Fichiers :**
- `app/(admin)/admin/services/page.tsx` - Liste
- `app/(admin)/admin/services/new/page.tsx` - Création
- `app/(admin)/admin/services/[id]/edit/page.tsx` - Édition

**API :**
- `app/(admin)/api/services/route.ts` - GET, POST
- `app/(admin)/api/services/[id]/route.ts` - GET, PUT, DELETE

### Maintenance

**Fichiers :**
- `app/(admin)/admin/maintenance/page.tsx` - Liste
- `app/(admin)/admin/maintenance/new/page.tsx` - Création
- `app/(admin)/admin/maintenance/[id]/page.tsx` - Détails

**API :**
- `app/(admin)/api/maintenance/route.ts` - GET, POST
- `app/(admin)/api/maintenance/[id]/route.ts` - GET, PUT, DELETE

### Statistiques

**Fichiers :**
- `app/(admin)/admin/statistics/page.tsx` - Page principale

**API :**
- `app/(admin)/api/statistics/route.ts` - GET

### Facturation

**Fichiers :**
- `app/(admin)/admin/invoices/page.tsx` - Liste
- `app/(admin)/admin/invoices/[id]/page.tsx` - Détails

**API :**
- `app/(admin)/api/invoices/route.ts` - GET, POST
- `app/(admin)/api/invoices/[id]/route.ts` - GET
- `app/(admin)/api/invoices/[id]/generate/route.ts` - POST (PDF)

### Avis

**Fichiers :**
- `app/(admin)/admin/reviews/page.tsx` - Liste
- `app/(admin)/admin/reviews/[id]/page.tsx` - Modération

**API :**
- `app/(admin)/api/reviews/route.ts` - GET
- `app/(admin)/api/reviews/[id]/route.ts` - PUT (modération)

### Paramètres

**Fichiers :**
- `app/(admin)/admin/settings/page.tsx` - Généraux
- `app/(admin)/admin/settings/locations/page.tsx` - Agences
- `app/(admin)/admin/settings/emails/page.tsx` - Templates
- `app/(admin)/admin/settings/users/page.tsx` - Utilisateurs

---

## 🔐 Protection des Routes

### Proxy

```typescript
// proxy.ts
export default auth((req) => {
  // Vérifier authentification
  // Vérifier rôle admin
  // Rediriger si non autorisé
});
```

### Layout Admin

```typescript
// app/(admin)/admin/layout.tsx
export default function AdminLayout({ children }) {
  // Vérifier authentification
  // Afficher navigation admin
  // Wrapper avec permissions
}
```

---

## 📝 Conventions de Nommage

### Fichiers
- **Pages** : `page.tsx`
- **Layouts** : `layout.tsx`
- **Composants** : PascalCase (ex: `VehicleList.tsx`)
- **Utilitaires** : kebab-case (ex: `vehicle-utils.ts`)
- **Types** : kebab-case (ex: `admin.ts`)

### Routes
- **Listes** : `/admin/vehicles`
- **Détails** : `/admin/vehicles/[id]`
- **Création** : `/admin/vehicles/new`
- **Édition** : `/admin/vehicles/[id]/edit`

---

## ✅ Checklist Structure

- [ ] Toutes les routes créées
- [ ] Composants organisés par section
- [ ] API Routes implémentées
- [ ] Protection des routes
- [ ] Layouts configurés
- [ ] Types définis
- [ ] Utilitaires créés
- [ ] Documentation à jour


