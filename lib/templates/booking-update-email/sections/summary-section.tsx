/**
 * Section de résumé (période et statut)
 */
export function renderSummarySection(params: {
  period: string;
  status: { label: string; textColor: string; backgroundColor: string };
  isRejection: boolean;
}): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
      <tr>
        <td style="background-color:#f1f5f9; border-radius:18px; padding:16px 18px;">
          <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#475569; font-weight:600;">${params.isRejection ? "Période conservée" : "Nouvelle période"}</p>
          <p style="margin:10px 0 0; font-size:15px; color:#0f172a; font-weight:500;">${params.period}</p>
        </td>
      </tr>
      <tr>
        <td style="height:12px;"></td>
      </tr>
      <tr>
        <td style="background-color:#ecfeff; border-radius:18px; padding:16px 18px;">
          <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#0f172a; font-weight:600;">Statut mis à jour</p>
          <span style="display:inline-block; margin-top:10px; padding:8px 14px; border-radius:9999px; font-size:13px; font-weight:600; color:${params.status.textColor}; background:${params.status.backgroundColor};">${params.status.label}</span>
        </td>
      </tr>
    </table>
  `;
}

