import nodemailer from "nodemailer";
import { getInvoiceEmailTemplate } from "@/lib/templates/invoice-email";
import { getFromAddress } from "../config";
import { sendEmailWithQueue, getGreeting } from "../utils";
import type { InvoiceEmailParams } from "../types";

export async function sendInvoiceEmail({
  to,
  name,
  invoiceNumber,
  bookingReference,
  pdfBuffer,
}: InvoiceEmailParams): Promise<{ success: boolean; messageId?: string; queued: boolean; error?: string; skipped?: boolean }> {
  const greeting = getGreeting();

  const template = getInvoiceEmailTemplate({
    greeting,
    name,
    invoiceNumber,
    bookingReference,
  });

  const mailOptions: nodemailer.SendMailOptions = {
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

