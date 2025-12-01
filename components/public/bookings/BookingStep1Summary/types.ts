import type { GetPublicVehicleByIdResult } from "@/actions/public/vehicles/get-by-id";

export type Vehicle = NonNullable<GetPublicVehicleByIdResult["data"]>;

export interface BookingStep1SummaryProps {
  vehicle: Vehicle;
  bookingData: BookingData;
  updateBookingData: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
}

export interface BookingData {
  vehicleId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  pickup: string;
  returnLocation: string;
  pickupPlaceId: string;
  returnPlaceId: string;
  selectedServiceIds: string[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  driverLicenseUrl?: string;
  acceptedTerms: boolean;
}

export interface PriceCalculation {
  vehiclePrice: number;
  servicesPrice: number;
  totalPrice: number;
  deposit: number;
  vehicleDeposit: number;
  remainingAmount: number;
  numberOfDays: number;
}

export interface AvailabilityCheckResult {
  available: boolean;
  reason?: "booking_conflict" | "maintenance_conflict" | "vehicle_unavailable";
  conflict?: {
    reference: string;
  };
  error?: string;
}

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: typeof google.maps.places.Autocomplete;
        };
        event?: {
          clearInstanceListeners: (instance: unknown) => void;
        };
      };
    };
  }
}

