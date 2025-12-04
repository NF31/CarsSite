import { BookingStatus } from "@/lib/types/booking-status";
import Stripe from "stripe";
import type { PaymentType } from "../../types";

export interface BookingSelectFields {
  id: true;
  userId: true;
  totalPrice: true;
  depositPaid: true;
  securityDepositPaid: true;
  remainingAmount: true;
  serviceIds: true;
  startDate: true;
  endDate: true;
  status: true;
  modificationDepositDifference: true;
  originalStartDate: true;
  originalEndDate: true;
  originalTotalPrice: true;
  originalDepositPaid: true;
  vehicle: {
    select: {
      id: true;
      deposit: true;
    };
  };
}

export interface UpdatedBookingSelectFields {
  id: true;
  reference: true;
  status: true;
  depositPaid: true;
  securityDepositPaid: true;
  remainingAmount: true;
  totalPrice: true;
  startDate: true;
  endDate: true;
  userId: true;
  vehicleId: true;
  pickupLocationId: true;
  returnLocationId: true;
}

export interface BookingUpdateData {
  depositPaid?: number;
  securityDepositPaid?: number;
  remainingAmount?: number;
  status?: BookingStatus;
  modificationDepositDifference?: number | null;
  originalStartDate?: Date | null;
  originalEndDate?: Date | null;
  originalTotalPrice?: number | null;
  originalDepositPaid?: number | null;
}

export interface PaymentAmounts {
  emailDepositPaid: number;
  emailRemainingAmount: number;
  roundedAmountPaid: number;
}

export interface EmailBookingData {
  id: string;
  reference: string;
  status: BookingStatus;
  depositPaid: number | null;
  securityDepositPaid: number | null;
  remainingAmount: number | null;
  totalPrice: number;
  startDate: Date;
  endDate: Date;
  userId: string;
  vehicleId: string;
  pickupLocationId: string;
  returnLocationId: string;
}

export interface SendEmailParams {
  updatedBooking: EmailBookingData;
  paymentType: PaymentType;
  session: Stripe.Checkout.Session;
  amounts: PaymentAmounts;
}

export interface ModificationInfo {
  originalTotalPrice: number;
  originalDepositPaid: number;
  originalRemainingAmount: number;
  depositDifference: number;
  additionalPaymentAmount: number;
  securityDepositPaid: number;
  paymentConfirmed: boolean;
}


