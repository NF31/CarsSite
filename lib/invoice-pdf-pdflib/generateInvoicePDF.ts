import { PDFDocument, StandardFonts } from "pdf-lib";
import type { InvoiceData } from "./types";
import { PAGE_WIDTH, PAGE_HEIGHT } from "./constants";
import { buildHeader } from "./builders/header-builder";
import { buildClientInfo } from "./builders/client-info-builder";
import { buildBookingDetails } from "./builders/booking-details-builder";
import { buildAmountsRecap } from "./builders/amounts-recap-builder";
import { buildFooter } from "./builders/footer-builder";

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

  // Créer une page A4
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const { width, height } = page.getSize();

  // Construire les différentes sections du PDF
  let yPosition = buildHeader(page, width, height, helveticaFont, helveticaBoldFont, invoiceData);
  yPosition = buildClientInfo(page, width, yPosition, helveticaFont, helveticaBoldFont, invoiceData);
  yPosition = buildBookingDetails(page, width, yPosition, helveticaFont, helveticaBoldFont, invoiceData);
  buildAmountsRecap(page, width, yPosition, helveticaFont, helveticaBoldFont, invoiceData);
  buildFooter(page, width, helveticaFont, invoiceData);

  // Note: Le statut n'est pas affiché sur le PDF car :
  // - Il peut être obsolète (le PDF est statique)
  // - Il peut être trompeur (ex: facture "DRAFT" sur un document officiel)
  // - Le statut peut être consulté dans l'interface web
  // - Le statut n'est pas mis à jour automatiquement lors des paiements

  // Générer le PDF en Buffer
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

