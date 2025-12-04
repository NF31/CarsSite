import { ServicePricingType } from "@/lib/types/service-pricing-type";
import { VehicleStatus } from "@/lib/types/vehicle-status";
import { UserRole } from "@prisma/client";

export interface BookingUserOption {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  totalBookings: number;
  hasDriverLicense: boolean;
  driverLicenseUrl: string | null;
  driverLicensePublicId: string | null;
  driverLicenseUploadCount: number;
  driverLicenseLastUploadedAt: string | null;
}

export interface BookingVehicleOption {
  id: string;
  label: string;
  brand: string;
  model: string;
  licensePlate: string;
  pricePerDay: number;
  deposit: number;
  status: VehicleStatus;
  location?: {
    id: string;
    name: string;
    city: string;
  } | null;
}

export interface BookingLocationOption {
  id: string;
  name: string;
  city: string;
  address: string;
}

export interface BookingServiceOption {
  id: string;
  name: string;
  price: number;
  pricingType: ServicePricingType;
  active: boolean;
}

export interface GetBookingOptionsResult {
  success: boolean;
  data?: {
    users: BookingUserOption[];
    vehicles: BookingVehicleOption[];
    locations: BookingLocationOption[];
    services: BookingServiceOption[];
  };
  error?: string;
}

export interface GetBookingOptionsParams {
  includeUserIds?: string[];
  includeServiceIds?: string[];
  includeLocationIds?: string[];
}

