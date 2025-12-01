export interface EditBookingDialogProps {
  bookingId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  vehicleId: string;
  serviceIds: string[];
  depositPaid: number;
  securityDepositPaid?: number;
  disabled?: boolean;
}

export type AvailabilityState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available" }
  | { status: "booking_conflict"; message: string }
  | { status: "maintenance_conflict"; message: string }
  | { status: "error"; message: string };

export type PriceCalculation = {
  totalPrice: number;
  remainingAmount: number;
  newDownPayment: number;
  depositDifference: number;
};

