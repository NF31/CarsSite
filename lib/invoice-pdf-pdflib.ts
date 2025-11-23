import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { InvoiceStatus } from "@prisma/client";

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus; // Gardé pour compatibilité, mais non affiché sur le PDF
  issuedAt: Date;
  dueDate: Date;
  booking: {
    reference: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    vehicle: {
      brand: string;
      model: string;
      licensePlate: string;
    };
    pickupLocation: {
      name: string;
      city: string;
      address: string | null;
    };
    returnLocation: {
      name: string;
      city: string;
      address: string | null;
    };
  };
  user: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  agency?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  // Créer un nouveau document PDF
  const pdfDoc = await PDFDocument.create();

  // Définir les métadonnées
  pdfDoc.setTitle(`Facture ${invoiceData.invoiceNumber}`);
  pdfDoc.setAuthor(invoiceData.agency?.name || "CarRental");
  pdfDoc.setSubject(`Facture pour réservation ${invoiceData.booking.reference}`);
  pdfDoc.setCreator("CarRental");

  // Charger les polices standard (intégrées, pas besoin de fichiers externes)
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Couleurs de la charte graphique
  const primaryColor = rgb(59 / 255, 130 / 255, 246 / 255); // #3B82F6 - Bleu primaire
  const secondaryColor = rgb(16 / 255, 185 / 255, 129 / 255); // #10B981 - Vert secondaire
  const neutralDark = rgb(31 / 255, 41 / 255, 55 / 255); // #1F2937 - Gris foncé
  const neutralMedium = rgb(107 / 255, 114 / 255, 128 / 255); // #6B7280 - Gris moyen
  const neutralLight = rgb(229 / 255, 231 / 255, 235 / 255); // #E5E7EB - Gris clair
  const primaryLight = rgb(239 / 255, 246 / 255, 255 / 255); // #EFF6FF - Bleu très clair

  // Créer une page A4 (595.28 x 841.89 points)
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Header avec bande colorée (couleur primaire)
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: primaryColor,
  });

  let yPosition = height - 50;

  // Header avec informations de l'agence (texte blanc sur fond bleu)
  page.drawText(invoiceData.agency?.name || "CarRental", {
    x: 50,
    y: yPosition,
    size: 22,
    font: helveticaBoldFont,
    color: rgb(1, 1, 1), // Blanc
  });

  yPosition -= 25;
  page.drawText(invoiceData.agency?.address || "123 Avenue de la Liberté, 75000 Paris", {
    x: 50,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: rgb(0.95, 0.95, 0.95), // Blanc cassé
  });

  yPosition -= 15;
  page.drawText(
    `Téléphone: ${invoiceData.agency?.phone || "+33 1 23 45 67 89"} | Email: ${invoiceData.agency?.email || "contact@carrental.com"}`,
    {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: rgb(0.95, 0.95, 0.95), // Blanc cassé
    }
  );

  // Titre FACTURE (aligné à droite, blanc sur fond bleu)
  const factureText = "FACTURE";
  const factureWidth = helveticaBoldFont.widthOfTextAtSize(factureText, 28);
  page.drawText(factureText, {
    x: width - 50 - factureWidth,
    y: height - 60,
    size: 28,
    font: helveticaBoldFont,
    color: rgb(1, 1, 1), // Blanc
  });

  const invoiceNumberText = `N° ${invoiceData.invoiceNumber}`;
  const invoiceNumberWidth = helveticaFont.widthOfTextAtSize(invoiceNumberText, 11);
  page.drawText(invoiceNumberText, {
    x: width - 50 - invoiceNumberWidth,
    y: height - 85,
    size: 11,
    font: helveticaFont,
    color: rgb(0.9, 0.9, 0.9), // Blanc cassé
  });

  // Informations client (après le header coloré)
  yPosition = height - 130;
  
  // Section client avec fond léger
  page.drawRectangle({
    x: 50,
    y: yPosition - 80,
    width: 250,
    height: 80,
    color: primaryLight,
    borderColor: primaryColor,
    borderWidth: 1,
  });

  page.drawText("Facturé à:", {
    x: 60,
    y: yPosition - 20,
    size: 11,
    font: helveticaBoldFont,
    color: primaryColor,
  });

  yPosition -= 35;
  page.drawText(invoiceData.user.name, {
    x: 60,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });

  if (invoiceData.user.email) {
    yPosition -= 15;
    page.drawText(invoiceData.user.email, {
      x: 60,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: neutralMedium,
    });
  }

  if (invoiceData.user.phone) {
    yPosition -= 15;
    page.drawText(invoiceData.user.phone, {
      x: 60,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: neutralMedium,
    });
  }

  // Informations de facturation (alignées à droite, dans une box)
  yPosition = height - 130;
  
  page.drawRectangle({
    x: width - 250 - 50,
    y: yPosition - 80,
    width: 250,
    height: 80,
    color: primaryLight,
    borderColor: primaryColor,
    borderWidth: 1,
  });
  const dateEmissionText = `Date d'émission: ${formatDate(invoiceData.issuedAt)}`;
  const dateEmissionWidth = helveticaFont.widthOfTextAtSize(dateEmissionText, 10);
  page.drawText(dateEmissionText, {
    x: width - 50 - dateEmissionWidth,
    y: yPosition - 20,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });

  yPosition -= 15;
  const dateEcheanceText = `Date d'échéance: ${formatDate(invoiceData.dueDate)}`;
  const dateEcheanceWidth = helveticaFont.widthOfTextAtSize(dateEcheanceText, 10);
  page.drawText(dateEcheanceText, {
    x: width - 50 - dateEcheanceWidth,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });

  // Note: Le statut n'est pas affiché sur le PDF car :
  // - Il peut être obsolète (le PDF est statique)
  // - Il peut être trompeur (ex: facture "DRAFT" sur un document officiel)
  // - Le statut peut être consulté dans l'interface web
  // - Le statut n'est pas mis à jour automatiquement lors des paiements

  // Ligne de séparation colorée
  yPosition = height - 230;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 2,
    color: primaryColor,
  });

  // Détails de la réservation avec titre coloré
  yPosition -= 30;
  
  // Titre de section avec fond coloré
  const sectionTitleWidth = helveticaBoldFont.widthOfTextAtSize("Détails de la réservation", 13);
  page.drawRectangle({
    x: 50,
    y: yPosition - 15,
    width: sectionTitleWidth + 20,
    height: 20,
    color: primaryColor,
  });
  
  page.drawText("Détails de la réservation", {
    x: 60,
    y: yPosition - 10,
    size: 13,
    font: helveticaBoldFont,
    color: rgb(1, 1, 1), // Blanc
  });

  yPosition -= 35;
  
  // Fond léger pour les détails
  page.drawRectangle({
    x: 50,
    y: yPosition - 90,
    width: width - 100,
    height: 90,
    color: neutralLight,
    borderColor: primaryColor,
    borderWidth: 1,
  });
  
  page.drawText(`Référence: ${invoiceData.booking.reference}`, {
    x: 60,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });

  yPosition -= 15;
  page.drawText(
    `Véhicule: ${invoiceData.booking.vehicle.brand} ${invoiceData.booking.vehicle.model} (${invoiceData.booking.vehicle.licensePlate})`,
    {
      x: 60,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: neutralDark,
    }
  );

  yPosition -= 15;
  page.drawText(
    `Période: Du ${formatDate(invoiceData.booking.startDate)} au ${formatDate(invoiceData.booking.endDate)}`,
    {
      x: 60,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: neutralDark,
    }
  );

  yPosition -= 15;
  page.drawText(
    `Lieu de prise en charge: ${invoiceData.booking.pickupLocation.name}, ${invoiceData.booking.pickupLocation.city}`,
    {
      x: 60,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: neutralDark,
    }
  );

  yPosition -= 15;
  page.drawText(
    `Lieu de retour: ${invoiceData.booking.returnLocation.name}, ${invoiceData.booking.returnLocation.city}`,
    {
      x: 60,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: neutralDark,
    }
  );

  // Ligne de séparation colorée
  yPosition -= 30;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 2,
    color: primaryColor,
  });

  // Récapitulatif des montants avec titre coloré
  yPosition -= 30;
  
  const recapTitleWidth = helveticaBoldFont.widthOfTextAtSize("Récapitulatif des montants", 13);
  page.drawRectangle({
    x: 50,
    y: yPosition - 15,
    width: recapTitleWidth + 20,
    height: 20,
    color: secondaryColor, // Vert pour le récapitulatif
  });
  
  page.drawText("Récapitulatif des montants", {
    x: 60,
    y: yPosition - 10,
    size: 13,
    font: helveticaBoldFont,
    color: rgb(1, 1, 1), // Blanc
  });

  yPosition -= 35;
  
  // Box pour le récapitulatif
  page.drawRectangle({
    x: 50,
    y: yPosition - 70,
    width: width - 100,
    height: 70,
    color: neutralLight,
    borderColor: secondaryColor,
    borderWidth: 2,
  });
  
  const subtotalText = `Sous-total:`;
  page.drawText(subtotalText, {
    x: 60,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });
  const subtotalValueText = formatCurrency(invoiceData.subtotal);
  const subtotalValueWidth = helveticaFont.widthOfTextAtSize(subtotalValueText, 10);
  page.drawText(subtotalValueText, {
    x: width - 60 - subtotalValueWidth,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });

  yPosition -= 20;
  const taxText = `TVA (20%):`;
  page.drawText(taxText, {
    x: 60,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });
  const taxValueText = formatCurrency(invoiceData.tax);
  const taxValueWidth = helveticaFont.widthOfTextAtSize(taxValueText, 10);
  page.drawText(taxValueText, {
    x: width - 60 - taxValueWidth,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });

  // Ligne de séparation avant le total
  yPosition -= 10;
  page.drawLine({
    start: { x: 60, y: yPosition },
    end: { x: width - 60, y: yPosition },
    thickness: 1,
    color: secondaryColor,
  });

  yPosition -= 15;
  const totalText = `Total:`;
  page.drawText(totalText, {
    x: 60,
    y: yPosition,
    size: 14,
    font: helveticaBoldFont,
    color: secondaryColor, // Vert pour le total
  });
  const totalValueText = formatCurrency(invoiceData.total);
  const totalValueWidth = helveticaBoldFont.widthOfTextAtSize(totalValueText, 14);
  page.drawText(totalValueText, {
    x: width - 60 - totalValueWidth,
    y: yPosition,
    size: 14,
    font: helveticaBoldFont,
    color: secondaryColor, // Vert pour le total
  });

  // Footer avec ligne de séparation
  yPosition = 80;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: neutralLight,
  });
  
  const footerText = `Facture générée par ${invoiceData.agency?.name || "CarRental"}. Tous droits réservés.`;
  const footerWidth = helveticaFont.widthOfTextAtSize(footerText, 8);
  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: 60,
    size: 8,
    font: helveticaFont,
    color: neutralMedium,
  });

  // Générer le PDF en Buffer
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}


