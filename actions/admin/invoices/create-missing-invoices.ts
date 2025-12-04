"use server";

import prisma from '@/lib/prisma'
import { createInvoiceForBooking } from "@/lib/invoice-creation";

export interface CreateMissingInvoicesResult {
  success: boolean;
  created?: number;
  errors?: number;
  details?: Array<{
    bookingReference: string;
    success: boolean;
    error?: string;
  }>;
  error?: string;
}

/**
 * Crée les factures manquantes pour toutes les réservations confirmées sans facture
 */
export async function createMissingInvoicesAction(): Promise<CreateMissingInvoicesResult> {
  try {
    // Trouver toutes les réservations confirmées sans facture
    const confirmedBookingsWithoutInvoices = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        invoices: {
          none: {}, // Aucune facture liée
        },
      },
      select: {
        id: true,
        reference: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (confirmedBookingsWithoutInvoices.length === 0) {
      return {
        success: true,
        created: 0,
        errors: 0,
        details: [],
      };
    }

    const details: Array<{
      bookingReference: string;
      success: boolean;
      error?: string;
    }> = [];

    let createdCount = 0;
    let errorCount = 0;

    for (const booking of confirmedBookingsWithoutInvoices) {
      try {
        const result = await createInvoiceForBooking(booking.id);
        
        if (result.success) {
          createdCount++;
          details.push({
            bookingReference: booking.reference,
            success: true,
          });
        } else {
          errorCount++;
          details.push({
            bookingReference: booking.reference,
            success: false,
            error: result.error || "Erreur inconnue",
          });
        }
      } catch (error) {
        errorCount++;
        details.push({
          bookingReference: booking.reference,
          success: false,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    return {
      success: true,
      created: createdCount,
      errors: errorCount,
      details,
    };
  } catch (error) {
    console.error("Error creating missing invoices:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

