import { invalidateCacheByPrefix, CACHE_PREFIXES } from "./cache";

/**
 * Invalide le cache des véhicules
 * À appeler après création, mise à jour ou suppression d'un véhicule
 */
export async function invalidateVehiclesCache(): Promise<void> {
  await invalidateCacheByPrefix(CACHE_PREFIXES.VEHICLES_LIST);
  await invalidateCacheByPrefix(CACHE_PREFIXES.VEHICLE);
}

/**
 * Invalide le cache d'un véhicule spécifique
 */
export async function invalidateVehicleCache(vehicleId: string): Promise<void> {
  const { deleteCache, CACHE_PREFIXES } = await import("./cache");
  await deleteCache(vehicleId, CACHE_PREFIXES.VEHICLE);
  // Invalider aussi les listes car elles peuvent contenir ce véhicule
  await invalidateVehiclesCache();
}

/**
 * Invalide le cache des locations
 * À appeler après création, mise à jour ou suppression d'une location
 */
export async function invalidateLocationsCache(): Promise<void> {
  await invalidateCacheByPrefix(CACHE_PREFIXES.LOCATIONS_LIST);
  await invalidateCacheByPrefix(CACHE_PREFIXES.LOCATION);
}

/**
 * Invalide le cache d'une location spécifique
 */
export async function invalidateLocationCache(locationId: string): Promise<void> {
  const { deleteCache, CACHE_PREFIXES } = await import("./cache");
  await deleteCache(locationId, CACHE_PREFIXES.LOCATION);
  // Invalider aussi les listes car elles peuvent contenir cette location
  await invalidateLocationsCache();
}

/**
 * Invalide le cache des réservations
 * À appeler après création, mise à jour ou suppression d'une réservation
 */
export async function invalidateBookingsCache(): Promise<void> {
  await invalidateCacheByPrefix(CACHE_PREFIXES.BOOKING);
  await invalidateCacheByPrefix(CACHE_PREFIXES.BOOKING_OPTIONS);
}

/**
 * Invalide le cache d'une réservation spécifique
 */
export async function invalidateBookingCache(bookingId: string): Promise<void> {
  const { deleteCache, CACHE_PREFIXES } = await import("./cache");
  await deleteCache(bookingId, CACHE_PREFIXES.BOOKING);
  // Invalider aussi les options car elles peuvent être utilisées
  await invalidateCacheByPrefix(CACHE_PREFIXES.BOOKING_OPTIONS);
}

/**
 * Invalide le cache des settings
 * À appeler après mise à jour des settings
 */
export async function invalidateSettingsCache(): Promise<void> {
  await invalidateCacheByPrefix(CACHE_PREFIXES.SETTINGS);
}

/**
 * Invalide le cache des services
 * À appeler après création, mise à jour ou suppression d'un service
 */
export async function invalidateServicesCache(): Promise<void> {
  await invalidateCacheByPrefix(CACHE_PREFIXES.SERVICE);
  // Invalider aussi les options de réservation car elles incluent les services
  await invalidateCacheByPrefix(CACHE_PREFIXES.BOOKING_OPTIONS);
}

/**
 * Invalide le cache de disponibilité d'un véhicule
 * À appeler après création/modification d'une réservation ou maintenance
 */
export async function invalidateVehicleAvailabilityCache(vehicleId: string): Promise<void> {
  // Invalider toutes les clés de disponibilité pour ce véhicule (toutes les dates)
  const { deleteCacheByPrefix } = await import("./cache");
  await deleteCacheByPrefix(`vehicle:availability:${vehicleId}`);
}

