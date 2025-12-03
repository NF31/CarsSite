import type {
  BookingUserOption,
  BookingVehicleOption,
  BookingLocationOption,
  BookingServiceOption,
  GetBookingOptionsParams,
} from "./types";
import { getBookingOptionsData } from "./get-data";
import { mapUser, mapVehicle, mapLocation, mapService } from "./map-options";
import {
  getIncludedUsers,
  getIncludedServices,
  getIncludedLocations,
} from "./get-included-items";
import {
  sortUserOptions,
  sortServiceOptions,
  sortLocationOptions,
} from "./sort-options";

export interface BookingOptionsData {
  users: BookingUserOption[];
  vehicles: BookingVehicleOption[];
  locations: BookingLocationOption[];
  services: BookingServiceOption[];
}

/**
 * Construit toutes les options de réservation
 */
export async function buildBookingOptions(
  params: GetBookingOptionsParams
): Promise<BookingOptionsData> {
  // Récupérer les données de base
  const { users, vehicles, locations, services } = await getBookingOptionsData();

  // Mapper les données
  const userOptions: BookingUserOption[] = users.map(mapUser);
  const vehicleOptions: BookingVehicleOption[] = vehicles.map(mapVehicle);
  const locationOptions: BookingLocationOption[] = locations.map(mapLocation);
  const serviceOptions: BookingServiceOption[] = services.map(mapService);

  // Normaliser les IDs à inclure
  const includeUserIds = Array.from(new Set(params.includeUserIds ?? [])).filter(Boolean);
  const includeServiceIds = Array.from(new Set(params.includeServiceIds ?? [])).filter(Boolean);
  const includeLocationIds = Array.from(new Set(params.includeLocationIds ?? [])).filter(Boolean);

  // Récupérer les éléments manquants
  if (includeUserIds.length > 0) {
    const existingUserIds = new Set(userOptions.map((user) => user.id));
    const extraUsers = await getIncludedUsers(includeUserIds, existingUserIds);
    userOptions.push(...extraUsers);
  }

  if (includeServiceIds.length > 0) {
    const existingServiceIds = new Set(serviceOptions.map((service) => service.id));
    const extraServices = await getIncludedServices(includeServiceIds, existingServiceIds);
    serviceOptions.push(...extraServices);
  }

  if (includeLocationIds.length > 0) {
    const existingLocationIds = new Set(locationOptions.map((location) => location.id));
    const extraLocations = await getIncludedLocations(includeLocationIds, existingLocationIds);
    locationOptions.push(...extraLocations);
  }

  // Trier les options
  sortUserOptions(userOptions);
  sortServiceOptions(serviceOptions);
  sortLocationOptions(locationOptions);

  return {
    users: userOptions,
    vehicles: vehicleOptions,
    locations: locationOptions,
    services: serviceOptions,
  };
}

