"use server";

import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/lib/types/booking-status";
import { calculateBookingPriceAction } from "../calculate-price";
import { checkVehicleAvailabilityAction } from "../check-availability";
import { invalidateBookingsCache, invalidateVehicleAvailabilityCache } from "@/lib/cache-invalidation";
import type { CreatePublicBookingInput, CreatePublicBookingResult } from "./types";
import { createPublicBookingSchema } from "./types";
import {
  VEHICLE_SELECT_FIELDS,
  LOCATION_SELECT_FIELDS,
  BOOKING_CREATE_SELECT_FIELDS,
} from "./constants";
import { generateBookingReference } from "./utils/generate-booking-reference";
import { combineDateTime } from "./utils/combine-date-time";
import { validateServices } from "./utils/validate-services";
import { checkOverlappingBooking } from "./utils/check-overlapping-booking";
import { findOrCreateUser } from "./services/find-or-create-user";
import { findOrCreateLocation } from "./services/find-or-create-location";
import { updateUserTermsAcceptance } from "./services/update-user-terms";
import { sendBookingEmail } from "./services/send-booking-email";
import { logWorkflowStep } from "./services/log-workflow";

/**
 * Crée une réservation publique (client)
 */
export async function createPublicBookingAction(
  input: CreatePublicBookingInput
): Promise<CreatePublicBookingResult> {
  try {
    // Valider les données
    const parsed = createPublicBookingSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: "Données invalides",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;

    // Combiner dates et heures
    const startDate = combineDateTime(data.startDate, data.startTime);
    const endDate = combineDateTime(data.endDate, data.endTime);

    // Vérifier la disponibilité du véhicule
    const availabilityResult = await checkVehicleAvailabilityAction({
      vehicleId: data.vehicleId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    if (!availabilityResult.success) {
      return {
        success: false,
        error: availabilityResult.error || "Impossible de vérifier la disponibilité",
      };
    }

    if (!availabilityResult.available) {
      return {
        success: false,
        error: "Ce véhicule n'est pas disponible pour cette période",
      };
    }

    // Récupérer le véhicule et sa location
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      select: VEHICLE_SELECT_FIELDS,
    });

    if (!vehicle) {
      return {
        success: false,
        error: "Véhicule introuvable",
      };
    }

    // Calculer le prix
    // Note: calculateBookingPriceAction attend des strings pour les dates
    const priceResult = await calculateBookingPriceAction({
      vehicleId: data.vehicleId,
      startDate: data.startDate.toISOString().split("T")[0],
      endDate: data.endDate.toISOString().split("T")[0],
      startTime: data.startTime,
      endTime: data.endTime,
      serviceIds: data.serviceIds,
    });

    if (!priceResult.success || !priceResult.data) {
      return {
        success: false,
        error: priceResult.error || "Impossible de calculer le prix",
      };
    }

    const { totalPrice, deposit: downPayment } = priceResult.data;
    // deposit dans priceResult.data est l'acompte (30% du total), pas la caution
    // La caution du véhicule (vehicleDeposit) est séparée et sera gérée différemment
    // Au moment de la création, depositPaid = 0, donc remainingAmount = totalPrice
    const remainingAmount = totalPrice - downPayment;

    // Créer ou trouver l'utilisateur
    const user = await findOrCreateUser(
      data.customerEmail,
      data.customerName,
      data.customerPhone,
      data.driverLicenseUrl
    );

    // Mettre à jour la date d'acceptation des CGV si l'utilisateur accepte
    if (data.acceptedTerms) {
      await updateUserTermsAcceptance(user.id);
    }

    // Trouver ou créer les locations (pour l'instant, utiliser la location du véhicule)
    const pickupLocationId = await findOrCreateLocation(
      vehicle.locationId,
      data.pickupPlaceId,
      data.pickup
    );
    const returnLocationId = await findOrCreateLocation(
      vehicle.locationId,
      data.returnPlaceId,
      data.returnLocation
    );

    // Vérifier que les locations existent
    const [pickupLocation, returnLocation] = await Promise.all([
      prisma.location.findUnique({
        where: { id: pickupLocationId },
        select: LOCATION_SELECT_FIELDS,
      }),
      prisma.location.findUnique({
        where: { id: returnLocationId },
        select: LOCATION_SELECT_FIELDS,
      }),
    ]);

    if (!pickupLocation || !returnLocation) {
      return {
        success: false,
        error: "Les agences de location sont invalides",
      };
    }

    // Vérifier les services
    const serviceIds = Array.from(new Set(data.serviceIds || []));
    const servicesValidation = await validateServices(serviceIds);
    if (!servicesValidation.valid) {
      return {
        success: false,
        error: servicesValidation.error,
      };
    }

    // Vérifier à nouveau les conflits de réservation (race condition)
    const overlapCheck = await checkOverlappingBooking(data.vehicleId, startDate, endDate);
    if (overlapCheck.hasOverlap) {
      return {
        success: false,
        error: "Ce véhicule est déjà réservé pour cette période",
      };
    }

    // Générer la référence
    const reference = await generateBookingReference();

    // Créer la réservation (status: PENDING - en attente de paiement)
    try {
      const created = await prisma.booking.create({
        data: {
          reference,
          userId: user.id,
          vehicleId: data.vehicleId,
          startDate,
          endDate,
          pickupLocationId,
          returnLocationId,
          totalPrice,
          depositPaid: 0, // Acompte pas encore payé (sera payé lors de la confirmation)
          remainingAmount, // Solde à payer à la remise (totalPrice - depositPaid après paiement de l'acompte)
          status: BookingStatus.PENDING,
          serviceIds,
        },
        select: BOOKING_CREATE_SELECT_FIELDS,
      });

      logWorkflowStep({
        step: "ÉTAPE 1",
        bookingId: created.id,
        reference: created.reference,
        data: {
          userId: user.id,
          userEmail: user.email,
          vehicleId: data.vehicleId,
          vehicleBrand: vehicle.brand,
          vehicleModel: vehicle.model,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          totalPrice: `${totalPrice.toFixed(2)}€`,
          depositPaid: "0.00€",
          remainingAmount: `${remainingAmount.toFixed(2)}€`,
          status: "PENDING",
          serviceIds: serviceIds.length > 0 ? serviceIds : "Aucun service",
          pickupLocation: pickupLocation.name,
          returnLocation: returnLocation.name,
          nextStep: "2/4 - EMAIL DE CRÉATION",
        },
      });

      // Envoyer l'email de confirmation
      logWorkflowStep({
        step: "ÉTAPE 2",
        bookingId: created.id,
        reference: created.reference,
        data: {
          recipient: user.email,
          emailType: "Création (statut PENDING)",
          pdfAttachments: "Aucun (réservation non confirmée)",
        },
      });

      const emailResult = await sendBookingEmail({
        to: user.email,
        name: user.name,
        booking: {
          reference: created.reference,
          totalPrice,
          depositPaid: 0,
          remainingAmount,
          startDate,
          endDate,
          status: BookingStatus.PENDING,
        },
        vehicle: {
          label: `${vehicle.brand} ${vehicle.model}`,
          licensePlate: vehicle.licensePlate,
        },
        locations: {
          pickup: pickupLocation.name,
          return: returnLocation.name,
        },
      });

      if (emailResult.skipped) {
        logWorkflowStep({
          step: "ÉTAPE 2",
          bookingId: created.id,
          reference: created.reference,
          data: {
            warning: "Email ignoré (credentials non configurés)",
            reason: "GMAIL_USER ou GMAIL_PASSWORD non configurés dans .env",
          },
        });
      } else if (!emailResult.success) {
        logWorkflowStep({
          step: "ÉTAPE 2",
          bookingId: created.id,
          reference: created.reference,
          data: {
            error: "Échec de l'envoi de l'email",
            recipient: user.email,
            errorMessage: emailResult.error ?? "raison inconnue",
          },
        });
      } else {
        logWorkflowStep({
          step: "ÉTAPE 2",
          bookingId: created.id,
          reference: created.reference,
          data: {
            success: "Email envoyé avec succès",
            recipient: user.email,
            messageId: emailResult.messageId,
            queued: emailResult.queued,
            emailType: "Création (statut PENDING)",
            nextStep: "3/4 - PAIEMENT STRIPE",
          },
        });
      }

      // Invalider le cache
      await Promise.all([
        invalidateBookingsCache().catch((error) => {
          console.error("Error invalidating bookings cache:", error);
        }),
        invalidateVehicleAvailabilityCache(data.vehicleId).catch((error) => {
          console.error("Error invalidating vehicle availability cache:", error);
        }),
      ]);

      // La réservation avec le statut PENDING sera automatiquement visible dans les notifications admin
      logWorkflowStep({
        step: "ÉTAPE 2",
        bookingId: created.id,
        reference: created.reference,
        data: {
          notification: "Notification admin générée automatiquement",
          status: "PENDING",
          note: "Visible dans les notifications admin (navbar + dashboard)",
        },
      });

      logWorkflowStep({
        step: "FIN PHASE 1",
        bookingId: created.id,
        reference: created.reference,
        data: {
          status: "PENDING",
          summary: {
            totalPrice: `${totalPrice.toFixed(2)}€`,
            depositPaid: "0.00€",
            remainingAmount: `${remainingAmount.toFixed(2)}€`,
            emailSent: emailResult.success || emailResult.skipped,
            nextAction: "Paiement Stripe requis pour confirmer",
          },
        },
      });

      return {
        success: true,
        data: {
          bookingId: created.id,
          reference: created.reference,
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
      console.error("[Public Booking] Erreur lors de la création en base", error);
      throw error;
    }
  } catch (error) {
    console.error("[Public Booking] Erreur inattendue lors de la création", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la création de la réservation.",
    };
  }
}

