import { PaymentStatus } from "@/lib/types/payment-status";
import { prisma } from "@/lib/prisma";

interface CreatePaymentRecordParams {
  bookingId: string;
  userId: string;
  paymentAmount: number;
  paymentStatus: PaymentStatus;
  sessionId: string;
  paymentMetadata: {
    stripeSessionId: string;
    stripePaymentIntentId?: string;
    paymentType: string;
    isModificationPayment: boolean;
    downPayment: number;
    securityDeposit: number;
    amountPaid: number;
  };
}

export async function createPaymentRecord({
  bookingId,
  userId,
  paymentAmount,
  paymentStatus,
  sessionId,
  paymentMetadata,
}: CreatePaymentRecordParams) {
  const existingPayment = await prisma.payment.findFirst({
    where: { transactionId: sessionId },
  });

  if (!existingPayment) {
    await prisma.payment.create({
      data: {
        bookingId,
        userId,
        amount: paymentAmount,
        method: "STRIPE",
        status: paymentStatus,
        transactionId: sessionId,
        metadata: paymentMetadata,
      },
    });
  }
}


