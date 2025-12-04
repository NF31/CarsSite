import prisma from "@/lib/prisma";
import { BookingStatus } from "@/lib/types/booking-status";
import type { BookingData, PaymentAmounts, PaymentType } from "../types";

/**
 * Handler pour la mise à jour de la réservation
 */

export interface BookingUpdateData {
  depositPaid?: number;
  securityDepositPaid?: number;
  remainingAmount: number;
  status?: BookingStatus;
  modificationDepositDifference?: null;
}

/**
 * Prépare les données de mise à jour pour la réservation
 */
export function prepareBookingUpdateData(
  paymentType: PaymentType,
  amounts: PaymentAmounts,
  remainingAmount: number,
  isModification: boolean
): BookingUpdateData {
  const updateData: BookingUpdateData = {
    remainingAmount,
  };

  if (paymentType.type === "deposit") {
    updateData.depositPaid = amounts.actualDepositPaid;
    // IMPORTANT: Pour les paiements de modification, NE PAS mettre le statut à CONFIRMED
    // Le webhook le fera après validation du paiement
    if (!isModification) {
      updateData.status = BookingStatus.CONFIRMED;
    }
  } else if (paymentType.type === "authorization") {
    updateData.securityDepositPaid = amounts.actualSecurityDepositPaid;
    updateData.status = BookingStatus.PENDING;
  } else {
    updateData.depositPaid = amounts.actualDepositPaid;
    updateData.securityDepositPaid = amounts.actualSecurityDepositPaid;
    // IMPORTANT: Pour les paiements de modification, NE PAS mettre le statut à CONFIRMED
    // Le webhook le fera après validation du paiement
    if (!isModification) {
      updateData.status = BookingStatus.CONFIRMED;
    }
  }

  return updateData;
}

/**
 * Met à jour la réservation
 */
export async function updateBooking(
  bookingId: string,
  updateData: BookingUpdateData
): Promise<void> {
  await prisma.booking.update({
    where: { id: bookingId },
    data: updateData,
  });
}

/**
 * Recharge la réservation mise à jour
 */
export async function reloadBooking(bookingId: string): Promise<BookingData | null> {
  return (await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      reference: true,
      depositPaid: true,
      securityDepositPaid: true,
      totalPrice: true,
      remainingAmount: true,
      status: true,
      vehicle: {
        select: {
          brand: true,
          model: true,
          deposit: true,
        },
      },
    },
  })) as BookingData | null;
}

