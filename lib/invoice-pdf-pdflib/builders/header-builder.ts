import type { PDFPage, PDFFont } from "pdf-lib";
import type { InvoiceData } from "../types";
import { COLORS, HEADER_HEIGHT } from "../constants";
import { sanitizeText } from "../utils/text-sanitizer";

export function buildHeader(
  page: PDFPage,
  width: number,
  height: number,
  helveticaFont: PDFFont,
  helveticaBoldFont: PDFFont,
  invoiceData: InvoiceData
): number {
  // Header avec bande colorée (couleur primaire)
  page.drawRectangle({
    x: 0,
    y: height - HEADER_HEIGHT,
    width: width,
    height: HEADER_HEIGHT,
    color: COLORS.primary,
  });

  let yPosition = height - 50;

  // Header avec informations de l'agence (texte blanc sur fond bleu)
  page.drawText(sanitizeText(invoiceData.agency?.name || "CarRental"), {
    x: 50,
    y: yPosition,
    size: 22,
    font: helveticaBoldFont,
    color: COLORS.white,
  });

  yPosition -= 25;
  page.drawText(sanitizeText(invoiceData.agency?.address || "123 Avenue de la Liberte, 75000 Paris"), {
    x: 50,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: COLORS.whiteOff,
  });

  yPosition -= 15;
  page.drawText(
    sanitizeText(
      `Telephone: ${invoiceData.agency?.phone || "+33 1 23 45 67 89"} | Email: ${invoiceData.agency?.email || "contact@carrental.com"}`
    ),
    {
      x: 50,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: COLORS.whiteOff,
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
    color: COLORS.white,
  });

  const invoiceNumberText = `N° ${invoiceData.invoiceNumber}`;
  const invoiceNumberWidth = helveticaFont.widthOfTextAtSize(invoiceNumberText, 11);
  page.drawText(invoiceNumberText, {
    x: width - 50 - invoiceNumberWidth,
    y: height - 85,
    size: 11,
    font: helveticaFont,
    color: COLORS.whiteOff,
  });

  return height - 130;
}

