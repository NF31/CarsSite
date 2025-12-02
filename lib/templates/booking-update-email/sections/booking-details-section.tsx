/**
 * Section des détails de la réservation (véhicule et agences)
 */
export function renderBookingDetailsSection(params: {
  vehicle: { label: string; licensePlate: string };
  locations: { pickup: string; return: string };
}): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:20px; padding:0; margin-bottom:24px;">
      <tr>
        <td style="padding:20px 22px;">
          <h3 style="margin:0 0 12px; font-size:17px; font-weight:600; color:#0f172a;">Résumé actualisé</h3>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding-bottom:14px;">
                <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#475569; font-weight:600;">Véhicule</p>
                <p style="margin:8px 0 0; font-size:14px; color:#1f2937; font-weight:500;">${params.vehicle.label}</p>
                <p style="margin:4px 0 0; font-size:13px; color:#64748b;">Plaque : ${params.vehicle.licensePlate}</p>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#475569; font-weight:600;">Agences</p>
                <p style="margin:8px 0 0; font-size:14px; color:#1f2937;"><span style="font-weight:600; color:#0284c7;">Retrait :</span> ${params.locations.pickup}</p>
                <p style="margin:6px 0 0; font-size:14px; color:#1f2937;"><span style="font-weight:600; color:#0284c7;">Retour :</span> ${params.locations.return}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

