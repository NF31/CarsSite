/**
 * Section hero du template d'email de mise à jour de réservation
 */
export function renderHeroSection(params: {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  reference: string;
  heroGradientFrom: string;
  heroGradientTo: string;
}): string {
  return `
    <tr>
      <td align="center" style="background:linear-gradient(135deg,${params.heroGradientFrom} 0%,${params.heroGradientTo} 100%); padding:32px 24px;">
        <p style="margin:0; text-transform:uppercase; letter-spacing:2px; font-size:12px; color:rgba(255,255,255,0.75); font-weight:600;">${params.heroBadge}</p>
        <h1 style="margin:12px 0 0; font-size:28px; line-height:1.3; color:#ffffff; font-weight:600;">${params.heroTitle}</h1>
        <p style="margin:8px 0 0; font-size:16px; color:rgba(255,255,255,0.85);">${params.heroSubtitle}</p>
        <p style="margin:14px 0 0; font-size:15px; color:rgba(255,255,255,0.9);">Référence <span style="font-weight:600;">${params.reference}</span></p>
      </td>
    </tr>
  `;
}

