/**
 * Invalide les caches liés à une réservation et à un véhicule
 */
export async function invalidateBookingCaches(
  bookingId: string,
  vehicleId: string
): Promise<void> {
  const { invalidateBookingCache, invalidateVehicleAvailabilityCache } =
    await import("@/lib/cache-invalidation");

  await Promise.all([
    invalidateBookingCache(bookingId).catch((error) => {
      console.error("Error invalidating booking cache:", error);
    }),
    invalidateVehicleAvailabilityCache(vehicleId).catch((error) => {
      console.error("Error invalidating vehicle availability cache:", error);
    }),
  ]);
}

