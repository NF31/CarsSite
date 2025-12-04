import type { Prisma } from '@/lib/prisma';

/**
 * Sélection Prisma pour récupérer les utilisateurs
 */
export const USER_SELECT: Prisma.UserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  driverLicense: true,
  driverLicensePublicId: true,
  driverLicenseUploadCount: true,
  driverLicenseLastUploadedAt: true,
  _count: {
    select: {
      bookings: true,
    },
  },
};

/**
 * Sélection Prisma pour récupérer les véhicules
 */
export const VEHICLE_SELECT: Prisma.VehicleSelect = {
  id: true,
  brand: true,
  model: true,
  year: true,
  licensePlate: true,
  pricePerDay: true,
  deposit: true,
  status: true,
  location: {
    select: {
      id: true,
      name: true,
      city: true,
    },
  },
};

/**
 * Sélection Prisma pour récupérer les agences
 */
export const LOCATION_SELECT: Prisma.LocationSelect = {
  id: true,
  name: true,
  city: true,
  address: true,
};

/**
 * Sélection Prisma pour récupérer les services
 */
export const SERVICE_SELECT: Prisma.ServiceSelect = {
  id: true,
  name: true,
  price: true,
  pricingType: true,
  active: true,
};

