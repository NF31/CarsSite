"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BookingStatus } from "@/lib/types/booking-status";
import { moderateSchema, validateAuth, validateBooking } from "./moderate-booking/utils/validation";
import { handleModificationRequest } from "./moderate-booking/handlers/modification-handler";
import { handleCancellationRequest } from "./moderate-booking/handlers/cancellation-handler";
import { handleSimpleValidation } from "./moderate-booking/handlers/simple-validation-handler";
import type { ModerateBookingResult } from "./moderate-booking/types";

export type { ModerateBookingAction, ModerateBookingResult } from "./moderate-booking/types";

/**
 * Action principale pour modérer le statut d'une réservation
 * Gère les demandes de modification, d'annulation et la validation simple
 */
export async function moderateBookingStatusAction(
  rawInput: z.input<typeof moderateSchema>
): Promise<ModerateBookingResult> {
  try {
    // Validation de l'authentification
    const authValidation = await validateAuth();
    if (!authValidation.valid) {
      return {
        success: false,
        error: authValidation.error,
      };
    }

    // Validation du schéma
    const parsed = moderateSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Données invalides.",
      };
    }

    const { bookingId, action } = parsed.data;

    // Récupération de la réservation
    const bookingValidation = await validateBooking(bookingId);
    if (!bookingValidation.valid || !bookingValidation.booking) {
      return {
        success: false,
        error: bookingValidation.error || "Réservation introuvable.",
      };
    }

    const booking = bookingValidation.booking;

    // Chargement du module email
    const emailModule = (await import("@/lib/email")) as unknown as {
      sendBookingCancellationEmail: (...args: unknown[]) => Promise<{ success: boolean; skipped?: boolean; error?: string }>;
      sendBookingCancellationRejectedEmail: (...args: unknown[]) => Promise<{ success: boolean; skipped?: boolean; error?: string }>;
      sendBookingUpdateEmail: (...args: unknown[]) => Promise<{ success: boolean; skipped?: boolean; error?: string }>;
    };

    // Détection du type de demande
    const isCancellationRequest = booking.cancellationRequested;
    const hasModificationDepositDifference = (booking.modificationDepositDifference ?? 0) !== 0;
    const isModificationRequest = booking.modificationRequested === true || hasModificationDepositDifference;

    // Vérifier que la réservation est en attente de traitement
    if (!isCancellationRequest && !isModificationRequest && booking.status !== BookingStatus.PENDING) {
      return {
        success: false,
        error: "Cette réservation a déjà été traitée.",
      };
    }

    // Gérer les demandes de modification
    // IMPORTANT: Inclure aussi les cas où modificationDepositDifference existe
    // MAIS si c'est une annulation ET une modification, prioriser l'annulation si action = "reject"
    if (isModificationRequest && !(isCancellationRequest && action === "reject")) {
      const result = await handleModificationRequest(
        booking,
        action,
        emailModule,
        parsed.data.rejectionReason
      );
      return result;
    }

    // Gérer les demandes d'annulation
    if (isCancellationRequest) {
      const result = await handleCancellationRequest(
        booking,
        bookingId,
        action,
        emailModule,
        parsed.data.rejectionReason
      );

      // Invalider les caches après traitement
      revalidatePath("/dashboard");
      revalidatePath("/admin/bookings");
      revalidatePath(`/admin/bookings/${bookingId}`);
      revalidatePath("/admin/dashboard");

      return result;
    }

    // Validation simple
    const result = await handleSimpleValidation(booking, bookingId, action);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur inattendue s'est produite.",
    };
  }
}
