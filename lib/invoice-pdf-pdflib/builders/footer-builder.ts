import type { PDFPage, PDFFont } from "pdf-lib";
import type { InvoiceData } from "../types";
import { COLORS } from "../constants";
import { sanitizeText } from "../utils/text-sanitizer";

export function buildFooter(
  page: PDFPage,
  width: number,
  helveticaFont: PDFFont,
  invoiceData: InvoiceData
): void {
  const yPosition = 80;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: COLORS.neutralLight,
  });

  const footerText = sanitizeText(
    `Facture generee par ${invoiceData.agency?.name || "CarRental"}. Tous droits reserves.`
  );
  const footerWidth = helveticaFont.widthOfTextAtSize(footerText, 8);
  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: 60,
    size: 8,
    font: helveticaFont,
    color: COLORS.neutralMedium,
  });
}

