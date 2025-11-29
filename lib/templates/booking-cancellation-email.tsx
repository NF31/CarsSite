import { getGreeting } from "@/lib/email/utils/greeting";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

interface BookingCancellationTemplateParams {
  greeting?: string;
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
    refund: number;
    retained: number;
    remaining: number;
    refundLabel: string;
  };
  dashboardUrl: string;
  policy: string;
  reason?: string | null;
}

export function getBookingCancellationEmailTemplate({
  greeting,
  name,
  reference,
  period,
  vehicle,
  locations,
  pricing,
  dashboardUrl,
  policy,
  reason,
}: BookingCancellationTemplateParams) {
  const finalGreeting = greeting ?? getGreeting();
  const totalFormatted = formatCurrency(pricing.total);
  const depositFormatted = formatCurrency(pricing.deposit);
  const refundFormatted = formatCurrency(pricing.refund);
  const retainedFormatted = formatCurrency(pricing.retained);
  const remainingFormatted = formatCurrency(pricing.remaining);

  const reasonSection = reason
    ? `<p style="margin:0 0 18px; font-size:14px; line-height:1.6; color:#475569;">
        <span style="font-weight:600; color:#0f172a;">Motif communiqué :</span> ${reason}
      </p>`
    : "";

  const retainedLine =
    pricing.retained > 0
      ? `<tr>
            <td style="padding-bottom:12px;">
              <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.65); font-weight:600;">Frais retenus</p>
              <p style="margin:6px 0 0; font-size:16px; color:#ffffff;">${retainedFormatted}</p>
            </td>
          </tr>`
      : "";

  return {
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Annulation de votre réservation ${reference}</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f3f4f6;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f4f6; padding:32px 0;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px; background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 24px 60px -30px rgba(239,68,68,0.28); font-family:'Geist Sans', Arial, sans-serif;">
                  <tr>
                    <td align="center" style="background:linear-gradient(135deg,#ef4444 0%,#b91c1c 100%); padding:32px 24px;">
                      <p style="margin:0; text-transform:uppercase; letter-spacing:2px; font-size:12px; color:rgba(255,255,255,0.75); font-weight:600;">Réservation annulée</p>
                      <h1 style="margin:12px 0 0; font-size:28px; line-height:1.3; color:#ffffff; font-weight:600;">Confirmation d'annulation</h1>
                      <p style="margin:8px 0 0; font-size:16px; color:rgba(255,255,255,0.85);">Référence <span style="font-weight:600;">${reference}</span></p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 24px 32px; color:#1f2937;">
                      <h2 style="margin:0 0 16px; font-size:20px; font-weight:600; color:#0f172a;">${finalGreeting} ${name},</h2>
                      <p style="margin:0 0 18px; font-size:15px; line-height:1.6; color:#4b5563;">
                        Nous confirmons la prise en compte de votre demande d'annulation. Vous trouverez ci-dessous le récapitulatif des montants concernés ainsi que le rappel de notre politique.
                      </p>
                      ${reasonSection}

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                        <tr>
                          <td style="background-color:#f1f5f9; border-radius:18px; padding:16px 18px;">
                            <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#475569; font-weight:600;">Période initiale</p>
                            <p style="margin:10px 0 0; font-size:15px; color:#0f172a; font-weight:500;">${period}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="height:12px;"></td>
                        </tr>
                        <tr>
                          <td style="background-color:#fee2e2; border-radius:18px; padding:16px 18px;">
                            <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#991b1b; font-weight:600;">Statut</p>
                            <span style="display:inline-block; margin-top:10px; padding:8px 14px; border-radius:9999px; font-size:13px; font-weight:600; color:#991b1b; background:#fee2e2;">Annulée</span>
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
                                  <p style="margin:8px 0 0; font-size:14px; color:#1f2937;"><span style="font-weight:600; color:#b91c1c;">Retrait :</span> ${locations.pickup}</p>
                                  <p style="margin:6px 0 0; font-size:14px; color:#1f2937;"><span style="font-weight:600; color:#b91c1c;">Retour :</span> ${locations.return}</p>
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
                                <td style="padding-bottom:12px;">
                                  <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.65); font-weight:600;">Remboursement estimé</p>
                                  <p style="margin:6px 0 0; font-size:16px; color:#ffffff;">${refundFormatted} • ${pricing.refundLabel}</p>
                                </td>
                              </tr>
                              ${retainedLine}
                              <tr>
                                <td>
                                  <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.65); font-weight:600;">Solde exigible</p>
                                  <p style="margin:6px 0 0; font-size:16px; color:#ffffff;">${remainingFormatted}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fef2f2; border:1px solid #fecaca; border-radius:18px; padding:18px 20px; margin-bottom:24px;">
                        <tr>
                          <td style="color:#7f1d1d; font-size:13px; line-height:1.6;">
                            <strong style="display:block; font-size:14px; margin-bottom:6px;">Politique d'annulation</strong>
                            ${policy}
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0 0 22px; font-size:14px; line-height:1.6; color:#475569;">
                        Le remboursement sera initié sur le moyen de paiement utilisé lors de la réservation. Comptez un délai bancaire de 3 à 5 jours ouvrés selon votre établissement. Vous pouvez suivre l'évolution depuis votre espace client.
                      </p>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 28px;">
                        <tr>
                          <td align="center" style="background-color:#ef4444; border-radius:9999px;">
                            <a href="${dashboardUrl}" style="display:inline-block; padding:14px 28px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none;">Accéder à mon espace client</a>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e2e8f0; padding-top:18px;">
                        <tr>
                          <td>
                            <p style="margin:0 0 10px; font-size:13px; color:#64748b;">
                              Une question supplémentaire ? Répondez à cet email ou contactez-nous au <span style="font-weight:600; color:#b91c1c;">+33 1 23 45 67 89</span>.
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
${finalGreeting} ${name},

Nous confirmons l'annulation de votre réservation ${reference}.

Période initiale : ${period}
Véhicule : ${vehicle.label} (${vehicle.licensePlate})
Prise en charge : ${locations.pickup}
Retour : ${locations.return}

Montant total : ${totalFormatted}
Acompte versé : ${depositFormatted}
Remboursement estimé : ${refundFormatted} (${pricing.refundLabel})
Frais retenus : ${retainedFormatted}
Solde exigible : ${remainingFormatted}

Politique d'annulation :
${policy}

${reason ? `Motif communiqué : ${reason}\n\n` : ""}Le remboursement sera déclenché sur votre moyen de paiement. Un délai bancaire de 3 à 5 jours ouvrés peut s'appliquer.

Suivez la situation depuis votre espace client :
${dashboardUrl}

Besoin d'aide ? Répondez à ce message ou contactez-nous au +33 1 23 45 67 89.

À bientôt,
L’équipe CarRental
`,
  };
}


