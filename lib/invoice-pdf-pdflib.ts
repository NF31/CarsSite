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
    depositPaid?: number; // Acompte déjà payé
    vehicle: {
      brand: string;
      model: string;
      licensePlate: string;
      pricePerDay: number;
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
    services?: Array<{
      name: string;
      price: number;
    }>;
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

/**
 * Nettoie une chaîne de caractères en remplaçant les caractères Unicode non supportés
 * par WinAnsi (notamment l'espace insécable fin 0x202f) par des caractères ASCII équivalents
 */
function sanitizeText(text: string): string {
  if (!text) return "";
  return String(text)
    .replace(/\u202F/g, " ") // Espace insécable fin → espace normal
    .replace(/\u00A0/g, " ") // Espace insécable → espace normal
    .replace(/\u2009/g, " ") // Espace fine → espace normal
    .replace(/\u2006/g, " ") // Espace six-per-em → espace normal
    .normalize("NFKD") // Normaliser les caractères Unicode
    .replace(/[\u0300-\u036F]/g, ""); // Supprimer les diacritiques combinés
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
  page.drawText(sanitizeText(invoiceData.agency?.name || "CarRental"), {
    x: 50,
    y: yPosition,
    size: 22,
    font: helveticaBoldFont,
    color: rgb(1, 1, 1), // Blanc
  });

  yPosition -= 25;
  page.drawText(sanitizeText(invoiceData.agency?.address || "123 Avenue de la Liberte, 75000 Paris"), {
    x: 50,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: rgb(0.95, 0.95, 0.95), // Blanc cassé
  });

  yPosition -= 15;
  page.drawText(
    sanitizeText(`Telephone: ${invoiceData.agency?.phone || "+33 1 23 45 67 89"} | Email: ${invoiceData.agency?.email || "contact@carrental.com"}`),
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
  page.drawText(sanitizeText(invoiceData.user.name), {
    x: 60,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });

  if (invoiceData.user.email) {
    yPosition -= 15;
    page.drawText(sanitizeText(invoiceData.user.email), {
      x: 60,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: neutralMedium,
    });
  }

  if (invoiceData.user.phone) {
    yPosition -= 15;
    page.drawText(sanitizeText(invoiceData.user.phone), {
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
  const dateEmissionText = sanitizeText(`Date d'emission: ${formatDate(invoiceData.issuedAt)}`);
  const dateEmissionWidth = helveticaFont.widthOfTextAtSize(dateEmissionText, 10);
  page.drawText(dateEmissionText, {
    x: width - 50 - dateEmissionWidth,
    y: yPosition - 20,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });

  yPosition -= 15;
  const dateEcheanceText = sanitizeText(`Date d'echeance: ${formatDate(invoiceData.dueDate)}`);
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
  
  page.drawText(sanitizeText(`Reference: ${invoiceData.booking.reference}`), {
    x: 60,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });

  yPosition -= 15;
  page.drawText(
    sanitizeText(`Vehicule: ${invoiceData.booking.vehicle.brand} ${invoiceData.booking.vehicle.model} (${invoiceData.booking.vehicle.licensePlate})`),
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
    sanitizeText(`Periode: Du ${formatDate(invoiceData.booking.startDate)} au ${formatDate(invoiceData.booking.endDate)}`),
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
    sanitizeText(`Lieu de prise en charge: ${invoiceData.booking.pickupLocation.name}, ${invoiceData.booking.pickupLocation.city}`),
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
    sanitizeText(`Lieu de retour: ${invoiceData.booking.returnLocation.name}, ${invoiceData.booking.returnLocation.city}`),
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

  // Calculer le nombre de jours
  const days = Math.ceil(
    (invoiceData.booking.endDate.getTime() - invoiceData.booking.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const vehiclePrice = invoiceData.booking.vehicle.pricePerDay * days;

  // Calculer la hauteur nécessaire pour la box (ajouter de l'espace pour l'acompte si présent)
  const servicesCount = invoiceData.booking.services?.length || 0;
  const hasDeposit = invoiceData.booking.depositPaid && invoiceData.booking.depositPaid > 0;
  const depositHeight = hasDeposit ? 60 : 0; // Espace pour acompte payé + solde restant
  const boxHeight = 70 + (servicesCount > 0 ? servicesCount * 15 : 0) + 20 + depositHeight; // Base + services + ligne véhicule + acompte

  yPosition -= 35;
  
  // Box pour le récapitulatif
  page.drawRectangle({
    x: 50,
    y: yPosition - boxHeight,
    width: width - 100,
    height: boxHeight,
    color: neutralLight,
    borderColor: secondaryColor,
    borderWidth: 2,
  });

  // Ligne véhicule
  const vehicleLineText = sanitizeText(`Location véhicule (${days} jour${days > 1 ? "s" : ""} × ${formatCurrency(invoiceData.booking.vehicle.pricePerDay)}):`);
  page.drawText(vehicleLineText, {
    x: 60,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });
  const vehicleValueText = formatCurrency(vehiclePrice);
  const vehicleValueWidth = helveticaFont.widthOfTextAtSize(vehicleValueText, 10);
  page.drawText(vehicleValueText, {
    x: width - 60 - vehicleValueWidth,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });

  yPosition -= 20;

  // Services additionnels
  if (invoiceData.booking.services && invoiceData.booking.services.length > 0) {
    for (const service of invoiceData.booking.services) {
      const serviceText = sanitizeText(`• ${service.name}:`);
      page.drawText(serviceText, {
        x: 60,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: neutralDark,
      });
      const serviceValueText = formatCurrency(service.price);
      const serviceValueWidth = helveticaFont.widthOfTextAtSize(serviceValueText, 10);
      page.drawText(serviceValueText, {
        x: width - 60 - serviceValueWidth,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: neutralDark,
      });
      yPosition -= 15;
    }
  }
  
  // Ligne de séparation avant le sous-total
  yPosition -= 5;
  page.drawLine({
    start: { x: 60, y: yPosition },
    end: { x: width - 60, y: yPosition },
    thickness: 1,
    color: secondaryColor,
  });

  yPosition -= 15;
  const subtotalText = sanitizeText(`Sous-total:`);
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
  const taxText = sanitizeText(`TVA (20%):`);
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
  const totalText = sanitizeText(`Total:`);
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

  // Afficher l'acompte payé et le solde restant si un acompte a été payé
  if (invoiceData.booking.depositPaid && invoiceData.booking.depositPaid > 0) {
    yPosition -= 20;
    page.drawLine({
      start: { x: 60, y: yPosition },
      end: { x: width - 60, y: yPosition },
      thickness: 1,
      color: secondaryColor,
    });

    yPosition -= 15;
    const depositPaidText = sanitizeText(`Acompte paye:`);
    page.drawText(depositPaidText, {
      x: 60,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: neutralDark,
    });
    const depositPaidValueText = formatCurrency(invoiceData.booking.depositPaid);
    const depositPaidValueWidth = helveticaFont.widthOfTextAtSize(depositPaidValueText, 11);
    page.drawText(depositPaidValueText, {
      x: width - 60 - depositPaidValueWidth,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: secondaryColor,
    });

    const remainingBalance = invoiceData.total - invoiceData.booking.depositPaid;
    if (remainingBalance > 0) {
      yPosition -= 18;
      const remainingText = sanitizeText(`Solde restant:`);
      page.drawText(remainingText, {
        x: 60,
        y: yPosition,
        size: 12,
        font: helveticaBoldFont,
        color: primaryColor,
      });
      const remainingValueText = formatCurrency(remainingBalance);
      const remainingValueWidth = helveticaBoldFont.widthOfTextAtSize(remainingValueText, 12);
      page.drawText(remainingValueText, {
        x: width - 60 - remainingValueWidth,
        y: yPosition,
        size: 12,
        font: helveticaBoldFont,
        color: primaryColor,
      });
    }
  }

  // Footer avec ligne de séparation
  yPosition = 80;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: neutralLight,
  });
  
  const footerText = sanitizeText(`Facture generee par ${invoiceData.agency?.name || "CarRental"}. Tous droits reserves.`);
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
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  // Nettoyer le texte pour supprimer les caractères Unicode non supportés
  return sanitizeText(formatted);
}

function formatCurrency(amount: number): string {
  // Utiliser une locale qui n'introduit pas d'espaces insécables
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    // Forcer un espace normal comme séparateur de milliers
    useGrouping: true,
  }).format(amount);
  // Nettoyer le texte pour supprimer les caractères Unicode non supportés (0x202f)
  return sanitizeText(formatted);
}


