import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { BookingStatus } from "@/lib/types/booking-status";

export interface BookingPDFData {
  reference: string;
  status: BookingStatus;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  depositPaid: number;
  remainingAmount: number;
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
    .replace(/\u2192/g, "->") // Flèche droite Unicode → ASCII
    .normalize("NFKD") // Normaliser les caractères Unicode
    .replace(/[\u0300-\u036F]/g, ""); // Supprimer les diacritiques combinés
}

export async function generateBookingPDF(bookingData: BookingPDFData): Promise<Buffer> {
  // Créer un nouveau document PDF
  const pdfDoc = await PDFDocument.create();

  // Définir les métadonnées
  pdfDoc.setTitle(`Réservation ${bookingData.reference}`);
  pdfDoc.setAuthor(bookingData.agency?.name || "CarRental");
  pdfDoc.setSubject(`Confirmation de réservation ${bookingData.reference}`);
  pdfDoc.setCreator("CarRental");

  // Charger les polices standard
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Couleurs de la charte graphique
  const primaryColor = rgb(59 / 255, 130 / 255, 246 / 255); // #3B82F6 - Bleu primaire
  const secondaryColor = rgb(16 / 255, 185 / 255, 129 / 255); // #10B981 - Vert secondaire
  const neutralDark = rgb(31 / 255, 41 / 255, 55 / 255); // #1F2937 - Gris foncé
  const neutralMedium = rgb(107 / 255, 114 / 255, 128 / 255); // #6B7280 - Gris moyen
  const neutralLight = rgb(229 / 255, 231 / 255, 235 / 255); // #E5E7EB - Gris clair
  const white = rgb(1, 1, 1);

  // Créer une page A4
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

  // Titre "CONFIRMATION DE RÉSERVATION" dans le header
  const titleText = "CONFIRMATION DE RÉSERVATION";
  const titleWidth = helveticaBoldFont.widthOfTextAtSize(titleText, 24);
  page.drawText(titleText, {
    x: width - 50 - titleWidth,
    y: height - 70,
    size: 24,
    font: helveticaBoldFont,
    color: white,
  });

  // Nom de l'agence dans le header
  page.drawText(sanitizeText(bookingData.agency?.name || "CarRental"), {
    x: 50,
    y: height - 70,
    size: 20,
    font: helveticaBoldFont,
    color: white,
  });

  let yPosition = height - 130;

  // Section: Informations client
  page.drawText(sanitizeText("Réservé pour :"), {
    x: 50,
    y: yPosition,
    size: 12,
    font: helveticaBoldFont,
    color: neutralDark,
  });
  yPosition -= 20;
  page.drawText(sanitizeText(bookingData.user.name), {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaFont,
    color: neutralDark,
  });
  yPosition -= 15;
  if (bookingData.user.email) {
    page.drawText(sanitizeText(bookingData.user.email), {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: neutralMedium,
    });
    yPosition -= 15;
  }
  if (bookingData.user.phone) {
    page.drawText(sanitizeText(bookingData.user.phone), {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: neutralMedium,
    });
    yPosition -= 25;
  }

  // Section: Référence et dates
  yPosition -= 20;
  page.drawText(sanitizeText("Référence de réservation :"), {
    x: 50,
    y: yPosition,
    size: 12,
    font: helveticaBoldFont,
    color: neutralDark,
  });
  yPosition -= 18;
  page.drawText(sanitizeText(bookingData.reference), {
    x: 50,
    y: yPosition,
    size: 16,
    font: helveticaBoldFont,
    color: primaryColor,
  });
  yPosition -= 30;

  // Section: Période
  page.drawText(sanitizeText("Période :"), {
    x: 50,
    y: yPosition,
    size: 12,
    font: helveticaBoldFont,
    color: neutralDark,
  });
  yPosition -= 20;
  const periodText = `${formatDate(bookingData.startDate)} -> ${formatDate(bookingData.endDate)}`;
  page.drawText(sanitizeText(periodText), {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: neutralDark,
  });
  yPosition -= 30;

  // Section: Véhicule
  page.drawText(sanitizeText("Véhicule :"), {
    x: 50,
    y: yPosition,
    size: 12,
    font: helveticaBoldFont,
    color: neutralDark,
  });
  yPosition -= 20;
  const vehicleText = `${bookingData.vehicle.brand} ${bookingData.vehicle.model} (${bookingData.vehicle.licensePlate})`;
  page.drawText(sanitizeText(vehicleText), {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: neutralDark,
  });
  yPosition -= 30;

  // Section: Lieux
  page.drawText(sanitizeText("Lieux :"), {
    x: 50,
    y: yPosition,
    size: 12,
    font: helveticaBoldFont,
    color: neutralDark,
  });
  yPosition -= 18;
  page.drawText(sanitizeText(`Retrait : ${bookingData.pickupLocation.name} - ${bookingData.pickupLocation.city}`), {
    x: 50,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });
  yPosition -= 15;
  page.drawText(sanitizeText(`Retour : ${bookingData.returnLocation.name} - ${bookingData.returnLocation.city}`), {
    x: 50,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });
  yPosition -= 30;

  // Section: Services (si présents)
  if (bookingData.services && bookingData.services.length > 0) {
    page.drawText(sanitizeText("Services additionnels :"), {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaBoldFont,
      color: neutralDark,
    });
    yPosition -= 18;
    for (const service of bookingData.services) {
      page.drawText(sanitizeText(`• ${service.name} - ${formatCurrency(service.price)}`), {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: neutralDark,
      });
      yPosition -= 15;
    }
    yPosition -= 15;
  }

  // Section: Récapitulatif financier
  yPosition -= 20;
  page.drawText(sanitizeText("Récapitulatif financier :"), {
    x: 50,
    y: yPosition,
    size: 12,
    font: helveticaBoldFont,
    color: neutralDark,
  });
  yPosition -= 25;

  // Box pour le récapitulatif
  const boxY = yPosition - 80;
  page.drawRectangle({
    x: 45,
    y: boxY,
    width: width - 90,
    height: 80,
    borderColor: neutralLight,
    borderWidth: 1,
    color: rgb(249 / 255, 250 / 255, 251 / 255), // Fond gris très clair
  });

  const boxTextY = boxY + 55;
  let boxYPos = boxTextY;

  // Montant total
  page.drawText(sanitizeText("Montant total :"), {
    x: 55,
    y: boxYPos,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });
  const totalText = sanitizeText(formatCurrency(bookingData.totalPrice));
  const totalWidth = helveticaBoldFont.widthOfTextAtSize(totalText, 12);
  page.drawText(totalText, {
    x: width - 60 - totalWidth,
    y: boxYPos,
    size: 12,
    font: helveticaBoldFont,
    color: secondaryColor,
  });
  boxYPos -= 18;

  // Acompte versé
  page.drawText(sanitizeText("Acompte versé :"), {
    x: 55,
    y: boxYPos,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });
  const depositText = sanitizeText(formatCurrency(bookingData.depositPaid));
  const depositWidth = helveticaFont.widthOfTextAtSize(depositText, 10);
  page.drawText(depositText, {
    x: width - 60 - depositWidth,
    y: boxYPos,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });
  boxYPos -= 18;

  // Reste à payer
  page.drawText(sanitizeText("Reste à payer :"), {
    x: 55,
    y: boxYPos,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });
  const remainingText = sanitizeText(formatCurrency(bookingData.remainingAmount));
  const remainingWidth = helveticaFont.widthOfTextAtSize(remainingText, 10);
  page.drawText(remainingText, {
    x: width - 60 - remainingWidth,
    y: boxYPos,
    size: 10,
    font: helveticaFont,
    color: neutralDark,
  });

  // Footer
  yPosition = 60;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: neutralLight,
  });

  const footerText = sanitizeText(`Réservation générée par ${bookingData.agency?.name || "CarRental"}. Tous droits réservés.`);
  const footerWidth = helveticaFont.widthOfTextAtSize(footerText, 8);
  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: 40,
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
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return formatted;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

