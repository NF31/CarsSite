import { formatCurrency } from "@/lib/email/utils/format-currency";
import type { ModificationInfo, PricingInfo } from "../helpers";

/**
 * Section des détails financiers
 */
export function renderPricingSection(params: {
  pricing: PricingInfo;
  hasModificationInfo: boolean;
  modificationInfo?: ModificationInfo;
}): string {
  const { pricing, hasModificationInfo, modificationInfo } = params;
  const totalFormatted = formatCurrency(pricing.total);
  const depositFormatted = formatCurrency(pricing.deposit);
  const remainingFormatted = formatCurrency(pricing.remaining);

  if (hasModificationInfo && modificationInfo) {
    return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0f172a; border-radius:20px; margin-bottom:28px;">
        <tr>
          <td style="padding:22px; color:#ffffff;">
            <h3 style="margin:0 0 14px; font-size:17px; font-weight:600;">Détails financiers</h3>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding-bottom:12px;">
                  <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.65); font-weight:600;">Montant total</p>
                  <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.7); text-decoration:line-through;">${modificationInfo.originalTotalPrice !== undefined ? formatCurrency(modificationInfo.originalTotalPrice) : "N/A"}</p>
                  <p style="margin:4px 0 0; font-size:20px; font-weight:600; color:#ffffff;">${totalFormatted}</p>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:12px;">
                  <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.65); font-weight:600;">Acompte versé</p>
                  <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.7); text-decoration:line-through;">${modificationInfo.originalDepositPaid !== undefined ? formatCurrency(modificationInfo.originalDepositPaid) : "N/A"}</p>
                  <p style="margin:4px 0 0; font-size:16px; color:#ffffff;">${depositFormatted}</p>
                </td>
              </tr>
              <tr>
                <td>
                  <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.65); font-weight:600;">Reste à payer</p>
                  <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.7); text-decoration:line-through;">${modificationInfo.originalRemainingAmount !== undefined ? formatCurrency(modificationInfo.originalRemainingAmount) : "N/A"}</p>
                  <p style="margin:4px 0 0; font-size:16px; color:#ffffff;">${remainingFormatted}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0f172a; border-radius:20px; margin-bottom:28px;">
      <tr>
        <td style="padding:22px; color:#ffffff;">
          <h3 style="margin:0 0 14px; font-size:17px; font-weight:600;">Détails financiers</h3>
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
  `;
}

