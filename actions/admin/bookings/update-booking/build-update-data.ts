import type { Prisma } from "@prisma/client";
import type { UpdateBookingInput } from "@/lib/validations/booking";
import { calculateRemainingAmount } from "./calculate-remaining-amount";

export interface BuildUpdateDataParams {
  data: UpdateBookingInput;
  serviceIds: string[];
}

/**
 * Construit les données de mise à jour pour Prisma
 */
export function buildUpdateData({
  data,
  serviceIds,
}: BuildUpdateDataParams): Prisma.BookingUpdateInput {
  const remainingAmount = calculateRemainingAmount(
    data.totalPrice,
    data.depositPaid
  );

  return {
    user: { connect: { id: data.userId } },
    vehicle: { connect: { id: data.vehicleId } },
    pickupLocation: { connect: { id: data.pickupLocationId } },
    returnLocation: { connect: { id: data.returnLocationId } },
    startDate: data.startDate,
    endDate: data.endDate,
    totalPrice: data.totalPrice,
    depositPaid: data.depositPaid,
    remainingAmount,
    status: data.status,
    serviceIds,
    notes: data.notes ?? null,
  };
}

