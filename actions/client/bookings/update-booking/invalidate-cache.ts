import { revalidatePath } from "next/cache";

/**
 * Invalide les caches liés aux réservations
 */
export async function invalidateBookingCaches(bookingId: string): Promise<void> {
  revalidatePath("/dashboard");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/statistics");
  revalidatePath("/admin/invoices");

  // Invalider le cache des réservations
  const { invalidateBookingCache } = await import("@/lib/cache-invalidation");
  await invalidateBookingCache(bookingId).catch((error) => {
    console.error("Error invalidating booking cache:", error);
  });
}

