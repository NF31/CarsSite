import type { PDFPage, PDFFont } from "pdf-lib";
import type { InvoiceData } from "../types";
import { COLORS, SECTION_SPACING } from "../constants";
import { sanitizeText } from "../utils/text-sanitizer";
import { formatDate } from "../utils/formatters";

export function buildBookingDetails(
  page: PDFPage,
  width: number,
  yPosition: number,
  helveticaFont: PDFFont,
  helveticaBoldFont: PDFFont,
  invoiceData: InvoiceData
): number {
  // Ligne de séparation colorée
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 2,
    color: COLORS.primary,
  });

  yPosition -= SECTION_SPACING;

  // Titre de section avec fond coloré
  const sectionTitle = "Détails de la réservation";
  const sectionTitleWidth = helveticaBoldFont.widthOfTextAtSize(sectionTitle, 13);
  page.drawRectangle({
    x: 50,
    y: yPosition - 15,
    width: sectionTitleWidth + 20,
    height: 20,
    color: COLORS.primary,
  });

  page.drawText(sectionTitle, {
    x: 60,
    y: yPosition - 10,
    size: 13,
    font: helveticaBoldFont,
    color: COLORS.white,
  });

  yPosition -= 35;

  // Fond léger pour les détails
  page.drawRectangle({
    x: 50,
    y: yPosition - 90,
    width: width - 100,
    height: 90,
    color: COLORS.neutralLight,
    borderColor: COLORS.primary,
    borderWidth: 1,
  });

  page.drawText(sanitizeText(`Reference: ${invoiceData.booking.reference}`), {
    x: 60,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: COLORS.neutralDark,
  });

  yPosition -= 15;
  page.drawText(
    sanitizeText(
      `Vehicule: ${invoiceData.booking.vehicle.brand} ${invoiceData.booking.vehicle.model} (${invoiceData.booking.vehicle.licensePlate})`
    ),
    {
      x: 60,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: COLORS.neutralDark,
    }
  );

  yPosition -= 15;
  page.drawText(
    sanitizeText(
      `Periode: Du ${formatDate(invoiceData.booking.startDate)} au ${formatDate(invoiceData.booking.endDate)}`
    ),
    {
      x: 60,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: COLORS.neutralDark,
    }
  );

  yPosition -= 15;
  page.drawText(
    sanitizeText(
      `Lieu de prise en charge: ${invoiceData.booking.pickupLocation.name}, ${invoiceData.booking.pickupLocation.city}`
    ),
    {
      x: 60,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: COLORS.neutralDark,
    }
  );

  yPosition -= 15;
  page.drawText(
    sanitizeText(
      `Lieu de retour: ${invoiceData.booking.returnLocation.name}, ${invoiceData.booking.returnLocation.city}`
    ),
    {
      x: 60,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: COLORS.neutralDark,
    }
  );

  // Ligne de séparation colorée
  yPosition -= SECTION_SPACING;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 2,
    color: COLORS.primary,
  });

  return yPosition - SECTION_SPACING;
}

