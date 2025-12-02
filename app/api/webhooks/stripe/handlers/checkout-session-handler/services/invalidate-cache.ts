export async function invalidateCache(bookingId: string, vehicleId: string) {
  try {
    const { invalidateBookingCache, invalidateVehicleAvailabilityCache } =
      await import("@/lib/cache-invalidation");
    const { revalidatePath } = await import("next/cache");

    await Promise.all([
      invalidateBookingCache(bookingId).catch(() => {}),
      invalidateVehicleAvailabilityCache(vehicleId).catch(() => {}),
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${bookingId}`);
    revalidatePath("/admin/dashboard");
  } catch {
    // Ne pas bloquer le webhook
  }
}


