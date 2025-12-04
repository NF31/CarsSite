"use server";

import { auth } from "@/auth";
import prisma from '@/lib/prisma'
import { redirect } from "next/navigation";
import {
  updateBookingSchema,
  type UpdateBookingPayload,
} from "@/lib/validations/booking";
import type { UpdateBookingResult } from "./update-booking/types";
import { EXISTING_BOOKING_SELECT, UPDATED_BOOKING_SELECT } from "./update-booking/get-booking-select";
import { validateBookingData } from "./update-booking/validate-booking-data";
import { validateServices } from "./update-booking/validate-services";
import { checkBookingOverlap, checkMaintenanceOverlap } from "./update-booking/check-overlaps";
import { buildUpdateData } from "./update-booking/build-update-data";
import { invalidateBookingCaches } from "./update-booking/invalidate-cache";
import { sendUpdateEmail } from "./update-booking/send-update-email";

// Ré-exporter le type pour compatibilité
export type { UpdateBookingResult } from "./update-booking/types";

export async function updateBookingAction(
  input: UpdateBookingPayload
): Promise<UpdateBookingResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      console.warn("[Bookings] Tentative non autorisée de mise à jour de réservation", {
        userId: session.user.id,
      });
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires pour modifier une réservation.",
      };
    }

    console.log("[Bookings] Requête de mise à jour reçue", {
      adminId: session.user.id,
      bookingId: input.bookingId,
      userId: input.userId,
      vehicleId: input.vehicleId,
      pickupLocationId: input.pickupLocationId,
      returnLocationId: input.returnLocationId,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status,
      sendConfirmation: input.sendConfirmation ?? false,
    });

    const parsed = updateBookingSchema.safeParse(input);

    if (!parsed.success) {
      console.warn("[Bookings] Validation du payload édition échouée", {
        errors: parsed.error.flatten().fieldErrors,
      });
      return {
        success: false,
        error: "Données invalides",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;

    // Récupérer la réservation existante
    const existingBooking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      select: EXISTING_BOOKING_SELECT,
    });

    if (!existingBooking) {
      return {
        success: false,
        error: "Réservation introuvable.",
      };
    }

    // Vérifier que la réservation n'est pas passée
    const now = new Date();
    if (existingBooking.startDate < now || existingBooking.endDate < now) {
      return {
        success: false,
        error: "Les réservations passées ne peuvent plus être modifiées.",
      };
    }

    // Valider les données (user, vehicle, locations)
    const validationResult = await validateBookingData(data);
    if (!validationResult.success) {
      return validationResult;
    }

    const { user, vehicle, pickupLocation, returnLocation } = validationResult.data;

    // Valider les services
    const serviceValidation = await validateServices(
      data.serviceIds ?? [],
      existingBooking.serviceIds
    );
    if (!serviceValidation.success) {
      return serviceValidation;
    }

    const serviceIds = serviceValidation.serviceIds;

    // Vérifier que l'acompte ne dépasse pas le total
    if (data.depositPaid > data.totalPrice) {
      return {
        success: false,
        error: "L'acompte ne peut pas dépasser le montant total.",
      };
    }

    // Vérifier les chevauchements
    const bookingOverlap = await checkBookingOverlap(
      data.vehicleId,
      data.startDate,
      data.endDate,
      existingBooking.id
    );
    if (!bookingOverlap.success) {
      return bookingOverlap;
    }

    const maintenanceOverlap = await checkMaintenanceOverlap(
      data.vehicleId,
      data.startDate,
      data.endDate
    );
    if (!maintenanceOverlap.success) {
      return maintenanceOverlap;
    }

    try {
      // Construire les données de mise à jour
      const updateData = buildUpdateData({ data, serviceIds });

      // Mettre à jour la réservation
      const updated = await prisma.booking.update({
        where: { id: existingBooking.id },
        data: updateData,
        select: UPDATED_BOOKING_SELECT,
      });

      // Invalider les caches
      await invalidateBookingCaches(data.bookingId, data.vehicleId);

      // Envoyer l'email de confirmation si demandé
      if (data.sendConfirmation) {
        const remainingAmount = updateData.remainingAmount as number;
        await sendUpdateEmail({
          userEmail: user.email,
          userName: user.name,
          bookingReference: updated.reference,
          totalPrice: data.totalPrice,
          depositPaid: data.depositPaid,
          remainingAmount,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          vehicleLabel: `${vehicle.brand} ${vehicle.model}`,
          vehicleLicensePlate: vehicle.licensePlate,
          pickupLocationName: pickupLocation.name,
          returnLocationName: returnLocation.name,
        });
      }

      console.log("[Bookings] Réservation mise à jour avec succès", {
        reference: updated.reference,
        bookingId: updated.id,
      });

      return {
        success: true,
        data: {
          id: updated.id,
          reference: updated.reference,
        },
      };
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002" &&
        "meta" in error &&
        typeof error.meta === "object" &&
        error.meta !== null &&
        "target" in error.meta &&
        error.meta.target === "bookings_reference_key"
      ) {
        return {
          success: false,
          error: "Une réservation avec cette référence existe déjà. Veuillez réessayer.",
        };
      }
      console.error("[Bookings] Erreur lors de la mise à jour en base", error);
      throw error;
    }
  } catch (error) {
    console.error("[Bookings] Erreur inattendue lors de la mise à jour", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour de la réservation.",
    };
  }
}


