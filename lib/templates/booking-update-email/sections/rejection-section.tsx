/**
 * Section d'affichage du message de refus
 */
export function renderRejectionSection(rejectionReason: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fef2f2; border:1px solid #fecaca; border-radius:16px; padding:18px 20px; margin:0 0 20px;">
      <tr>
        <td>
          <p style="margin:0 0 10px; font-size:13px; text-transform:uppercase; letter-spacing:0.08em; color:#991b1b; font-weight:600;">Message de notre équipe</p>
          <p style="margin:0; font-size:14px; line-height:1.6; color:#7f1d1d;">${rejectionReason}</p>
        </td>
      </tr>
    </table>
  `;
}

