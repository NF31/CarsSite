"use server";

import { auth } from "@/auth";
import prisma from '@/lib/prisma'
import { downloadInvoiceAction } from "@/actions/admin/invoices";
import { generateInvoicePDFAction } from "@/actions/admin/invoices/generate-pdf";

interface DownloadClientInvoiceResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Génère un PDF de facture pour un client (vérifie que c'est bien sa facture)
 */
export async function generateClientInvoicePDFAction(
  invoiceId: string
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: "Non authentifié",
      };
    }

    // Vérifier que la facture appartient à l'utilisateur connecté
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!invoice) {
      return {
        success: false,
        error: "Facture introuvable",
      };
    }

    if (invoice.userId !== session.user.id) {
      return {
        success: false,
        error: "Vous n'avez pas accès à cette facture",
      };
    }

    // Utiliser l'action admin (qui est déjà sécurisée côté serveur)
    return await generateInvoicePDFAction(invoiceId);
  } catch (error) {
    console.error("Error generating client invoice PDF:", error);
    return {
      success: false,
      error: "Erreur lors de la génération du PDF de la facture",
    };
  }
}

/**
 * Télécharge une facture PDF pour un client (vérifie que c'est bien sa facture)
 */
export async function downloadClientInvoiceAction(
  invoiceId: string
): Promise<DownloadClientInvoiceResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: "Non authentifié",
      };
    }

    // Vérifier que la facture appartient à l'utilisateur connecté
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!invoice) {
      return {
        success: false,
        error: "Facture introuvable",
      };
    }

    if (invoice.userId !== session.user.id) {
      return {
        success: false,
        error: "Vous n'avez pas accès à cette facture",
      };
    }

    // Utiliser l'action admin (qui est déjà sécurisée côté serveur)
    return await downloadInvoiceAction(invoiceId);
  } catch (error) {
    console.error("Error downloading client invoice:", error);
    return {
      success: false,
      error: "Erreur lors du téléchargement de la facture",
    };
  }
}

