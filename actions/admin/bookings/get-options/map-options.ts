import { extractCloudinaryAssetInfo } from "@/lib/cloudinary-utils";
import { ServicePricingType } from "@/lib/types/service-pricing-type";
import { VehicleStatus } from "@/lib/types/vehicle-status";
import { UserRole } from "@/lib/types/user-role";
import type {
  BookingUserOption,
  BookingVehicleOption,
  BookingLocationOption,
  BookingServiceOption,
} from "./types";

export interface UserFromPrisma {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  driverLicense: string | null;
  driverLicensePublicId: string | null;
  driverLicenseUploadCount: number | null;
  driverLicenseLastUploadedAt: Date | null;
  _count: {
    bookings: number;
  };
}

export interface VehicleFromPrisma {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  licensePlate: string;
  pricePerDay: number;
  deposit: number;
  status: string;
  location: {
    id: string;
    name: string;
    city: string;
  } | null;
}

export interface LocationFromPrisma {
  id: string;
  name: string;
  city: string;
  address: string;
}

export interface ServiceFromPrisma {
  id: string;
  name: string;
  price: number;
  pricingType: string;
  active: boolean;
}

/**
 * Mappe un utilisateur Prisma vers BookingUserOption
 */
export function mapUser(user: UserFromPrisma): BookingUserOption {
  const assetInfo = extractCloudinaryAssetInfo(user.driverLicense ?? undefined);
  const explicitPublicId = user.driverLicensePublicId ?? null;
  const fallbackPublicId = assetInfo ? `${assetInfo.publicId}.${assetInfo.format}` : null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role as UserRole,
    totalBookings: user._count.bookings,
    hasDriverLicense: Boolean(user.driverLicense),
    driverLicenseUrl: user.driverLicense ?? null,
    driverLicensePublicId: explicitPublicId ?? fallbackPublicId,
    driverLicenseUploadCount: user.driverLicenseUploadCount ?? 0,
    driverLicenseLastUploadedAt: user.driverLicenseLastUploadedAt
      ? user.driverLicenseLastUploadedAt.toISOString()
      : null,
  };
}

/**
 * Mappe un véhicule Prisma vers BookingVehicleOption
 */
export function mapVehicle(vehicle: VehicleFromPrisma): BookingVehicleOption {
  return {
    id: vehicle.id,
    label: `${vehicle.brand} ${vehicle.model} • ${vehicle.licensePlate}`,
    brand: vehicle.brand,
    model: vehicle.model,
    licensePlate: vehicle.licensePlate,
    pricePerDay: vehicle.pricePerDay,
    deposit: vehicle.deposit,
    status: vehicle.status as VehicleStatus,
    location: vehicle.location
      ? {
          id: vehicle.location.id,
          name: vehicle.location.name,
          city: vehicle.location.city,
        }
      : null,
  };
}

/**
 * Mappe une agence Prisma vers BookingLocationOption
 */
export function mapLocation(location: LocationFromPrisma): BookingLocationOption {
  return {
    id: location.id,
    name: location.name,
    city: location.city,
    address: location.address,
  };
}

/**
 * Mappe un service Prisma vers BookingServiceOption
 */
export function mapService(service: ServiceFromPrisma): BookingServiceOption {
  return {
    id: service.id,
    name: service.name,
    price: service.price,
    pricingType: service.pricingType as ServicePricingType,
    active: service.active,
  };
}

