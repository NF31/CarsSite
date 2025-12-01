import type { PDFPage, PDFFont } from "pdf-lib";
import type { InvoiceData } from "../types";
import { COLORS } from "../constants";
import { sanitizeText } from "../utils/text-sanitizer";
import { formatCurrency } from "../utils/formatters";

export function buildAmountsRecap(
  page: PDFPage,
  width: number,
  yPosition: number,
  helveticaFont: PDFFont,
  helveticaBoldFont: PDFFont,
  invoiceData: InvoiceData
): number {
  // Titre de section avec fond coloré
  const recapTitle = "Récapitulatif des montants";
  const recapTitleWidth = helveticaBoldFont.widthOfTextAtSize(recapTitle, 13);
  page.drawRectangle({
    x: 50,
    y: yPosition - 15,
    width: recapTitleWidth + 20,
    height: 20,
    color: COLORS.secondary,
  });

  page.drawText(recapTitle, {
    x: 60,
    y: yPosition - 10,
    size: 13,
    font: helveticaBoldFont,
    color: COLORS.white,
  });

  // Calculer le nombre de jours
  const days = Math.ceil(
    (invoiceData.booking.endDate.getTime() - invoiceData.booking.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const vehiclePrice = invoiceData.booking.vehicle.pricePerDay * days;

  // Calculer la hauteur nécessaire pour la box
  const servicesCount = invoiceData.booking.services?.length || 0;
  const hasDeposit = invoiceData.booking.depositPaid && invoiceData.booking.depositPaid > 0;
  const depositHeight = hasDeposit ? 60 : 0;
  const boxHeight = 70 + (servicesCount > 0 ? servicesCount * 15 : 0) + 20 + depositHeight;

  yPosition -= 35;

  // Box pour le récapitulatif
  page.drawRectangle({
    x: 50,
    y: yPosition - boxHeight,
    width: width - 100,
    height: boxHeight,
    color: COLORS.neutralLight,
    borderColor: COLORS.secondary,
    borderWidth: 2,
  });

  // Ligne véhicule
  const vehicleLineText = sanitizeText(
    `Location véhicule (${days} jour${days > 1 ? "s" : ""} × ${formatCurrency(invoiceData.booking.vehicle.pricePerDay)}):`
  );
  page.drawText(vehicleLineText, {
    x: 60,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: COLORS.neutralDark,
  });
  const vehicleValueText = formatCurrency(vehiclePrice);
  const vehicleValueWidth = helveticaFont.widthOfTextAtSize(vehicleValueText, 10);
  page.drawText(vehicleValueText, {
    x: width - 60 - vehicleValueWidth,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: COLORS.neutralDark,
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
        color: COLORS.neutralDark,
      });
      const serviceValueText = formatCurrency(service.price);
      const serviceValueWidth = helveticaFont.widthOfTextAtSize(serviceValueText, 10);
      page.drawText(serviceValueText, {
        x: width - 60 - serviceValueWidth,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: COLORS.neutralDark,
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
    color: COLORS.secondary,
  });

  yPosition -= 15;
  const subtotalText = sanitizeText(`Sous-total:`);
  page.drawText(subtotalText, {
    x: 60,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: COLORS.neutralDark,
  });
  const subtotalValueText = formatCurrency(invoiceData.subtotal);
  const subtotalValueWidth = helveticaFont.widthOfTextAtSize(subtotalValueText, 10);
  page.drawText(subtotalValueText, {
    x: width - 60 - subtotalValueWidth,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: COLORS.neutralDark,
  });

  yPosition -= 20;
  const taxText = sanitizeText(`TVA (20%):`);
  page.drawText(taxText, {
    x: 60,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: COLORS.neutralDark,
  });
  const taxValueText = formatCurrency(invoiceData.tax);
  const taxValueWidth = helveticaFont.widthOfTextAtSize(taxValueText, 10);
  page.drawText(taxValueText, {
    x: width - 60 - taxValueWidth,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: COLORS.neutralDark,
  });

  // Ligne de séparation avant le total
  yPosition -= 10;
  page.drawLine({
    start: { x: 60, y: yPosition },
    end: { x: width - 60, y: yPosition },
    thickness: 1,
    color: COLORS.secondary,
  });

  yPosition -= 15;
  const totalText = sanitizeText(`Total:`);
  page.drawText(totalText, {
    x: 60,
    y: yPosition,
    size: 14,
    font: helveticaBoldFont,
    color: COLORS.secondary,
  });
  const totalValueText = formatCurrency(invoiceData.total);
  const totalValueWidth = helveticaBoldFont.widthOfTextAtSize(totalValueText, 14);
  page.drawText(totalValueText, {
    x: width - 60 - totalValueWidth,
    y: yPosition,
    size: 14,
    font: helveticaBoldFont,
    color: COLORS.secondary,
  });

  // Afficher l'acompte payé et le solde restant si un acompte a été payé
  if (invoiceData.booking.depositPaid && invoiceData.booking.depositPaid > 0) {
    yPosition -= 20;
    page.drawLine({
      start: { x: 60, y: yPosition },
      end: { x: width - 60, y: yPosition },
      thickness: 1,
      color: COLORS.secondary,
    });

    yPosition -= 15;
    const depositPaidText = sanitizeText(`Acompte paye:`);
    page.drawText(depositPaidText, {
      x: 60,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: COLORS.neutralDark,
    });
    const depositPaidValueText = formatCurrency(invoiceData.booking.depositPaid);
    const depositPaidValueWidth = helveticaFont.widthOfTextAtSize(depositPaidValueText, 11);
    page.drawText(depositPaidValueText, {
      x: width - 60 - depositPaidValueWidth,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: COLORS.secondary,
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
        color: COLORS.primary,
      });
      const remainingValueText = formatCurrency(remainingBalance);
      const remainingValueWidth = helveticaBoldFont.widthOfTextAtSize(remainingValueText, 12);
      page.drawText(remainingValueText, {
        x: width - 60 - remainingValueWidth,
        y: yPosition,
        size: 12,
        font: helveticaBoldFont,
        color: COLORS.primary,
      });
    }
  }

  return yPosition - boxHeight;
}

