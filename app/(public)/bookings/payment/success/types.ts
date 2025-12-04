import type { BookingStatus } from "@/lib/types/booking-status";

/**
 * Types pour la page de succès de paiement
 */

export interface PaymentSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
    booking_id?: string;
  }>;
}

export interface PaymentMetadata {
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paymentType?: string;
  downPayment?: number;
  securityDeposit?: number;
  isModificationPayment?: boolean;
  originalTotalPrice?: string;
  originalDepositPaid?: string;
  originalRemainingAmount?: string;
  depositDifference?: string;
  securityDepositPaid?: string;
}

export interface BookingPaymentData {
  id: string;
  amount: number;
  transactionId: string | null;
  metadata: PaymentMetadata | null;
  createdAt: Date;
}

export interface BookingData {
  id: string;
  reference: string;
  depositPaid: number | null;
  securityDepositPaid: number | null;
  totalPrice: number;
  remainingAmount: number | null;
  startDate: Date;
  endDate: Date;
  serviceIds: string[] | null;
  status: BookingStatus;
  userId: string | null;
  vehicleId: string;
  pickupLocationId: string;
  returnLocationId: string;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    deposit: number | null;
  };
  payments?: BookingPaymentData[];
}

export interface ModificationMetadata {
  originalTotalPrice: number | null;
  originalDepositPaid: number | null;
  originalRemainingAmount: number | null;
  depositDifference: number | null;
  securityDepositPaid: number;
}

export interface PaymentAmounts {
  actualDepositPaid: number;
  actualSecurityDepositPaid: number;
  expectedSecurityDeposit: number;
}

export interface PaymentType {
  type: "deposit" | "full" | "authorization";
  isModificationPayment: boolean;
}

