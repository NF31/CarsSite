interface InvoiceEmailTemplateParams {
  greeting: string;
  name: string;
  invoiceNumber: string;
  bookingReference: string;
}

export function getInvoiceEmailTemplate({
  greeting,
  name,
  invoiceNumber,
  bookingReference,
}: InvoiceEmailTemplateParams) {

  return {
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Facture ${invoiceNumber}</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f3f4f6;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f4f6; padding:32px 0;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px; background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 24px 60px -30px rgba(30,64,175,0.25); font-family:'Geist Sans', Arial, sans-serif;">
                  <tr>
                    <td align="center" style="background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%); padding:32px 24px;">
                      <p style="margin:0; text-transform:uppercase; letter-spacing:2px; font-size:12px; color:rgba(255,255,255,0.75); font-weight:600;">Votre facture</p>
                      <h1 style="margin:12px 0 0; font-size:28px; line-height:1.3; color:#ffffff; font-weight:600;">Facture ${invoiceNumber}</h1>
                      <p style="margin:8px 0 0; font-size:16px; color:rgba(255,255,255,0.85);">Réservation <span style="font-weight:600;">${bookingReference}</span></p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 24px 32px; color:#1f2937;">
                      <h2 style="margin:0 0 16px; font-size:20px; font-weight:600; color:#0f172a;">
                        ${greeting} ${name},
                      </h2>
                      <p style="margin:0 0 24px; font-size:16px; line-height:1.6; color:#4b5563;">
                        Vous trouverez ci-joint votre facture <strong>${invoiceNumber}</strong> pour la réservation <strong>${bookingReference}</strong>.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
${greeting} ${name},

Vous trouverez ci-joint votre facture ${invoiceNumber} pour la réservation ${bookingReference}.

Merci pour votre confiance.
L'équipe CarRental
    `.trim(),
  };
}

