import type { Prisma } from "@prisma/client";
import { BookingStatus } from "@prisma/client";
import { calculateBookingStatus } from "@/lib/booking-status-sync";
import type { PriceDifferences } from "./utils";

interface BuildUpdateDataParams {
  startDate: Date;
  endDate: Date;
  priceDifferences: PriceDifferences;
  existingBooking: {
    status: BookingStatus;
    cancellationRequested: boolean | null;
    startDate: Date;
    endDate: Date;
    totalPrice: number | null;
    depositPaid: number | null;
    securityDepositPaid: number | null;
  };
}

/**
 * Construit les données de mise à jour pour une réservation
 */
export function buildBookingUpdateData({
  startDate,
  endDate,
  priceDifferences,
  existingBooking,
}: BuildUpdateDataParams): Prisma.BookingUpdateInput {
  const newStatus = calculateBookingStatus({
    currentStatus: existingBooking.status,
    modificationRequested: true,
    cancellationRequested: existingBooking.cancellationRequested ?? false,
    modificationDepositDifference: priceDifferences.depositDifference,
    startDate,
  });

  return {
    startDate,
    endDate,
    totalPrice: priceDifferences.newTotalPrice,
    depositPaid: priceDifferences.newDownPayment,
    remainingAmount: priceDifferences.newRemainingAmount,
    status: newStatus,
    modificationRequested: true,
    modificationRequestedAt: new Date(),
    originalStartDate: existingBooking.startDate,
    originalEndDate: existingBooking.endDate,
    originalTotalPrice: existingBooking.totalPrice,
    originalDepositPaid: existingBooking.depositPaid ?? 0,
    modificationDepositDifference: priceDifferences.depositDifference,
    ...(existingBooking.securityDepositPaid && existingBooking.securityDepositPaid > 0
      ? { securityDepositPaid: existingBooking.securityDepositPaid }
      : {}),
  };
}

