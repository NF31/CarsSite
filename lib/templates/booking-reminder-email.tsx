function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

interface BookingReminderTemplateParams {
  greeting: string;
  name: string;
  reference: string;
  period: string;
  startDate: Date;
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
}

export function getBookingReminderEmailTemplate({
  greeting,
  name,
  reference,
  period,
  startDate,
  vehicle,
  locations,
  pricing,
  dashboardUrl,
}: BookingReminderTemplateParams) {
  const totalFormatted = formatCurrency(pricing.total);
  const depositFormatted = formatCurrency(pricing.deposit);
  const remainingFormatted = formatCurrency(pricing.remaining);
  
  // Calculer le temps restant jusqu'au début de la réservation
  const now = new Date();
  const hoursUntilStart = Math.floor((startDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  const daysUntilStart = Math.floor(hoursUntilStart / 24);
  const hoursRemaining = hoursUntilStart % 24;
  
  let timeUntilStart = "";
  if (daysUntilStart > 0) {
    timeUntilStart = `${daysUntilStart} jour${daysUntilStart > 1 ? "s" : ""}${hoursRemaining > 0 ? ` et ${hoursRemaining} heure${hoursRemaining > 1 ? "s" : ""}` : ""}`;
  } else {
    timeUntilStart = `${hoursUntilStart} heure${hoursUntilStart > 1 ? "s" : ""}`;
  }

  return {
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Rappel de réservation ${reference}</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f3f4f6;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f4f6; padding:32px 0;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px; background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 24px 60px -30px rgba(251, 191, 36, 0.25); font-family:'Geist Sans', Arial, sans-serif;">
                  <tr>
                    <td align="center" style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%); padding:32px 24px;">
                      <p style="margin:0; text-transform:uppercase; letter-spacing:2px; font-size:12px; color:rgba(255,255,255,0.75); font-weight:600;">Rappel important</p>
                      <h1 style="margin:12px 0 0; font-size:28px; line-height:1.3; color:#ffffff; font-weight:600;">Rappel de réservation</h1>
                      <p style="margin:8px 0 0; font-size:16px; color:rgba(255,255,255,0.85);">Référence <span style="font-weight:600;">${reference}</span></p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 24px 32px; color:#1f2937;">
                      <h2 style="margin:0 0 16px; font-size:20px; font-weight:600; color:#0f172a;">${greeting} ${name},</h2>
                      <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#4b5563;">
                        Votre réservation approche ! Elle commence dans <strong style="color:#f59e0b;">${timeUntilStart}</strong>.
                      </p>

                      <div style="background-color:#fef3c7; border-left:4px solid #f59e0b; padding:16px; border-radius:8px; margin-bottom:24px;">
                        <p style="margin:0; font-size:14px; font-weight:600; color:#92400e;">
                          ⏰ N'oubliez pas de vous présenter à l'agence de retrait avec :
                        </p>
                        <ul style="margin:8px 0 0; padding-left:20px; font-size:13px; color:#78350f; line-height:1.8;">
                          <li>Votre permis de conduire</li>
                          <li>Une pièce d'identité</li>
                          <li>Le solde restant à payer (si applicable)</li>
                        </ul>
                      </div>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                        <tr>
                          <td style="background-color:#f1f5f9; border-radius:18px; padding:16px 18px;">
                            <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#475569; font-weight:600;">Période</p>
                            <p style="margin:10px 0 0; font-size:15px; color:#0f172a; font-weight:500;">${period}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="height:12px;"></td>
                        </tr>
                        <tr>
                          <td style="background-color:#eff6ff; border-radius:18px; padding:16px 18px;">
                            <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#1d4ed8; font-weight:600;">Temps restant</p>
                            <p style="margin:10px 0 0; font-size:18px; color:#1d4ed8; font-weight:600;">${timeUntilStart}</p>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:20px; padding:0; margin-bottom:24px;">
                        <tr>
                          <td style="padding:20px 22px;">
                            <h3 style="margin:0 0 12px; font-size:17px; font-weight:600; color:#0f172a;">Résumé du trajet</h3>
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
                                  <p style="margin:8px 0 0; font-size:14px; color:#1f2937;"><span style="font-weight:600; color:#1d4ed8;">Retrait :</span> ${locations.pickup}</p>
                                  <p style="margin:6px 0 0; font-size:14px; color:#1f2937;"><span style="font-weight:600; color:#1d4ed8;">Retour :</span> ${locations.return}</p>
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
                        Retrouvez tous les détails de votre réservation dans votre espace client.
                      </p>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 28px;">
                        <tr>
                          <td align="center" style="background-color:#f59e0b; border-radius:9999px;">
                            <a href="${dashboardUrl}" style="display:inline-block; padding:14px 28px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none;">Voir ma réservation</a>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e2e8f0; padding-top:18px;">
                        <tr>
                          <td>
                            <p style="margin:0 0 10px; font-size:13px; color:#64748b;">
                              Besoin d&apos;assistance ? Répondez à ce message ou contactez-nous au <span style="font-weight:600; color:#1d4ed8;">+33 1 23 45 67 89</span>.
                            </p>
                            <p style="margin:0; font-size:13px; color:#64748b;">
                              À bientôt,<br>
                              <span style="font-weight:600; color:#0f172a;">L'équipe CarRental</span>
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

Rappel de réservation ${reference}

Votre réservation approche ! Elle commence dans ${timeUntilStart}.

Période : ${period}
Véhicule : ${vehicle.label} (${vehicle.licensePlate})
Prise en charge : ${locations.pickup}
Retour : ${locations.return}
Montant total : ${totalFormatted}
Acompte versé : ${depositFormatted}
Reste à payer : ${remainingFormatted}

⏰ N'oubliez pas de vous présenter à l'agence de retrait avec :
- Votre permis de conduire
- Une pièce d'identité
- Le solde restant à payer (si applicable)

Voir ma réservation : ${dashboardUrl}

Besoin d'aide ? Répondez directement à ce message.

À bientôt,
L'équipe CarRental
`,
  };
}

