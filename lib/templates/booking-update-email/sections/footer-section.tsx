/**
 * Section footer avec CTA et informations de contact
 */
export function renderFooterSection(params: {
  dashboardUrl: string;
  ctaLabel: string;
  secondaryCtaLabel: string;
}): string {
  return `
    <p style="margin:0 0 22px; font-size:14px; line-height:1.6; color:#475569;">
      Vous pouvez consulter les documents mis à jour et suivre l'évolution de votre réservation depuis votre espace client sécurisé.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 28px;">
      <tr>
        <td align="center" style="background-color:#0ea5e9; border-radius:9999px;">
          <a href="${params.dashboardUrl}" style="display:inline-block; padding:14px 28px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none;">${params.ctaLabel}</a>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e2e8f0; padding-top:18px;">
      <tr>
        <td>
          <p style="margin:0 0 10px; font-size:13px; color:#64748b;">
            ${params.secondaryCtaLabel}
          </p>
          <p style="margin:0; font-size:13px; color:#64748b;">
            Merci pour votre confiance.<br>
            <span style="font-weight:600; color:#0f172a;">L'équipe CarRental</span>
          </p>
        </td>
      </tr>
    </table>
  `;
}

