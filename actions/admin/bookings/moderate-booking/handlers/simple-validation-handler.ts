import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type {
  BookingModerationPayload,
  ModerateBookingResult,
  ModerateBookingAction,
} from "../types";

/**
 * Handler pour la validation simple d'une réservation (sans modification ni annulation)
 */
export async function handleSimpleValidation(
  booking: BookingModerationPayload,
  bookingId: string,
  action: ModerateBookingAction
): Promise<ModerateBookingResult> {
  // Vérifier si c'est une modification en attente de paiement
  const hasModificationPendingPayment = (booking.modificationDepositDifference ?? 0) !== 0;

  // Règle critique : Si la réservation est PENDING, on ne peut pas la confirmer manuellement
  // SAUF si c'est une modification en attente de paiement
  if (booking.status === BookingStatus.PENDING && action === "approve" && !hasModificationPendingPayment) {
    return {
      success: false,
      error:
        "Cette réservation est en attente de paiement. Le statut passera automatiquement à CONFIRMED une fois le paiement effectué.",
    };
  }

  const nextStatus = action === "approve" ? BookingStatus.CONFIRMED : BookingStatus.CANCELLED;

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: nextStatus,
    } as Prisma.BookingUpdateInput,
  });

  // Invalider les caches
  revalidatePath("/dashboard");
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/dashboard");

  return { success: true };
}

