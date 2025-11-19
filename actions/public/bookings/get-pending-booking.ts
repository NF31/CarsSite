"use server";

import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { auth } from "@/auth";

/**
 * Récupère une réservation PENDING existante pour l'utilisateur
 * avec les mêmes critères : dates, véhicule, services, lieux de retrait/retour
 * 
 * Gère deux cas :
 * 1. Utilisateur connecté : utilise session.user.id
 * 2. Utilisateur non connecté : utilise customerEmail pour trouver l'utilisateur
 */
export async function getPendingBookingAction(input: {
  vehicleId: string;
  startDate: string;
  endDate: string;
  serviceIds?: string[];
  pickupLocationId?: string;
  returnLocationId?: string;
  customerEmail?: string; // Pour les utilisateurs non connectés
}) {
  try {
    const session = await auth();
    let userId: string | null = null;

    // Cas 1 : Utilisateur connecté
    if (session?.user?.id) {
      userId = session.user.id;
      console.log("🔍 [getPendingBookingAction - SERVEUR] Utilisateur connecté détecté:", {
        userId: session.user.id,
        email: session.user.email,
      });
    } 
    // Cas 2 : Utilisateur non connecté - trouver l'utilisateur par email
    else if (input.customerEmail) {
      const user = await prisma.user.findUnique({
        where: { email: input.customerEmail },
        select: { id: true, email: true },
      });

      if (user) {
        userId = user.id;
        console.log("🔍 [getPendingBookingAction - SERVEUR] Utilisateur non connecté trouvé par email:", {
          userId: user.id,
          email: user.email,
        });
      } else {
        console.log("🔍 [getPendingBookingAction - SERVEUR] Aucun utilisateur trouvé pour cet email (nouveau client):", {
          email: input.customerEmail,
          message: "Aucune réservation PENDING existante pour ce nouvel utilisateur",
        });
        return {
          success: true,
          booking: null,
        };
      }
    } else {
      return {
        success: false,
        error: "Email requis pour les utilisateurs non connectés",
      };
    }

    if (!userId) {
      return {
        success: false,
        error: "Impossible d'identifier l'utilisateur",
      };
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    // Construire les critères de recherche
    // On compare les dates avec une tolérance de quelques minutes pour les heures
    const startDateMin = new Date(startDate);
    startDateMin.setMinutes(startDateMin.getMinutes() - 5); // Tolérance de 5 minutes
    const startDateMax = new Date(startDate);
    startDateMax.setMinutes(startDateMax.getMinutes() + 5);

    const endDateMin = new Date(endDate);
    endDateMin.setMinutes(endDateMin.getMinutes() - 5);
    const endDateMax = new Date(endDate);
    endDateMax.setMinutes(endDateMax.getMinutes() + 5);

    const whereClause: any = {
      userId: userId, // Utilise userId trouvé (connecté ou non connecté)
      vehicleId: input.vehicleId,
      status: BookingStatus.PENDING,
      startDate: {
        gte: startDateMin,
        lte: startDateMax,
      },
      endDate: {
        gte: endDateMin,
        lte: endDateMax,
      },
    };

    // Note: La vérification exacte des services se fera après la requête
    // car Prisma ne permet pas facilement de vérifier une correspondance exacte d'array
    // On va d'abord chercher avec les autres critères, puis vérifier les services manuellement

    // Vérifier les lieux de retrait si fourni
    if (input.pickupLocationId) {
      whereClause.pickupLocationId = input.pickupLocationId;
    }

    // Vérifier les lieux de retour si fourni
    if (input.returnLocationId) {
      whereClause.returnLocationId = input.returnLocationId;
    }

    console.log("🔍 [getPendingBookingAction - SERVEUR] Critères de recherche:", {
      userId: userId,
      customerEmail: input.customerEmail || "N/A (utilisateur connecté)",
      vehicleId: input.vehicleId,
      status: BookingStatus.PENDING,
      startDate: input.startDate,
      endDate: input.endDate,
      serviceIds: input.serviceIds || [],
      pickupLocationId: input.pickupLocationId,
      returnLocationId: input.returnLocationId,
      whereClause: JSON.stringify(whereClause, null, 2),
    });

    const existingBooking = await prisma.booking.findFirst({
      where: whereClause,
      select: {
        id: true,
        reference: true,
        status: true,
        startDate: true,
        endDate: true,
        serviceIds: true,
        pickupLocationId: true,
        returnLocationId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc", // Prendre la plus récente
      },
    });

    if (existingBooking) {
      // Vérifier que tous les critères correspondent exactement
      const inputServiceIds = (input.serviceIds || []).sort();
      const bookingServiceIds = existingBooking.serviceIds.sort();
      const servicesMatch = 
        inputServiceIds.length === bookingServiceIds.length &&
        inputServiceIds.every((id, index) => id === bookingServiceIds[index]);
      
      const pickupMatch = !input.pickupLocationId || existingBooking.pickupLocationId === input.pickupLocationId;
      const returnMatch = !input.returnLocationId || existingBooking.returnLocationId === input.returnLocationId;

      // Si tous les critères ne correspondent pas, ne pas retourner cette réservation
      if (!servicesMatch || !pickupMatch || !returnMatch) {
        console.log("⚠️ [getPendingBookingAction - SERVEUR] Réservation PENDING trouvée mais critères ne correspondent pas exactement:", {
          bookingId: existingBooking.id,
          reference: existingBooking.reference,
          verification: {
            servicesMatch,
            pickupMatch,
            returnMatch,
            allMatch: false,
          },
          details: {
            inputServiceIds,
            bookingServiceIds,
            inputPickupLocationId: input.pickupLocationId,
            bookingPickupLocationId: existingBooking.pickupLocationId,
            inputReturnLocationId: input.returnLocationId,
            bookingReturnLocationId: existingBooking.returnLocationId,
          },
          message: "Réservation trouvée mais critères ne correspondent pas, recherche d'une autre réservation...",
        });
        return {
          success: true,
          booking: null,
        };
      }

      console.log("✅ [getPendingBookingAction - SERVEUR] Réservation PENDING trouvée dans la DB avec TOUS les critères correspondants:", {
        bookingId: existingBooking.id,
        reference: existingBooking.reference,
        status: existingBooking.status,
        vehicleId: input.vehicleId,
        startDate: existingBooking.startDate.toISOString(),
        endDate: existingBooking.endDate.toISOString(),
        serviceIds: existingBooking.serviceIds,
        pickupLocationId: existingBooking.pickupLocationId,
        returnLocationId: existingBooking.returnLocationId,
        userId: session.user.id,
        verification: {
          servicesMatch,
          pickupMatch,
          returnMatch,
          allMatch: servicesMatch && pickupMatch && returnMatch,
        },
        message: "Réservation avec statut PENDING et tous les critères correspondants trouvée, elle sera utilisée au lieu d'en créer une nouvelle",
      });

      return {
        success: true,
        booking: existingBooking,
      };
    }

    console.log("❌ [getPendingBookingAction - SERVEUR] Aucune réservation PENDING trouvée dans la DB avec tous les critères:", {
      vehicleId: input.vehicleId,
      startDate: input.startDate,
      endDate: input.endDate,
      serviceIds: input.serviceIds || [],
      pickupLocationId: input.pickupLocationId,
      returnLocationId: input.returnLocationId,
      userId: userId,
      customerEmail: input.customerEmail || "N/A (utilisateur connecté)",
      statusRecherche: BookingStatus.PENDING,
      criteresVerifies: [
        "userId",
        "vehicleId",
        "status: PENDING",
        "startDate (avec tolérance ±5min)",
        "endDate (avec tolérance ±5min)",
        input.serviceIds ? "serviceIds (exact match)" : "serviceIds (vide)",
        input.pickupLocationId ? "pickupLocationId" : null,
        input.returnLocationId ? "returnLocationId" : null,
      ].filter(Boolean),
      message: "Aucune réservation avec statut PENDING et tous les critères correspondants trouvée, une nouvelle réservation sera créée",
    });

    return {
      success: true,
      booking: null,
    };
  } catch (error) {
    console.error("[getPendingBookingAction] Erreur:", error);
    return {
      success: false,
      error: "Impossible de vérifier les réservations existantes",
    };
  }
}

