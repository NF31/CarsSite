import type { SendMailOptions } from "nodemailer";
import { getInvoiceEmailTemplate } from "@/lib/templates/invoice-email";
import { getFromAddress } from "../config";
import { sendEmailWithQueue } from "../utils";
import type { InvoiceEmailParams } from "../types";

export async function sendInvoiceEmail({
  to,
  name,
  invoiceNumber,
  bookingReference,
  pdfBuffer,
}: InvoiceEmailParams): Promise<{ success: boolean; messageId?: string; queued: boolean; error?: string; skipped?: boolean }> {
  const template = getInvoiceEmailTemplate({
    name,
    invoiceNumber,
    bookingReference,
  });

  const mailOptions: SendMailOptions = {
    from: getFromAddress(),
    to,
    subject: `Facture ${invoiceNumber} - CarRental`,
    html: template.html,
    text: template.text,
  };

  if (pdfBuffer) {
    mailOptions.attachments = [
      {
        filename: `Facture_${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ];
  }

  return await sendEmailWithQueue({
    mailOptions,
    skipIfNoCredentials: true,
  });
}

