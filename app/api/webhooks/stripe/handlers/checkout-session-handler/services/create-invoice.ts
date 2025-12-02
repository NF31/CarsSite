export async function createInvoiceForBooking(bookingId: string) {
  try {
    const { createInvoiceForBooking } = await import("@/lib/invoice-creation");
    await createInvoiceForBooking(bookingId);
  } catch {
    // Ne pas bloquer le webhook
  }
}


