"use server";

import prisma from '@/lib/prisma'
import { InvoiceStatus } from "@/lib/types/invoice-status";
import { generateInvoicePDF } from "@/lib/invoice-pdf";
import { uploadPDF, getSignedDownloadUrl } from "@/lib/cloudinary";
import { createDefaultAdminSettings } from "@/actions/admin/settings/shared";

interface GenerateInvoicePDFResult {
  success: boolean;
  data?: {
    pdfUrl: string;
    pdfBuffer?: Buffer; // Ajouter le buffer PDF pour éviter de le télécharger depuis Cloudinary
  };
  error?: string;
}

export async function generateInvoicePDFAction(
  invoiceId: string
): Promise<GenerateInvoicePDFResult> {
  try {
    // Récupérer la facture avec toutes les données nécessaires
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        booking: {
          select: {
            reference: true,
            startDate: true,
            endDate: true,
            totalPrice: true,
            depositPaid: true,
            serviceIds: true,
            vehicle: {
              select: {
                id: true,
                brand: true,
                model: true,
                licensePlate: true,
                pricePerDay: true,
              },
            },
            pickupLocation: {
              select: {
                name: true,
                city: true,
                address: true,
              },
            },
            returnLocation: {
              select: {
                name: true,
                city: true,
                address: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!invoice) {
      return {
        success: false,
        error: "Facture introuvable",
      };
    }

    // Récupérer les paramètres de l'agence
    const agencySettings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "agency.name",
            "agency.address",
            "agency.phone",
            "agency.email",
          ],
        },
      },
    });

    const defaultSettings = createDefaultAdminSettings();
    const settingsMap = new Map(agencySettings.map((s) => [s.key, s.value]));

    const agencyName = settingsMap.get("agency.name");
    const agencyAddress = settingsMap.get("agency.address");
    const agencyPhone = settingsMap.get("agency.phone");
    const agencyEmail = settingsMap.get("agency.email");

    const agency = {
      name: typeof agencyName === "string" ? agencyName : (defaultSettings.agency.name || "CarRental"),
      address: typeof agencyAddress === "string" ? agencyAddress : (defaultSettings.agency.address || "123 Avenue de la Liberté, 75000 Paris"),
      phone: typeof agencyPhone === "string" ? agencyPhone : (defaultSettings.agency.phone || "+33 1 23 45 67 89"),
      email: typeof agencyEmail === "string" ? agencyEmail : (defaultSettings.agency.email || "contact@carrental.com"),
    };

    // Récupérer les services de la réservation
    const services = invoice.booking.serviceIds && invoice.booking.serviceIds.length > 0
      ? await prisma.service.findMany({
          where: {
            id: { in: invoice.booking.serviceIds },
          },
          select: {
            name: true,
            price: true,
          },
        })
      : [];

    // Générer le PDF
    const pdfBuffer = await generateInvoicePDF({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      booking: {
        reference: invoice.booking.reference,
        startDate: invoice.booking.startDate,
        endDate: invoice.booking.endDate,
        totalPrice: invoice.booking.totalPrice,
        depositPaid: invoice.booking.depositPaid || 0,
        vehicle: {
          brand: invoice.booking.vehicle.brand,
          model: invoice.booking.vehicle.model,
          licensePlate: invoice.booking.vehicle.licensePlate,
          pricePerDay: invoice.booking.vehicle.pricePerDay,
        },
        pickupLocation: {
          name: invoice.booking.pickupLocation.name,
          city: invoice.booking.pickupLocation.city,
          address: invoice.booking.pickupLocation.address,
        },
        returnLocation: {
          name: invoice.booking.returnLocation.name,
          city: invoice.booking.returnLocation.city,
          address: invoice.booking.returnLocation.address,
        },
        services: services.map((s) => ({
          name: s.name,
          price: s.price,
        })),
      },
      user: {
        name: invoice.user.name,
        email: invoice.user.email,
        phone: invoice.user.phone,
      },
      agency,
    });

    // Récupérer l'ID du véhicule et de l'utilisateur pour organiser dans vehicles/{vehicleId}/invoices/{userId}
    const vehicleId = invoice.booking.vehicle.id;
    const userId = invoice.userId;

    // Upload directement le buffer vers Cloudinary en mode privé
    try {
      const uploadResult = await uploadPDF(
        pdfBuffer, 
        `invoice-${invoice.invoiceNumber}`,
        vehicleId,
        userId
      );

      // Cloudinary retourne le public_id avec le dossier complet
      // Le public_id devrait déjà inclure "vehicles/{vehicleId}/invoices/{userId}/" 
      let publicIdForSigning = uploadResult.public_id;
      
      // S'assurer que le public_id contient le bon chemin
      // Si le public_id ne contient pas le chemin complet, le reconstruire
      if (!publicIdForSigning.includes("vehicles/")) {
        publicIdForSigning = `vehicles/${vehicleId}/invoices/${userId}/${uploadResult.public_id}`;
      }

      // Stocker l'URL privée dans la base de données et mettre à jour le statut
      // Une fois le PDF généré et uploadé, la facture passe de DRAFT à SENT
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          pdfUrl: uploadResult.secure_url, // Stocker l'URL (contiendra /private/)
          status: invoice.status === InvoiceStatus.DRAFT ? InvoiceStatus.SENT : invoice.status, // Passer de DRAFT à SENT si c'est un brouillon
        },
      });

      // Générer une URL signée pour le retour (valide 1 heure)
      // Utiliser le public_id avec le dossier complet
      const signedUrl = getSignedDownloadUrl(publicIdForSigning, uploadResult.format, 3600);

      return {
        success: true,
        data: {
          pdfUrl: signedUrl, // Retourner l'URL signée
          pdfBuffer: pdfBuffer, // Retourner aussi le buffer PDF pour éviter de le télécharger depuis Cloudinary
        },
      };
    } catch (uploadError) {
      console.error("Erreur lors de l'upload du PDF:", uploadError);
      throw uploadError;
    }
  } catch (error) {
    console.error("Error generating invoice PDF:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      invoiceId,
    });
    
    // Retourner un message d'erreur plus détaillé
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorWithCode = error instanceof Error && 'code' in error ? error as Error & { code?: string; path?: string } : null;
    const errorDetails = errorWithCode 
      ? `Code: ${errorWithCode.code || 'N/A'}, Path: ${errorWithCode.path || 'N/A'}`
      : undefined;
    
    return {
      success: false,
      error: `Erreur lors de la génération du PDF de la facture: ${errorMessage}${errorDetails ? `. ${errorDetails}` : ''}`,
    };
  }
}

