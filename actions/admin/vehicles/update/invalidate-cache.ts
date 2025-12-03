export async function invalidateVehicleCache(vehicleId: string): Promise<void> {
  const { invalidateVehicleCache } = await import("@/lib/cache-invalidation");
  await invalidateVehicleCache(vehicleId).catch((error) => {
    console.error("Error invalidating vehicle cache:", error);
    // Ne pas faire échouer la mise à jour si l'invalidation échoue
  });
}

