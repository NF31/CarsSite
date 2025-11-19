function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

interface BookingCancellationRejectedTemplateParams {
  greeting: string;
  name: string;
  reference: string;
  period: string;
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
  pricing: {
    total: number;
    deposit: number;
    remaining: number;
  };
  dashboardUrl: string;
  reason?: string | null;
  rejectionReason?: string | null; // Message de refus de l'admin
}

export function getBookingCancellationRejectedEmailTemplate({
  greeting,
  name,
  reference,
  period,
  vehicle,
  locations,
  pricing,
  dashboardUrl,
  reason,
  rejectionReason,
}: BookingCancellationRejectedTemplateParams) {
  const totalFormatted = formatCurrency(pricing.total);
  const depositFormatted = formatCurrency(pricing.deposit);
  const remainingFormatted = formatCurrency(pricing.remaining);

  const reasonSection = reason
    ? `<p style="margin:0 0 18px; font-size:14px; line-height:1.6; color:#475569;">
        <span style="font-weight:600; color:#0f172a;">Votre demande :</span> « ${reason} »
      </p>`
    : "";

  const rejectionReasonSection = rejectionReason
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fef2f2; border:1px solid #fecaca; border-radius:16px; padding:18px 20px; margin:20px 0;">
        <tr>
          <td>
            <p style="margin:0 0 10px; font-size:13px; text-transform:uppercase; letter-spacing:0.08em; color:#991b1b; font-weight:600;">Message de notre équipe</p>
            <p style="margin:0; font-size:14px; line-height:1.6; color:#7f1d1d;">${rejectionReason}</p>
          </td>
        </tr>
      </table>`
    : "";

  return {
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Décision sur votre demande d'annulation ${reference}</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f3f4f6;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f4f6; padding:32px 0;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px; background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 24px 60px -30px rgba(217,119,6,0.28); font-family:'Geist Sans', Arial, sans-serif;">
                  <tr>
                    <td align="center" style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%); padding:32px 24px;">
                      <p style="margin:0; text-transform:uppercase; letter-spacing:2px; font-size:12px; color:rgba(255,255,255,0.75); font-weight:600;">Annulation refusée</p>
                      <h1 style="margin:12px 0 0; font-size:28px; line-height:1.3; color:#ffffff; font-weight:600;">Votre réservation est maintenue</h1>
                      <p style="margin:8px 0 0; font-size:16px; color:rgba(255,255,255,0.85);">Référence <span style="font-weight:600;">${reference}</span></p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 24px 32px; color:#1f2937;">
                      <h2 style="margin:0 0 16px; font-size:20px; font-weight:600; color:#0f172a;">${greeting} ${name},</h2>
                      <p style="margin:0 0 18px; font-size:15px; line-height:1.6; color:#4b5563;">
                        Nous avons bien étudié votre demande d'annulation. Après vérification, la réservation reste confirmée aux dates initialement prévues.
                      </p>
                      ${reasonSection}
                      ${rejectionReasonSection}

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                        <tr>
                          <td style="background-color:#f1f5f9; border-radius:18px; padding:16px 18px;">
                            <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#475569; font-weight:600;">Période confirmée</p>
                            <p style="margin:10px 0 0; font-size:15px; color:#0f172a; font-weight:500;">${period}</p>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:20px; padding:0; margin-bottom:24px;">
                        <tr>
                          <td style="padding:20px 22px;">
                            <h3 style="margin:0 0 12px; font-size:17px; font-weight:600; color:#0f172a;">Détails de la réservation</h3>
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td style="padding-bottom:14px;">
                                  <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#475569; font-weight:600;">Véhicule</p>
                                  <p style="margin:8px 0 0; font-size:14px; color:#1f2937; font-weight:500;">${vehicle.label}</p>
                                  <p style="margin:4px 0 0; font-size:13px; color:#64748b;">Plaque : ${vehicle.licensePlate}</p>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#475569; font-weight:600;">Agences</p>
                                  <p style="margin:8px 0 0; font-size:14px; color:#1f2937;"><span style="font-weight:600; color:#ea580c;">Retrait :</span> ${locations.pickup}</p>
                                  <p style="margin:6px 0 0; font-size:14px; color:#1f2937;"><span style="font-weight:600; color:#ea580c;">Retour :</span> ${locations.return}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0f172a; border-radius:20px; margin-bottom:28px;">
                        <tr>
                          <td style="padding:22px; color:#ffffff;">
                            <h3 style="margin:0 0 14px; font-size:17px; font-weight:600;">Récapitulatif financier</h3>
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td style="padding-bottom:12px;">
                                  <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.65); font-weight:600;">Montant total</p>
                                  <p style="margin:6px 0 0; font-size:20px; font-weight:600; color:#ffffff;">${totalFormatted}</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding-bottom:12px;">
                                  <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.65); font-weight:600;">Acompte versé</p>
                                  <p style="margin:6px 0 0; font-size:16px; color:#ffffff;">${depositFormatted}</p>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.65); font-weight:600;">Reste à payer</p>
                                  <p style="margin:6px 0 0; font-size:16px; color:#ffffff;">${remainingFormatted}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0 0 22px; font-size:14px; line-height:1.6; color:#475569;">
                        Si vous avez besoin d'ajuster vos dates ou services, vous pouvez le faire directement depuis votre espace client. Notre équipe reste disponible pour discuter d'éventuelles alternatives.
                      </p>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 28px;">
                        <tr>
                          <td align="center" style="background-color:#f97316; border-radius:9999px;">
                            <a href="${dashboardUrl}" style="display:inline-block; padding:14px 28px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none;">Gérer ma réservation</a>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e2e8f0; padding-top:18px;">
                        <tr>
                          <td>
                            <p style="margin:0 0 10px; font-size:13px; color:#64748b;">
                              Besoin d'en discuter ? Répondez à cet email ou contactez-nous au <span style="font-weight:600; color:#f97316;">+33 1 23 45 67 89</span>.
                            </p>
                            <p style="margin:0; font-size:13px; color:#64748b;">
                              Merci pour votre confiance.<br>
                              <span style="font-weight:600; color:#0f172a;">L’équipe CarRental</span>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px; margin-top:16px; font-family:'Geist Sans', Arial, sans-serif;">
                  <tr>
                    <td align="center" style="font-size:12px; color:#94a3b8;">
                      © ${new Date().getFullYear()} CarRental • 102 Avenue de la Mobilité, 75000 Paris
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

Nous avons pris connaissance de votre demande d'annulation concernant la réservation ${reference}. Après étude, la réservation est maintenue.

Période confirmée : ${period}
Véhicule : ${vehicle.label} (${vehicle.licensePlate})
Prise en charge : ${locations.pickup}
Retour : ${locations.return}
Montant total : ${totalFormatted}
Acompte versé : ${depositFormatted}
Reste à payer : ${remainingFormatted}

${reason ? `Votre message : ${reason}\n\n` : ""}${rejectionReason ? `Message de notre équipe :\n${rejectionReason}\n\n` : ""}Si vous souhaitez ajuster la réservation, connectez-vous à votre espace client :
${dashboardUrl}

Besoin d'aide ? Répondez à ce message ou contactez-nous au +33 1 23 45 67 89.

À bientôt,
L’équipe CarRental
`,
  };
}


