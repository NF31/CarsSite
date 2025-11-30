import { prisma } from "@/lib/prisma";
import type { BookingWithPayments } from "../types";

/**
 * Utilitaires de validation pour les remboursements
 */

/**
 * Valide le montant du remboursement
 */
export function validateRefundAmount(amount: number): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return {
      valid: false,
      error: "Le montant du remboursement doit être supérieur à zéro.",
    };
  }
  return { valid: true };
}

/**
 * Récupère la réservation avec ses paiements
 */
export async function getBookingWithPayments(
  bookingId: string
): Promise<{ valid: boolean; booking?: BookingWithPayments; error?: string }> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      reference: true,
      depositPaid: true,
      originalDepositPaid: true,
      payments: {
        where: {
          method: "STRIPE",
          status: {
            in: ["COMPLETED", "PENDING"],
          },
          amount: {
            gt: 0,
          },
        },
        select: {
          id: true,
          transactionId: true,
          amount: true,
          status: true,
          method: true,
          metadata: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!booking) {
    return {
      valid: false,
      error: "Réservation introuvable.",
    };
  }

  if (booking.payments.length === 0) {
    // Chercher tous les paiements pour diagnostic
    const allPayments = await prisma.payment.findMany({
      where: { bookingId },
      select: {
        id: true,
        amount: true,
        status: true,
        method: true,
        transactionId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const errorMessage =
      allPayments.length > 0
        ? `Aucun paiement trouvé pour cette réservation. Paiements trouvés: ${allPayments.length} (statuts: ${allPayments.map((p) => p.status).join(", ")})`
        : "Aucun paiement enregistré dans la base de données.";

    return {
      valid: false,
      error: errorMessage,
    };
  }

  return {
    valid: true,
    booking: booking as BookingWithPayments,
  };
}

