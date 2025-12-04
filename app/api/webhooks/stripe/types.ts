import { BookingStatus } from "@/lib/types/booking-status";
import Stripe from "stripe";

/**
 * Types pour les webhooks Stripe
 */

export interface CheckoutSessionData {
  bookingId: string;
  userId: string;
  session: Stripe.Checkout.Session;
  event: Stripe.Event;
}

export interface PaymentProcessingResult {
  success: boolean;
  bookingId: string;
  updatedBooking?: {
    id: string;
    reference: string;
    status: BookingStatus;
    depositPaid: number;
    securityDepositPaid: number;
    remainingAmount: number;
    totalPrice: number;
    startDate: Date;
    endDate: Date;
    userId: string;
    vehicleId: string;
    pickupLocationId: string;
    returnLocationId: string;
  };
  paymentId?: string;
  error?: string;
}

export interface PaymentType {
  type: "full" | "deposit" | "authorization" | "modification";
  isAuthorization: boolean;
  isDepositOnly: boolean;
  isModificationPayment: boolean;
}

export interface PaymentAmounts {
  downPayment: number;
  securityDeposit: number;
  remainingAmount: number;
  amountPaid: number;
  expectedAmount: number;
  roundedDownPayment: number;
  roundedSecurityDeposit: number;
  roundedRemainingAmount: number;
  roundedAmountPaid: number;
}

export interface BookingUpdateData {
  depositPaid: number;
  securityDepositPaid: number;
  remainingAmount: number;
  status: BookingStatus;
  modificationDepositDifference?: number | null;
  originalStartDate?: Date | null;
  originalEndDate?: Date | null;
  originalTotalPrice?: number | null;
  originalDepositPaid?: number | null;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface RefundEventData {
  refund: Stripe.Refund;
  event: Stripe.Event;
  bookingId?: string;
  bookingReference?: string;
}

export interface RefundProcessingResult {
  success: boolean;
  paymentId?: string;
  bookingId?: string;
  error?: string;
}

