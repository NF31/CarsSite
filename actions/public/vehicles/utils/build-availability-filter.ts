import type { Prisma } from "@prisma/client";
import { buildDateTime } from "./build-date-time";

/**
 * Construit le filtre de disponibilité basé sur les dates et heures
 */
export function buildAvailabilityFilter(
  startDate?: string,
  endDate?: string,
  startTime?: string,
  endTime?: string
): Prisma.VehicleWhereInput["NOT"] | undefined {
  if (!startDate || !endDate || !startTime || !endTime) {
    return undefined;
  }

  const start = buildDateTime(startDate, startTime);
  const end = buildDateTime(endDate, endTime);

  if (!start || !end) {
    return undefined;
  }

  // Exclure les véhicules qui ont des réservations ou maintenances qui se chevauchent
  // Logique de chevauchement : startDate < end ET endDate > start
  return {
    OR: [
      // Véhicules avec des réservations confirmées/en cours/pending qui se chevauchent
      {
        bookings: {
          some: {
            status: {
              in: ["CONFIRMED", "IN_PROGRESS", "PENDING"],
            },
            startDate: {
              lt: end, // La réservation commence avant la fin de la recherche
            },
            endDate: {
              gt: start, // La réservation se termine après le début de la recherche
            },
          },
        },
      },
      // Véhicules avec des maintenances bloquées qui se chevauchent
      {
        maintenances: {
          some: {
            status: {
              in: ["SCHEDULED", "IN_PROGRESS"],
            },
            type: "BLOCKED",
            startDate: {
              lt: end, // La maintenance commence avant la fin de la recherche
            },
            endDate: {
              gt: start, // La maintenance se termine après le début de la recherche
            },
          },
        },
      },
    ],
  };
}

