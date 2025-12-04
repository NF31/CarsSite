import { BookingStatus } from "@/lib/types/booking-status";
import type { Prisma } from "@prisma/client";

/**
 * Types pour la modération des réservations
 */

export type BookingModerationPayload = Prisma.BookingGetPayload<{
  include: {
    user: {
      select: {
        name: true;
        email: true;
      };
    };
    vehicle: {
      select: {
        brand: true;
        model: true;
        licensePlate: true;
      };
    };
    pickupLocation: {
      select: {
        name: true;
      };
    };
    returnLocation: {
      select: {
        name: true;
      };
    };
  };
}> & {
  cancellationRequested: boolean;
  cancellationReason: string | null;
  cancellationRequestedAt: Date | null;
  cancellationRequestedRefundRate: number | null;
  cancellationPreviousStatus: BookingStatus | null;
  totalPrice: number | null;
  depositPaid: number | null;
  remainingAmount: number | null;
  modificationRequested?: boolean;
  modificationRequestedAt?: Date | null;
  originalStartDate?: Date | null;
  originalEndDate?: Date | null;
  originalTotalPrice?: number | null;
  originalDepositPaid?: number | null;
  modificationDepositDifference?: number | null;
  securityDepositPaid?: number | null;
};

export type EmailResult = { success: boolean; skipped?: boolean; error?: string };

export type EmailFunction = (...args: unknown[]) => Promise<EmailResult>;

export type EmailModule = {
  sendBookingCancellationEmail: EmailFunction;
  sendBookingCancellationRejectedEmail: EmailFunction;
  sendBookingUpdateEmail: EmailFunction;
};

export type ModerateBookingAction = "approve" | "reject";

export interface ModerateBookingResult {
  success: boolean;
  error?: string;
}

export interface ModificationRequestData {
  booking: BookingModerationPayload;
  action: ModerateBookingAction;
  emailModule: EmailModule;
  rejectionReason?: string;
}

export interface CancellationRequestData {
  booking: BookingModerationPayload;
  action: ModerateBookingAction;
  emailModule: EmailModule;
  rejectionReason?: string;
}

