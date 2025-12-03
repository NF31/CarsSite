"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getOrSetCache,
  CACHE_PREFIXES,
  CACHE_TTL,
} from "@/lib/cache";
import type {
  GetBookingOptionsParams,
  GetBookingOptionsResult,
} from "./get-options/types";
import { getCacheKey } from "./get-options/get-cache-key";
import { buildBookingOptions } from "./get-options/build-options";

// Ré-exporter les types pour compatibilité
export type {
  BookingUserOption,
  BookingVehicleOption,
  BookingLocationOption,
  BookingServiceOption,
  GetBookingOptionsResult,
  GetBookingOptionsParams,
} from "./get-options/types";

export async function getBookingOptionsAction(
  params: GetBookingOptionsParams = {}
): Promise<GetBookingOptionsResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires pour créer une réservation.",
      };
    }

    // Générer une clé de cache basée sur les paramètres
    const cacheKey = getCacheKey(params);

    // Utiliser le cache Redis pour les options de réservation
    const data = await getOrSetCache(
      cacheKey,
      async () => buildBookingOptions(params),
      {
        prefix: CACHE_PREFIXES.BOOKING_OPTIONS,
        ttl: CACHE_TTL.BOOKING_OPTIONS,
      }
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Booking options error:", error);
    return {
      success: false,
      error: "Impossible de charger les données nécessaires à la création d'une réservation.",
    };
  }
}



