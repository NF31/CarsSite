"use server";

import { prisma } from "@/lib/prisma";
import { BookingStatus, MaintenanceStatus, MaintenanceType, UserRole } from "@prisma/client";
import { z } from "zod";
import { startOfYear, endOfYear } from "date-fns";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { calculateBookingPriceAction } from "./calculate-price";
import { checkVehicleAvailabilityAction } from "./check-availability";
import { invalidateBookingsCache, invalidateVehicleAvailabilityCache } from "@/lib/cache-invalidation";

const createPublicBookingSchema = z.object({
  vehicleId: z.string().min(1, "Véhicule requis"),
  startDate: z
    .string()
    .min(1, "Date de début requise")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date invalide")
    .transform((value) => new Date(value)),
  endDate: z
    .string()
    .min(1, "Date de fin requise")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date invalide")
    .transform((value) => new Date(value)),
  startTime: z.string().min(1, "Heure de début requise"),
  endTime: z.string().min(1, "Heure de fin requise"),
  pickup: z.string().min(1, "Lieu de retrait requis"),
  returnLocation: z.string().min(1, "Lieu de retour requis"),
  pickupPlaceId: z.string().optional(),
  returnPlaceId: z.string().optional(),
  serviceIds: z.array(z.string()).optional().default([]),
  customerName: z.string().min(1, "Nom requis"),
  customerEmail: z.string().email("Email invalide"),
  customerPhone: z.string().min(1, "Téléphone requis"),
  driverLicenseUrl: z.string().url("URL du permis invalide").optional(),
  acceptedTerms: z.boolean().refine((value) => value === true, "Vous devez accepter les CGV"),
});

export type CreatePublicBookingInput = z.infer<typeof createPublicBookingSchema>;

export interface CreatePublicBookingResult {
  success: boolean;
  data?: {
    bookingId: string;
    reference: string;
  };
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

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

/**
 * Crée ou trouve un utilisateur par email
 */
async function findOrCreateUser(
  email: string,
  name: string,
  phone: string,
  driverLicenseUrl?: string
): Promise<{ id: string; email: string; name: string }> {
  // Chercher un utilisateur existant
  let user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      driverLicense: true,
    },
  });

  if (user) {
    // Utilisateur existant : mettre à jour le permis si fourni
    if (driverLicenseUrl && driverLicenseUrl !== user.driverLicense) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          driverLicense: driverLicenseUrl,
          name: name || user.name,
          phone: phone || undefined,
        },
      });
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  // Créer un nouvel utilisateur
  const rawPassword = crypto.randomBytes(16).toString("hex");
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      role: UserRole.CLIENT,
      emailVerified: null,
      driverLicense: driverLicenseUrl || null,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  // TODO: Envoyer un email d'invitation au client pour créer un mot de passe

  return newUser;
}

/**
 * Trouve ou crée une location à partir d'un place_id
 * Pour l'instant, utilise la location du véhicule comme location par défaut
 */
async function findOrCreateLocation(
  vehicleLocationId: string,
  placeId?: string,
  address?: string
): Promise<string> {
  // Pour l'instant, utiliser la location du véhicule
  // TODO: Implémenter la logique pour trouver/créer une location à partir d'un place_id
  return vehicleLocationId;
}

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
    const [startHours, startMinutes] = data.startTime.split(":").map(Number);
    const [endHours, endMinutes] = data.endTime.split(":").map(Number);

    const startDate = new Date(data.startDate);
    startDate.setHours(
      !isNaN(startHours) ? startHours : 0,
      !isNaN(startMinutes) ? startMinutes : 0,
      0,
      0
    );

    const endDate = new Date(data.endDate);
    endDate.setHours(
      !isNaN(endHours) ? endHours : 0,
      !isNaN(endMinutes) ? endMinutes : 0,
      0,
      0
    );

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
      select: {
        id: true,
        brand: true,
        model: true,
        licensePlate: true,
        locationId: true,
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!vehicle) {
      return {
        success: false,
        error: "Véhicule introuvable",
      };
    }

    // Calculer le prix
    const priceResult = await calculateBookingPriceAction({
      vehicleId: data.vehicleId,
      startDate: data.startDate,
      endDate: data.endDate,
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
    const remainingAmount = totalPrice - downPayment;

    // Créer ou trouver l'utilisateur
    const user = await findOrCreateUser(
      data.customerEmail,
      data.customerName,
      data.customerPhone,
      data.driverLicenseUrl
    );

    // Mettre à jour la date d'acceptation des CGV si l'utilisateur accepte
    // (seulement si pas déjà accepté)
    if (data.acceptedTerms) {
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { termsAcceptedAt: true },
      });

      // Enregistrer la date d'acceptation seulement si pas déjà accepté
      if (!existingUser?.termsAcceptedAt) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            termsAcceptedAt: new Date(),
          },
        });
      }
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
        select: { id: true, name: true },
      }),
      prisma.location.findUnique({
        where: { id: returnLocationId },
        select: { id: true, name: true },
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
          error: "Certains services choisis n'existent pas ou ne sont plus disponibles",
        };
      }

      const inactive = services.find((service) => !service.active);
      if (inactive) {
        return {
          success: false,
          error: "Un service sélectionné est inactif",
        };
      }
    }

    // Vérifier à nouveau les conflits de réservation (race condition)
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        vehicleId: data.vehicleId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
        },
        startDate: {
          lt: endDate,
        },
        endDate: {
          gt: startDate,
        },
      },
      select: {
        reference: true,
      },
    });

    if (overlappingBooking) {
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
          remainingAmount: totalPrice, // Solde à payer à la remise (totalPrice - depositPaid après paiement de l'acompte)
          status: BookingStatus.PENDING,
          serviceIds,
        },
        select: {
          id: true,
          reference: true,
        },
      });

      // Envoyer l'email de confirmation
      const bookingPeriod = `${format(startDate, "dd MMMM yyyy 'à' HH:mm", {
        locale: fr,
      })} → ${format(endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;
      const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";

      const emailResult = await sendBookingConfirmationEmail({
        to: user.email,
        name: user.name,
        greeting,
        booking: {
          reference: created.reference,
          totalPrice,
          depositPaid: 0,
          remainingAmount: totalPrice,
          startDate,
          endDate,
          status: BookingStatus.PENDING,
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
          `[Public Booking] ⚠️  Email de confirmation ignoré pour la réservation ${created.reference} (credentials non configurés). Vérifiez GMAIL_USER et GMAIL_PASSWORD dans .env`,
        );
      } else if (!emailResult.success) {
        console.warn(
          "[Public Booking] ❌ Échec de l'envoi de l'email de confirmation pour la réservation",
          created.reference,
          emailResult.error ?? "raison inconnue",
        );
      } else {
        console.log("[Public Booking] ✅ Email de confirmation envoyé", {
          reference: created.reference,
          messageId: emailResult.messageId,
          queued: emailResult.queued,
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
      // via getAdminNotificationData() qui récupère toutes les réservations avec status PENDING
      console.log("[Public Booking] Réservation créée - Notification admin générée automatiquement", {
        reference: created.reference,
        status: "PENDING",
        note: "Visible dans les notifications admin (navbar + dashboard)",
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
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        error.meta?.target === "bookings_reference_key"
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

