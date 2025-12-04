import prisma from '@/lib/prisma'
import type {
  BookingUserOption,
  BookingServiceOption,
  BookingLocationOption,
} from "./types";
import { mapUser, mapService, mapLocation } from "./map-options";
import { USER_SELECT, SERVICE_SELECT, LOCATION_SELECT } from "./get-selects";

/**
 * Récupère les utilisateurs manquants et les ajoute à la liste
 */
export async function getIncludedUsers(
  includeUserIds: string[],
  existingUserIds: Set<string>
): Promise<BookingUserOption[]> {
  const missingUserIds = includeUserIds.filter((userId) => !existingUserIds.has(userId));

  if (missingUserIds.length === 0) {
    return [];
  }

  const extraUsers = await prisma.user.findMany({
    where: {
      id: {
        in: missingUserIds,
      },
    },
    select: USER_SELECT,
  });

  return extraUsers.map(mapUser);
}

/**
 * Récupère les services manquants et les ajoute à la liste
 */
export async function getIncludedServices(
  includeServiceIds: string[],
  existingServiceIds: Set<string>
): Promise<BookingServiceOption[]> {
  const missingServiceIds = includeServiceIds.filter(
    (serviceId) => !existingServiceIds.has(serviceId)
  );

  if (missingServiceIds.length === 0) {
    return [];
  }

  const extraServices = await prisma.service.findMany({
    where: {
      id: {
        in: missingServiceIds,
      },
    },
    select: SERVICE_SELECT,
  });

  return extraServices.map(mapService);
}

/**
 * Récupère les agences manquantes et les ajoute à la liste
 */
export async function getIncludedLocations(
  includeLocationIds: string[],
  existingLocationIds: Set<string>
): Promise<BookingLocationOption[]> {
  const missingLocationIds = includeLocationIds.filter(
    (locationId) => !existingLocationIds.has(locationId)
  );

  if (missingLocationIds.length === 0) {
    return [];
  }

  const extraLocations = await prisma.location.findMany({
    where: {
      id: {
        in: missingLocationIds,
      },
    },
    select: LOCATION_SELECT,
  });

  return extraLocations.map(mapLocation);
}

