"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createBookingSchema,
  type CreateBookingInput,
  type CreateBookingPayload,
} from "@/lib/validations/booking";
import {
  BookingStatus,
  MaintenanceStatus,
  MaintenanceType,
  VehicleStatus,
} from "@prisma/client";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { startOfYear, endOfYear } from "date-fns";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type CreateBookingResult =
  | {
      success: true;
      data: {
        id: string;
        reference: string;
      };
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

async function generateBookingReference() {
  const now = new Date();
  const year = now.getFullYear();
  let attempts = 0;

  while (attempts < 5) {
    const start = startOfYear(now);
    const end = endOfYear(now);
    const count = await prisma.booking.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    });

    const reference = `BK-${year}-${String(count + attempts + 1).padStart(4, "0")}`;
    const existing = await prisma.booking.findUnique({
      where: { reference },
      select: { id: true },
    });

    if (!existing) {
      return reference;
    }

    attempts += 1;
  }

  throw new Error("Impossible de générer une référence unique pour la réservation.");
}

export async function createBookingAction(
  input: CreateBookingPayload
): Promise<CreateBookingResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      console.warn("[Bookings] Tentative non autorisée de création de réservation", {
        userId: session.user.id,
      });
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires pour créer une réservation.",
      };
    }

    console.log("[Bookings] Requête de création reçue", {
      adminId: session.user.id,
      userId: input.userId,
      vehicleId: input.vehicleId,
      pickupLocationId: input.pickupLocationId,
      returnLocationId: input.returnLocationId,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status,
      sendConfirmation: input.sendConfirmation ?? false,
    });

    const parsed = createBookingSchema.safeParse(input);

    if (!parsed.success) {
      console.warn("[Bookings] Validation du payload échouée", {
        errors: parsed.error.flatten().fieldErrors,
      });
      return {
        success: false,
        error: "Données invalides",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;

    const [user, vehicle, pickupLocation, returnLocation] = await Promise.all([
      prisma.user.findFirst({
        where: {
          id: data.userId,
          deletedAt: null,
        },
        select: { id: true, name: true, email: true, driverLicense: true },
      }),
      prisma.vehicle.findUnique({
        where: { id: data.vehicleId },
        select: {
          id: true,
          status: true,
          deposit: true,
          brand: true,
          model: true,
          licensePlate: true,
        },
      }),
      prisma.location.findUnique({
        where: { id: data.pickupLocationId },
        select: { id: true, name: true },
      }),
      prisma.location.findUnique({
        where: { id: data.returnLocationId },
        select: { id: true, name: true },
      }),
    ]);

    if (!user) {
      return { success: false, error: "Client introuvable." };
    }

    if (!user.driverLicense) {
      return {
        success: false,
        error:
          "Ce client n'a pas encore de permis de conduire enregistré. Ajoutez le document avant de créer la réservation.",
      };
    }

    if (!vehicle) {
      return { success: false, error: "Véhicule introuvable." };
    }

    if (!pickupLocation || !returnLocation) {
      return { success: false, error: "Les agences sélectionnées sont invalides." };
    }

    const serviceIds = Array.from(new Set(data.serviceIds ?? []));

    if (serviceIds.length > 0) {
      const services = await prisma.service.findMany({
        where: {
          id: { in: serviceIds },
        },
        select: { id: true, active: true },
      });

      if (services.length !== serviceIds.length) {
        return {
          success: false,
          error: "Certains services choisis n'existent pas ou ne sont plus disponibles.",
        };
      }

      const inactive = services.find((service) => !service.active);
      if (inactive) {
        return {
          success: false,
          error: "Un service sélectionné est inactif.",
        };
      }
    }

    if (data.depositPaid > data.totalPrice) {
      return {
        success: false,
        error: "L'acompte ne peut pas dépasser le montant total.",
      };
    }

    const remainingAmount = Math.max(data.totalPrice - data.depositPaid, 0);

    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        vehicleId: data.vehicleId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
        },
        startDate: {
          lt: data.endDate,
        },
        endDate: {
          gt: data.startDate,
        },
      },
      select: {
        reference: true,
        startDate: true,
        endDate: true,
      },
    });

    if (overlappingBooking) {
      return {
        success: false,
        error:
          "Ce véhicule est déjà réservé sur les dates choisies. Vérifiez les réservations existantes avant de continuer.",
      };
    }

    const overlappingMaintenance = await prisma.maintenance.findFirst({
      where: {
        vehicleId: data.vehicleId,
        status: {
          in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
        },
        type: {
          not: MaintenanceType.BLOCKED,
        },
        startDate: {
          lt: data.endDate,
        },
        endDate: {
          gt: data.startDate,
        },
      },
      select: {
        id: true,
      },
    });

    if (overlappingMaintenance) {
      return {
        success: false,
        error:
          "Une maintenance est planifiée pour ce véhicule sur les dates choisies. Merci de vérifier l'agenda de maintenance.",
      };
    }

    const reference = await generateBookingReference();

    console.log("[Bookings] Création en base en cours", {
      reference,
      userId: data.userId,
      vehicleId: data.vehicleId,
    });

    try {
      const created = await prisma.booking.create({
        data: {
          reference,
          userId: data.userId,
          vehicleId: data.vehicleId,
          startDate: data.startDate,
          endDate: data.endDate,
          pickupLocationId: data.pickupLocationId,
          returnLocationId: data.returnLocationId,
          totalPrice: data.totalPrice,
          depositPaid: data.depositPaid,
          remainingAmount,
          status: data.status,
          serviceIds,
          notes: data.notes ?? null,
        },
        select: {
          id: true,
          reference: true,
        },
      });

      if (data.sendConfirmation) {
        const bookingPeriod = `${format(data.startDate, "dd MMMM yyyy 'à' HH:mm", {
          locale: fr,
        })} → ${format(data.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;
        const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";
        const emailResult = await sendBookingConfirmationEmail({
          to: user.email,
          name: user.name,
          greeting,
          booking: {
            reference: created.reference,
            totalPrice: data.totalPrice,
            depositPaid: data.depositPaid,
            remainingAmount,
            startDate: data.startDate,
            endDate: data.endDate,
            status: data.status,
            period: bookingPeriod,
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
          console.warn(
            `[Admin Bookings] ⚠️  Email de confirmation ignoré pour la réservation ${created.reference} (credentials non configurés). Vérifiez GMAIL_USER et GMAIL_PASSWORD dans .env`,
          );
        } else if (!emailResult.success) {
          console.warn(
            "[Admin Bookings] ❌ Échec de l'envoi de l'email de confirmation pour la réservation",
            created.reference,
            emailResult.error ?? "raison inconnue",
          );
        } else {
          console.log("[Admin Bookings] ✅ Email de confirmation envoyé", {
            reference: created.reference,
            messageId: emailResult.messageId,
            queued: emailResult.queued,
          });
        }
      }

      // Ne pas changer automatiquement le statut du véhicule en RESERVED
      // La disponibilité est gérée par les réservations existantes via le filtre de dates
      // Le statut du véhicule (AVAILABLE/MAINTENANCE/UNAVAILABLE) reste indépendant des réservations

      console.log("[Bookings] Réservation créée avec succès", {
        reference: created.reference,
        bookingId: created.id,
      });

      // Invalider le cache des réservations et de disponibilité
      const { invalidateBookingsCache, invalidateVehicleAvailabilityCache } = await import("@/lib/cache-invalidation");
      await Promise.all([
        invalidateBookingsCache().catch((error) => {
          console.error("Error invalidating bookings cache:", error);
        }),
        invalidateVehicleAvailabilityCache(data.vehicleId).catch((error) => {
          console.error("Error invalidating vehicle availability cache:", error);
        }),
      ]);

      return {
        success: true,
        data: created,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        error.meta?.target === "bookings_reference_key"
      ) {
        return {
          success: false,
          error: "Une réservation avec cette référence existe déjà. Veuillez réessayer.",
        };
      }
      console.error("[Bookings] Erreur lors de la création en base", error);
      throw error;
    }
  } catch (error) {
    console.error("[Bookings] Erreur inattendue lors de la création", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la création de la réservation.",
    };
  }
}


