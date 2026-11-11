# Modèles de Données TypeScript - CarRental

## Vue d'Ensemble

Ce document définit tous les modèles de données TypeScript utilisés dans l'application CarRental.

---

## User

```typescript
export type UserRole = 'CLIENT' | 'ADMIN' | 'EMPLOYEE';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  password: string; // Hashed
  emailVerified?: Date;
  image?: string;
  driverLicense?: string; // URL to document
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  phone?: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string;
  email?: string;
  image?: string;
  driverLicense?: string;
}
```

---

## Vehicle

```typescript
export type VehicleCategory = 
  | 'ECONOMY'
  | 'COMPACT'
  | 'MID_SIZE'
  | 'FULL_SIZE'
  | 'SUV'
  | 'LUXURY'
  | 'VAN';

export type VehicleStatus = 
  | 'AVAILABLE'
  | 'RESERVED'
  | 'MAINTENANCE'
  | 'UNAVAILABLE';

export type TransmissionType = 'MANUAL' | 'AUTOMATIC';

export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  mileage: number;
  category: VehicleCategory;
  seats: number;
  transmission: TransmissionType;
  fuelType: FuelType;
  color: string;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  deposit: number;
  status: VehicleStatus;
  locationId: string;
  features: string[]; // ['GPS', 'Bluetooth', 'Air Conditioning', ...]
  images: string[]; // URLs to images
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleInput {
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  mileage: number;
  category: VehicleCategory;
  seats: number;
  transmission: TransmissionType;
  fuelType: FuelType;
  color: string;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  deposit: number;
  locationId: string;
  features?: string[];
  images?: string[];
  description?: string;
}

export interface UpdateVehicleInput {
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  category?: VehicleCategory;
  pricePerDay?: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  deposit?: number;
  status?: VehicleStatus;
  locationId?: string;
  features?: string[];
  images?: string[];
  description?: string;
}

export interface VehicleAvailability {
  vehicleId: string;
  date: Date;
  available: boolean;
  reason?: string; // 'RESERVED' | 'MAINTENANCE' | 'BLOCKED'
}
```

---

## Booking

```typescript
export type BookingStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Booking {
  id: string;
  reference: string; // e.g., "BK-2024-001"
  userId: string;
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  pickupLocationId: string;
  returnLocationId: string;
  totalPrice: number;
  depositPaid: number;
  remainingAmount: number;
  status: BookingStatus;
  services: string[]; // Service IDs
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingInput {
  userId: string;
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  pickupLocationId: string;
  returnLocationId: string;
  services?: string[];
  notes?: string;
}

export interface UpdateBookingInput {
  startDate?: Date;
  endDate?: Date;
  pickupLocationId?: string;
  returnLocationId?: string;
  services?: string[];
  status?: BookingStatus;
  notes?: string;
}

export interface BookingSummary {
  vehicle: Vehicle;
  booking: Booking;
  services: Service[];
  totalDays: number;
  totalPrice: number;
}
```

---

## Service

```typescript
export type ServicePricingType = 'PER_DAY' | 'FIXED' | 'PERCENTAGE';

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  pricingType: ServicePricingType;
  availableForCategories?: VehicleCategory[];
  icon?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  price: number;
  pricingType: ServicePricingType;
  availableForCategories?: VehicleCategory[];
  icon?: string;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
  price?: number;
  pricingType?: ServicePricingType;
  availableForCategories?: VehicleCategory[];
  icon?: string;
  active?: boolean;
}
```

---

## Review

```typescript
export interface Review {
  id: string;
  bookingId: string;
  userId: string;
  vehicleId: string;
  rating: number; // 1-5
  comment?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewInput {
  bookingId: string;
  vehicleId: string;
  rating: number;
  comment?: string;
}

export interface ReviewWithUser extends Review {
  user: {
    id: string;
    name: string;
    image?: string;
  };
}
```

---

## Maintenance

```typescript
export type MaintenanceType = 'SERVICE' | 'REPAIR' | 'INSPECTION';

export type MaintenanceStatus = 
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Maintenance {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  startDate: Date;
  endDate: Date;
  description?: string;
  cost: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMaintenanceInput {
  vehicleId: string;
  type: MaintenanceType;
  startDate: Date;
  endDate: Date;
  description?: string;
  cost: number;
  notes?: string;
}

export interface UpdateMaintenanceInput {
  type?: MaintenanceType;
  status?: MaintenanceStatus;
  startDate?: Date;
  endDate?: Date;
  description?: string;
  cost?: number;
  notes?: string;
}
```

---

## Invoice

```typescript
export type InvoiceStatus = 
  | 'DRAFT'
  | 'SENT'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g., "INV-2024-001"
  bookingId: string;
  userId: string;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  issuedAt: Date;
  dueDate: Date;
  paidAt?: Date;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceInput {
  bookingId: string;
  subtotal: number;
  tax?: number;
  dueDate?: Date;
}
```

---

## Payment

```typescript
export type PaymentMethod = 'STRIPE' | 'PAYPAL' | 'CASH' | 'BANK_TRANSFER';

export type PaymentStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED';

export interface Payment {
  id: string;
  bookingId: string;
  invoiceId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string; // External payment ID
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentInput {
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  invoiceId?: string;
  transactionId?: string;
  metadata?: Record<string, any>;
}
```

---

## Location

```typescript
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  openingHours: {
    monday: { open: string; close: string; closed?: boolean };
    tuesday: { open: string; close: string; closed?: boolean };
    wednesday: { open: string; close: string; closed?: boolean };
    thursday: { open: string; close: string; closed?: boolean };
    friday: { open: string; close: string; closed?: boolean };
    saturday: { open: string; close: string; closed?: boolean };
    sunday: { open: string; close: string; closed?: boolean };
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLocationInput {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  openingHours: Location['openingHours'];
}

export interface UpdateLocationInput {
  name?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  openingHours?: Location['openingHours'];
  active?: boolean;
}
```

---

## Setting

```typescript
export interface Setting {
  id: string;
  key: string;
  value: string | number | boolean | object;
  description?: string;
  category: 'GENERAL' | 'PAYMENT' | 'EMAIL' | 'BOOKING' | 'OTHER';
  updatedAt: Date;
}

export interface UpdateSettingInput {
  value: string | number | boolean | object;
}
```

---

## Dashboard Statistics

```typescript
export interface DashboardStats {
  todayBookings: number;
  todayBookingsChange: number; // Percentage
  monthlyRevenue: number;
  monthlyRevenueChange: number;
  availableVehicles: number;
  totalVehicles: number;
  occupancyRate: number;
  occupancyRateChange: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  previousRevenue?: number;
}

export interface BookingChartData {
  category: VehicleCategory;
  count: number;
}

export interface OccupancyChartData {
  status: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE';
  percentage: number;
}
```

---

## Search & Filter Types

```typescript
export interface VehicleSearchFilters {
  startDate?: Date;
  endDate?: Date;
  category?: VehicleCategory;
  minPrice?: number;
  maxPrice?: number;
  seats?: number;
  transmission?: TransmissionType;
  fuelType?: FuelType;
  locationId?: string;
  features?: string[];
}

export interface BookingFilters {
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  vehicleId?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

## Email Types

```typescript
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface BookingConfirmationEmail {
  booking: Booking;
  user: User;
  vehicle: Vehicle;
}

export interface PaymentConfirmationEmail {
  payment: Payment;
  booking: Booking;
  invoice?: Invoice;
}

export interface CancellationEmail {
  booking: Booking;
  user: User;
  refundAmount?: number;
}
```

---

## Utilisation dans l'Application

### Exemple d'utilisation

```typescript
// Dans un composant React
import { Vehicle, Booking, User } from '@/types';

const VehicleCard: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
  return (
    <div>
      <h3>{vehicle.brand} {vehicle.model}</h3>
      <p>{vehicle.pricePerDay}€/jour</p>
      <p>Status: {vehicle.status}</p>
    </div>
  );
};

// Dans une API Route
import { CreateBookingInput, Booking } from '@/types';

export async function POST(request: Request) {
  const data: CreateBookingInput = await request.json();
  // Validation et création...
}
```

---

## Checklist Modèles

- [ ] Tous les modèles principaux définis
- [ ] Types d'union pour les enums
- [ ] Interfaces Input pour création/modification
- [ ] Types pour les réponses API
- [ ] Types pour les filtres et recherche
- [ ] Types pour la pagination
- [ ] Documentation JSDoc ajoutée


