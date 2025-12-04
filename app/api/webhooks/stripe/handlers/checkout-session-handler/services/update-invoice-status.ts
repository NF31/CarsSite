import prisma from "@/lib/prisma";
import { updateInvoiceStatusAfterPayment } from "@/lib/invoice-status-update";

export async function updateInvoiceStatus(
  bookingId: string,
  sessionId: string,
  paymentAmount: number
) {
  try {
    const payment = await prisma.payment.findFirst({
      where: { transactionId: sessionId },
    });
    if (payment) {
      await updateInvoiceStatusAfterPayment(bookingId, payment.id, paymentAmount);
    }
  } catch {
    // Ne pas bloquer le webhook
  }
}


