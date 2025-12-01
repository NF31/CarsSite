import type { PDFPage, PDFFont } from "pdf-lib";
import type { InvoiceData } from "../types";
import { COLORS } from "../constants";
import { sanitizeText } from "../utils/text-sanitizer";
import { formatDate } from "../utils/formatters";

export function buildClientInfo(
  page: PDFPage,
  width: number,
  yPosition: number,
  helveticaFont: PDFFont,
  helveticaBoldFont: PDFFont,
  invoiceData: InvoiceData
): number {
  // Section client avec fond léger
  page.drawRectangle({
    x: 50,
    y: yPosition - 80,
    width: 250,
    height: 80,
    color: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderWidth: 1,
  });

  page.drawText("Facturé à:", {
    x: 60,
    y: yPosition - 20,
    size: 11,
    font: helveticaBoldFont,
    color: COLORS.primary,
  });

  let currentY = yPosition - 35;
  page.drawText(sanitizeText(invoiceData.user.name), {
    x: 60,
    y: currentY,
    size: 10,
    font: helveticaFont,
    color: COLORS.neutralDark,
  });

  if (invoiceData.user.email) {
    currentY -= 15;
    page.drawText(sanitizeText(invoiceData.user.email), {
      x: 60,
      y: currentY,
      size: 10,
      font: helveticaFont,
      color: COLORS.neutralMedium,
    });
  }

  if (invoiceData.user.phone) {
    currentY -= 15;
    page.drawText(sanitizeText(invoiceData.user.phone), {
      x: 60,
      y: currentY,
      size: 10,
      font: helveticaFont,
      color: COLORS.neutralMedium,
    });
  }

  // Informations de facturation (alignées à droite, dans une box)
  page.drawRectangle({
    x: width - 250 - 50,
    y: yPosition - 80,
    width: 250,
    height: 80,
    color: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderWidth: 1,
  });

  const dateEmissionText = sanitizeText(`Date d'emission: ${formatDate(invoiceData.issuedAt)}`);
  const dateEmissionWidth = helveticaFont.widthOfTextAtSize(dateEmissionText, 10);
  page.drawText(dateEmissionText, {
    x: width - 50 - dateEmissionWidth,
    y: yPosition - 20,
    size: 10,
    font: helveticaFont,
    color: COLORS.neutralDark,
  });

  const dateEcheanceText = sanitizeText(`Date d'echeance: ${formatDate(invoiceData.dueDate)}`);
  const dateEcheanceWidth = helveticaFont.widthOfTextAtSize(dateEcheanceText, 10);
  page.drawText(dateEcheanceText, {
    x: width - 50 - dateEcheanceWidth,
    y: yPosition - 35,
    size: 10,
    font: helveticaFont,
    color: COLORS.neutralDark,
  });

  return yPosition - 100;
}

