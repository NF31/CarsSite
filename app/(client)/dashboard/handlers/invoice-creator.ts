import { prisma } from "@/lib/prisma";

/**
 * Handler pour la création automatique des factures manquantes
 */

/**
 * Crée automatiquement les factures manquantes pour les réservations confirmées
 */
export async function createMissingInvoices(userId: string): Promise<void> {
  try {
    const { createInvoiceForBooking } = await import("@/lib/invoice-creation");
    const confirmedBookingsWithoutInvoices = await prisma.booking.findMany({
      where: {
        userId,
        status: "CONFIRMED",
        invoices: {
          none: {},
        },
      },
      select: {
        id: true,
      },
    });

    if (confirmedBookingsWithoutInvoices.length > 0) {
      await Promise.all(
        confirmedBookingsWithoutInvoices.map((booking) =>
          createInvoiceForBooking(booking.id).catch(() => {
            // Ignorer les erreurs individuelles
          })
        )
      );
    }
  } catch {
    // Ignorer les erreurs pour ne pas bloquer le chargement du dashboard
  }
}

