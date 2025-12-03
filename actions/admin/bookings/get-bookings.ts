"use server";

import type {
  GetBookingsFilters,
  GetBookingsResult,
} from "./get-bookings/types";
import { buildWhereClause } from "./get-bookings/build-where-clause";
import { buildOrderBy } from "./get-bookings/build-order-by";
import {
  calculatePagination,
  buildPaginationResponse,
} from "./get-bookings/calculate-pagination";
import { getBookingsData } from "./get-bookings/get-bookings-data";
import { mapBookings } from "./get-bookings/map-bookings";

// Ré-exporter les types pour compatibilité
export type {
  GetBookingsFilters,
  BookingListItem,
  GetBookingsResult,
} from "./get-bookings/types";

export async function getBookingsAction(
  filters: GetBookingsFilters = {}
): Promise<GetBookingsResult> {
  try {
    const currentDate = new Date();

    // Calculer la pagination
    const { page, limit, skip } = calculatePagination({
      page: filters.page,
      limit: filters.limit,
    });

    // Construire la clause WHERE
    const where = buildWhereClause(filters, currentDate);

    // Construire l'ORDER BY
    const orderBy = buildOrderBy(filters.sortBy, filters.sortOrder);

    // Récupérer les réservations et le total
    const { bookings, total } = await getBookingsData({
      where,
      orderBy,
      skip,
      take: limit,
    });

    // Mapper les réservations vers le format de réponse
    const bookingsMapped = mapBookings(bookings, currentDate);

    return {
      success: true,
      data: {
        bookings: bookingsMapped,
        pagination: buildPaginationResponse(total, page, limit),
      },
    };
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des réservations",
    };
  }
}


