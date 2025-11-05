# Schéma Prisma - CarRental

## 📋 Vue d'Ensemble

Ce document présente le schéma Prisma complet pour Neon PostgreSQL avec toutes les tables, relations et contraintes.

---

## 📦 Schéma Complet

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  CLIENT
  ADMIN
  EMPLOYEE
}

enum VehicleCategory {
  ECONOMY
  COMPACT
  MID_SIZE
  FULL_SIZE
  SUV
  LUXURY
  VAN
}

enum VehicleStatus {
  AVAILABLE
  RESERVED
  MAINTENANCE
  UNAVAILABLE
}

enum TransmissionType {
  MANUAL
  AUTOMATIC
}

enum FuelType {
  PETROL
  DIESEL
  ELECTRIC
  HYBRID
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum ServicePricingType {
  PER_DAY
  FIXED
  PERCENTAGE
}

enum MaintenanceType {
  SERVICE
  REPAIR
  INSPECTION
}

enum MaintenanceStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}

enum PaymentMethod {
  STRIPE
  PAYPAL
  CASH
  BANK_TRANSFER
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
}

enum SettingCategory {
  GENERAL
  PAYMENT
  EMAIL
  BOOKING
  OTHER
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  phone         String?
  role          UserRole  @default(CLIENT)
  password      String
  emailVerified DateTime?
  image         String?
  driverLicense String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  bookings      Booking[]
  reviews       Review[]
  invoices      Invoice[]
  payments      Payment[]

  @@index([email])
  @@map("users")
}

model Location {
  id           String   @id @default(cuid())
  name         String
  address      String
  city         String
  postalCode   String
  country      String
  phone        String?
  email        String?
  latitude     Float?
  longitude    Float?
  openingHours Json     // Structure: { day: { open: string, close: string, closed?: boolean } }
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  vehicles     Vehicle[]
  pickupBookings  Booking[] @relation("PickupLocation")
  returnBookings   Booking[] @relation("ReturnLocation")

  @@map("locations")
}

model Vehicle {
  id            String          @id @default(cuid())
  brand         String
  model         String
  year          Int
  licensePlate  String          @unique
  mileage       Int
  category      VehicleCategory
  seats         Int
  transmission  TransmissionType
  fuelType      FuelType
  color         String
  pricePerDay   Float
  pricePerWeek  Float?
  pricePerMonth Float?
  deposit       Float
  status        VehicleStatus   @default(AVAILABLE)
  locationId    String
  features      String[]        @default([])
  images        String[]
  description   String?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  location      Location         @relation(fields: [locationId], references: [id], onDelete: Restrict)
  bookings      Booking[]
  reviews       Review[]
  maintenances  Maintenance[]

  @@index([status, category])
  @@index([locationId])
  @@index([licensePlate])
  @@map("vehicles")
}

model Service {
  id                    String             @id @default(cuid())
  name                  String
  description           String?
  price                 Float
  pricingType           ServicePricingType
  availableForCategories VehicleCategory[]  @default([])
  icon                  String?
  active                Boolean            @default(true)
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt

  @@index([active])
  @@map("services")
}

model Booking {
  id                String        @id @default(cuid())
  reference         String        @unique
  userId            String
  vehicleId         String
  startDate         DateTime
  endDate           DateTime
  pickupLocationId  String
  returnLocationId  String
  totalPrice        Float
  depositPaid       Float         @default(0)
  remainingAmount   Float
  status            BookingStatus @default(PENDING)
  serviceIds        String[]      @default([]) // Array of Service IDs
  notes             String?
  cancellationReason String?
  cancelledAt      DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  user              User          @relation(fields: [userId], references: [id], onDelete: Restrict)
  vehicle           Vehicle       @relation(fields: [vehicleId], references: [id], onDelete: Restrict)
  pickupLocation    Location      @relation("PickupLocation", fields: [pickupLocationId], references: [id], onDelete: Restrict)
  returnLocation    Location      @relation("ReturnLocation", fields: [returnLocationId], references: [id], onDelete: Restrict)
  
  review            Review?
  invoices          Invoice[]
  payments          Payment[]

  @@index([userId])
  @@index([vehicleId])
  @@index([startDate, endDate])
  @@index([status])
  @@index([reference])
  @@map("bookings")
}

model Review {
  id        String       @id @default(cuid())
  bookingId String       @unique
  userId    String
  vehicleId String
  rating    Int          // 1-5
  comment   String?
  status    ReviewStatus @default(PENDING)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  booking  Booking      @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  user     User         @relation(fields: [userId], references: [id], onDelete: Restrict)
  vehicle  Vehicle      @relation(fields: [vehicleId], references: [id], onDelete: Restrict)

  @@index([vehicleId])
  @@index([status])
  @@index([bookingId])
  @@map("reviews")
}

model Maintenance {
  id          String            @id @default(cuid())
  vehicleId   String
  type        MaintenanceType
  status      MaintenanceStatus @default(SCHEDULED)
  startDate   DateTime
  endDate     DateTime
  description String?
  cost        Float
  notes       String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  vehicle     Vehicle           @relation(fields: [vehicleId], references: [id], onDelete: Cascade)

  @@index([vehicleId])
  @@index([status])
  @@index([startDate, endDate])
  @@map("maintenances")
}

model Invoice {
  id            String        @id @default(cuid())
  invoiceNumber String        @unique
  bookingId     String
  userId        String
  subtotal      Float
  tax           Float         @default(0)
  total         Float
  status        InvoiceStatus @default(DRAFT)
  issuedAt      DateTime      @default(now())
  dueDate       DateTime
  paidAt        DateTime?
  pdfUrl        String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  booking       Booking       @relation(fields: [bookingId], references: [id], onDelete: Restrict)
  user          User          @relation(fields: [userId], references: [id], onDelete: Restrict)
  payments      Payment[]

  @@index([bookingId])
  @@index([userId])
  @@index([status])
  @@index([invoiceNumber])
  @@map("invoices")
}

model Payment {
  id            String         @id @default(cuid())
  bookingId     String
  invoiceId     String?
  userId        String
  amount        Float
  method        PaymentMethod
  status        PaymentStatus  @default(PENDING)
  transactionId String?
  metadata      Json?          // Flexible JSON for payment gateway data
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  booking       Booking        @relation(fields: [bookingId], references: [id], onDelete: Restrict)
  invoice       Invoice?       @relation(fields: [invoiceId], references: [id], onDelete: SetNull)
  user          User           @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([bookingId])
  @@index([userId])
  @@index([status])
  @@index([transactionId])
  @@map("payments")
}

model Setting {
  id          String          @id @default(cuid())
  key         String          @unique
  value       Json            // Flexible: string, number, boolean, object
  description String?
  category    SettingCategory @default(GENERAL)
  updatedAt   DateTime        @updatedAt

  @@index([category])
  @@index([key])
  @@map("settings")
}
```

---

## 🔗 Relations

### User
- **1:N** avec Booking (un utilisateur peut avoir plusieurs réservations)
- **1:N** avec Review (un utilisateur peut laisser plusieurs avis)
- **1:N** avec Invoice (un utilisateur peut avoir plusieurs factures)
- **1:N** avec Payment (un utilisateur peut faire plusieurs paiements)

### Vehicle
- **N:1** avec Location (plusieurs véhicules dans une agence)
- **1:N** avec Booking (un véhicule peut être réservé plusieurs fois)
- **1:N** avec Review (un véhicule peut avoir plusieurs avis)
- **1:N** avec Maintenance (un véhicule peut avoir plusieurs maintenances)

### Booking
- **N:1** avec User (plusieurs réservations par utilisateur)
- **N:1** avec Vehicle (plusieurs réservations pour un véhicule)
- **N:1** avec Location (pickup) (plusieurs prises en charge à une agence)
- **N:1** avec Location (return) (plusieurs restitutions à une agence)
- **1:1** avec Review (une réservation peut avoir un avis)
- **1:N** avec Invoice (une réservation peut avoir plusieurs factures)
- **1:N** avec Payment (une réservation peut avoir plusieurs paiements)

### Invoice
- **N:1** avec Booking (plusieurs factures pour une réservation)
- **N:1** avec User (plusieurs factures par utilisateur)
- **1:N** avec Payment (une facture peut avoir plusieurs paiements)

### Review
- **1:1** avec Booking (un avis par réservation)
- **N:1** avec User (plusieurs avis par utilisateur)
- **N:1** avec Vehicle (plusieurs avis pour un véhicule)

### Maintenance
- **N:1** avec Vehicle (plusieurs maintenances pour un véhicule)

---

## 📊 Index PostgreSQL

### Index Créés (via Prisma @@index)

```sql
-- Users
CREATE UNIQUE INDEX users_email_key ON users(email);
CREATE INDEX users_email_idx ON users(email);

-- Vehicles
CREATE INDEX vehicles_status_category_idx ON vehicles(status, category);
CREATE INDEX vehicles_location_id_idx ON vehicles(location_id);
CREATE UNIQUE INDEX vehicles_license_plate_key ON vehicles(license_plate);

-- Bookings
CREATE INDEX bookings_user_id_idx ON bookings(user_id);
CREATE INDEX bookings_vehicle_id_idx ON bookings(vehicle_id);
CREATE INDEX bookings_start_date_end_date_idx ON bookings(start_date, end_date);
CREATE INDEX bookings_status_idx ON bookings(status);
CREATE UNIQUE INDEX bookings_reference_key ON bookings(reference);

-- Reviews
CREATE INDEX reviews_vehicle_id_idx ON reviews(vehicle_id);
CREATE INDEX reviews_status_idx ON reviews(status);
CREATE UNIQUE INDEX reviews_booking_id_key ON reviews(booking_id);

-- Maintenances
CREATE INDEX maintenances_vehicle_id_idx ON maintenances(vehicle_id);
CREATE INDEX maintenances_status_idx ON maintenances(status);
CREATE INDEX maintenances_start_date_end_date_idx ON maintenances(start_date, end_date);

-- Invoices
CREATE INDEX invoices_booking_id_idx ON invoices(booking_id);
CREATE INDEX invoices_user_id_idx ON invoices(user_id);
CREATE INDEX invoices_status_idx ON invoices(status);
CREATE UNIQUE INDEX invoices_invoice_number_key ON invoices(invoice_number);

-- Payments
CREATE INDEX payments_booking_id_idx ON payments(booking_id);
CREATE INDEX payments_user_id_idx ON payments(user_id);
CREATE INDEX payments_status_idx ON payments(status);
CREATE INDEX payments_transaction_id_idx ON payments(transaction_id);

-- Settings
CREATE INDEX settings_category_idx ON settings(category);
CREATE UNIQUE INDEX settings_key_key ON settings(key);
```

---

## 🔄 Migrations

### Commandes Prisma

```bash
# Générer le client Prisma
npx prisma generate

# Créer une migration
npx prisma migrate dev --name init

# Appliquer les migrations
npx prisma migrate deploy

# Push du schéma (développement)
npx prisma db push

# Studio (interface graphique)
npx prisma studio
```

---

## 📝 Notes Importantes

### PostgreSQL et Prisma

1. **IDs** : Utiliser `@default(cuid())` ou `@default(uuid())` pour les IDs String
2. **Auto-increment** : Utiliser `Int @id @default(autoincrement())` pour les IDs numériques
3. **JSON** : Utiliser le type `Json` pour les données flexibles (JSONB en PostgreSQL)
4. **Arrays** : Support natif PostgreSQL pour les tableaux
5. **Foreign Keys** : Contraintes de clé étrangère automatiques avec `@relation`

### Relations

- PostgreSQL supporte les contraintes de clé étrangère
- `onDelete: Cascade` - Suppression en cascade
- `onDelete: Restrict` - Empêche la suppression si relation existe
- `onDelete: SetNull` - Met à null si relation supprimée

### Performance

- Index sur les champs fréquemment recherchés
- Index composés pour les requêtes complexes
- Index unique pour l'intégrité des données
- PostgreSQL optimise automatiquement les requêtes

---

## ✅ Checklist Schéma

- [ ] Tous les modèles définis
- [ ] Tous les enums créés
- [ ] Relations configurées
- [ ] Index définis
- [ ] Contraintes d'unicité
- [ ] Valeurs par défaut
- [ ] Types corrects (Float, Int, String, DateTime, Json, Boolean)
- [ ] Mapping PostgreSQL correct (@map)
- [ ] Foreign Keys avec onDelete configurées
- [ ] Index optimisés pour les requêtes fréquentes

