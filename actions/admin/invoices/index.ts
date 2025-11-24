"use server";

import { prisma } from "@/lib/prisma";
import { generateInvoicePDFAction } from "./generate-pdf";
import { getInvoicesAction } from "./get-invoices";

// Re-exports pour éviter les erreurs "use server"
// Note: Dans Next.js 16, les re-exports fonctionnent si on importe d'abord la fonction
export { generateInvoicePDFAction, getInvoicesAction };
export type {
  InvoiceListItem,
  InvoiceClientItem,
  InvoicesSummary,
  GetInvoicesResult,
} from "./get-invoices";

interface DownloadInvoiceResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface SendInvoiceResult {
  success: boolean;
  error?: string;
}

/**
 * Télécharge ou génère et télécharge une facture PDF
 */
export async function downloadInvoiceAction(
  invoiceId: string
): Promise<DownloadInvoiceResult> {
  try {
    // Vérifier si la facture existe
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        pdfUrl: true,
        invoiceNumber: true,
      },
    });

    if (!invoice) {
      return {
        success: false,
        error: "Facture introuvable",
      };
    }

    // Si le PDF existe déjà, utiliser la route API qui gère correctement
    // les différents formats de public_id et génère les URLs signées appropriées
    // La route API /api/invoices/[id]/pdf essaie plusieurs méthodes pour télécharger le PDF
    if (invoice.pdfUrl) {
      return {
        success: true,
        url: `/api/invoices/${invoiceId}/pdf`,
      };
    }

    // Sinon, générer le PDF
    const generateResult = await generateInvoicePDFAction(invoiceId);

    if (!generateResult.success || !generateResult.data) {
      return {
        success: false,
        error: generateResult.error || "Erreur lors de la génération du PDF",
      };
    }

    // Le résultat contient déjà une URL signée
    return {
      success: true,
      url: generateResult.data.pdfUrl,
    };
  } catch (error) {
    console.error("Error downloading invoice:", error);
    return {
      success: false,
      error: "Erreur lors du téléchargement de la facture",
    };
  }
}

/**
 * Envoie une facture par email (placeholder pour l'instant)
 */
export async function sendInvoiceAction(
  invoiceId: string
): Promise<SendInvoiceResult> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        pdfUrl: true,
      },
    });

    if (!invoice) {
      return {
        success: false,
        error: "Facture introuvable",
      };
    }

    // Générer le PDF s'il n'existe pas
    if (!invoice.pdfUrl) {
      const generateResult = await generateInvoicePDFAction(invoiceId);
      if (!generateResult.success) {
        return {
          success: false,
          error: generateResult.error || "Erreur lors de la génération du PDF",
        };
      }
    }

    // TODO: Implémenter l'envoi par email
    // Pour l'instant, on met juste à jour le statut
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "SENT",
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error sending invoice:", error);
    return {
      success: false,
      error: "Erreur lors de l'envoi de la facture",
    };
  }
}

