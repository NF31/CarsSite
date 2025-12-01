import { GetPublicVehicleByIdResult } from "@/actions/public/vehicles/get-by-id";

export interface BookingStep4PaymentProps {
  vehicle: NonNullable<GetPublicVehicleByIdResult["data"]>;
  bookingData: {
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
    paymentOption: "deposit" | "deposit_and_deposit" | "on_site";
  };
  updateBookingData: (updates: Partial<BookingStep4PaymentProps["bookingData"]>) => void;
  onPrevious: () => void;
  existingBookingId?: string;
}

export interface PriceCalculation {
  vehiclePrice: number;
  servicesPrice: number;
  totalPrice: number;
  deposit: number;
  vehicleDeposit: number;
  remainingAmount: number;
  numberOfDays: number;
  breakdown: {
    vehicle: {
      pricePerDay: number;
      days: number;
      total: number;
    };
    services: Array<{
      id: string;
      name: string;
      price: number;
      pricingType: "PER_DAY" | "FIXED" | "PERCENTAGE";
      total: number;
    }>;
  };
}

export type PaymentOption = "deposit" | "deposit_and_deposit" | "on_site";

export type PaymentType = "deposit" | "full" | "authorization";

