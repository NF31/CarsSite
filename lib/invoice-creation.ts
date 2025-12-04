import prisma from "@/lib/prisma";
import { InvoiceStatus } from "@/lib/types/invoice-status";
import { addDays } from "date-fns";

/**
 * Génère un numéro de facture unique au format INV-YYYY-NNN
 * Exemple: INV-2024-001, INV-2024-002, etc.
 */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Trouver le dernier numéro de facture pour cette année
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: "desc",
    },
    select: {
      invoiceNumber: true,
    },
  });

  let nextNumber = 1;

  if (lastInvoice) {
    // Extraire le numéro de la dernière facture (ex: "001" depuis "INV-2024-001")
    const match = lastInvoice.invoiceNumber.match(/-(\d+)$/);
    if (match) {
      const lastNumber = parseInt(match[1], 10);
      nextNumber = lastNumber + 1;
    }
  }

  // Formater le numéro avec des zéros devant (ex: 001, 002, 999)
  const formattedNumber = String(nextNumber).padStart(3, "0");
  return `${prefix}${formattedNumber}`;
}

/**
 * Crée automatiquement une facture pour une réservation confirmée
 */
export async function createInvoiceForBooking(bookingId: string): Promise<{
  success: boolean;
  invoiceId?: string;
  error?: string;
}> {
  try {
    // Vérifier si une facture existe déjà pour cette réservation
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        bookingId,
      },
      select: {
        id: true,
        invoiceNumber: true,
      },
    });

    if (existingInvoice) {
      console.log(`[Invoice Creation] ✅ Facture déjà existante pour la réservation ${bookingId}: ${existingInvoice.invoiceNumber}`);
      return {
        success: true,
        invoiceId: existingInvoice.id,
      };
    }

    // Récupérer les informations de la réservation
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return {
        success: false,
        error: "Réservation introuvable",
      };
    }

    // Vérifier que la réservation est confirmée
    if (booking.status !== "CONFIRMED") {
      console.log(`[Invoice Creation] ⚠️  Réservation ${bookingId} n'est pas confirmée (statut: ${booking.status}), facture non créée`);
      return {
        success: false,
        error: "La réservation doit être confirmée pour créer une facture",
      };
    }

    // Générer le numéro de facture
    const invoiceNumber = await generateInvoiceNumber();

    // Calculer les montants
    const subtotal = booking.totalPrice;
    const tax = 0; // Pas de TVA pour l'instant (peut être configuré plus tard)
    const total = subtotal + tax;

    // Date d'échéance : 30 jours après la date d'émission
    const dueDate = addDays(new Date(), 30);

    // Créer la facture
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        bookingId: booking.id,
        userId: booking.userId,
        subtotal,
        tax,
        total,
        status: InvoiceStatus.DRAFT, // DRAFT par défaut, sera changé à SENT quand le PDF sera généré
        dueDate,
      },
      select: {
        id: true,
        invoiceNumber: true,
      },
    });

    console.log(`[Invoice Creation] ✅ Facture créée automatiquement pour la réservation ${bookingId}`, {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      total: total.toFixed(2),
      dueDate: dueDate.toISOString(),
    });

    return {
      success: true,
      invoiceId: invoice.id,
    };
  } catch (error) {
    console.error(`[Invoice Creation] ❌ Erreur lors de la création de la facture pour la réservation ${bookingId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue lors de la création de la facture",
    };
  }
}

