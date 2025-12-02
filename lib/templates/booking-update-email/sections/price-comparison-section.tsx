import { formatCurrency } from "@/lib/email/utils/format-currency";
import type { ModificationInfo } from "../helpers";

interface PriceComparisonParams {
  pricing: { total: number; deposit: number; remaining: number };
  modificationInfo: ModificationInfo;
  priceDifference: number | null;
  depositDiff: number | null;
  remainingDiff: number | null;
}

/**
 * Section de comparaison des prix (affichée uniquement lors de modifications)
 */
export function renderPriceComparisonSection(params: PriceComparisonParams): string {
  const { pricing, modificationInfo, priceDifference, depositDiff, remainingDiff } = params;
  const totalFormatted = formatCurrency(pricing.total);
  const depositFormatted = formatCurrency(pricing.deposit);
  const remainingFormatted = formatCurrency(pricing.remaining);

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fff7ed; border:2px solid #fbbf24; border-radius:20px; margin-bottom:28px;">
      <tr>
        <td style="padding:22px;">
          <h3 style="margin:0 0 16px; font-size:17px; font-weight:600; color:#92400e;">📊 Comparaison des prix</h3>
          ${renderPriceDifference(priceDifference, modificationInfo, totalFormatted)}
          ${renderDepositDifference(depositDiff, modificationInfo, depositFormatted)}
          ${renderRemainingDifference(remainingDiff, modificationInfo, remainingFormatted)}
        </td>
      </tr>
    </table>
  `;
}

function renderPriceDifference(
  priceDifference: number | null,
  modificationInfo: ModificationInfo,
  totalFormatted: string
): string {
  if (priceDifference === null) return "";

  return `
    <div style="margin-bottom:16px; padding:14px; background-color:#ffffff; border-radius:12px; border:1px solid #fbbf24;">
      <p style="margin:0 0 8px; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#92400e; font-weight:600;">${priceDifference > 0 ? "📈 Augmentation du prix total" : "📉 Réduction du prix total"}</p>
      <p style="margin:0; font-size:24px; font-weight:700; color:${priceDifference > 0 ? "#dc2626" : "#16a34a"};">
        ${priceDifference > 0 ? "+" : ""}${formatCurrency(priceDifference)}
      </p>
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;">
      <tr>
        <td style="padding-bottom:10px;">
          <p style="margin:0; font-size:12px; color:#92400e; font-weight:600;">Prix actuel :</p>
          <p style="margin:4px 0 0; font-size:14px; color:#1f2937;">${modificationInfo.originalTotalPrice != null ? formatCurrency(modificationInfo.originalTotalPrice) : "N/A"}</p>
        </td>
        <td style="padding-bottom:10px; text-align:right;">
          <p style="margin:0; font-size:12px; color:#92400e; font-weight:600;">Nouveau prix :</p>
          <p style="margin:4px 0 0; font-size:14px; font-weight:600; color:#1f2937;">${totalFormatted}</p>
        </td>
      </tr>
    </table>
  `;
}

function renderDepositDifference(
  depositDiff: number | null,
  modificationInfo: ModificationInfo,
  depositFormatted: string
): string {
  if (depositDiff === null || depositDiff === 0) return "";

  const paymentStatusSection = depositDiff > 0
    ? renderAdditionalPaymentStatus(depositDiff, modificationInfo)
    : renderRefundStatus(depositDiff, modificationInfo);

  return `
    <div style="margin-bottom:16px; padding:14px; background-color:#ffffff; border-radius:12px; border:1px solid ${depositDiff > 0 ? "#fbbf24" : "#86efac"};">
      <p style="margin:0 0 8px; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#92400e; font-weight:600;">Différence d'acompte</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding-bottom:8px;">
            <p style="margin:0; font-size:12px; color:#64748b;">Acompte actuel (30%) :</p>
            <p style="margin:4px 0 0; font-size:14px; color:#1f2937;">${modificationInfo.originalDepositPaid != null ? formatCurrency(modificationInfo.originalDepositPaid) : "N/A"}</p>
          </td>
          <td style="padding-bottom:8px; text-align:right;">
            <p style="margin:0; font-size:12px; color:#64748b;">Nouvel acompte (30%) :</p>
            <p style="margin:4px 0 0; font-size:14px; font-weight:600; color:#1f2937;">${depositFormatted}</p>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:8px; border-top:1px solid #e2e8f0;">
            <p style="margin:0; font-size:14px; font-weight:600; color:${depositDiff > 0 ? "#dc2626" : "#16a34a"};">
              ${depositDiff > 0 ? "+" : ""}${formatCurrency(depositDiff)}
            </p>
          </td>
        </tr>
      </table>
      ${paymentStatusSection}
    </div>
  `;
}

function renderAdditionalPaymentStatus(
  depositDiff: number,
  modificationInfo: ModificationInfo
): string {
  if (modificationInfo.paymentConfirmed) {
    return `
      <div style="margin-top:12px; padding:12px; background-color:#d1fae5; border-radius:8px; border:1px solid #86efac;">
        <p style="margin:0 0 6px; font-size:13px; font-weight:600; color:#065f46;">✅ Paiement supplémentaire confirmé</p>
        <p style="margin:0; font-size:12px; color:#065f46;">
          Vous avez déjà payé ${modificationInfo.originalDepositPaid != null ? formatCurrency(modificationInfo.originalDepositPaid) : "N/A"} d'acompte.
        </p>
        <p style="margin:8px 0 0; font-size:14px; font-weight:600; color:#065f46; text-align:center;">
          ✅ Votre paiement supplémentaire de ${formatCurrency(depositDiff)} a été effectué avec succès.
        </p>
        ${modificationInfo.securityDepositPaid && modificationInfo.securityDepositPaid > 0 ? `
        <p style="margin:8px 0 0; font-size:11px; color:#065f46;">
          ℹ️ La caution de garantie (${formatCurrency(modificationInfo.securityDepositPaid)}) a déjà été payée et ne sera pas redemandée.
        </p>
        ` : ""}
      </div>
    `;
  }

  if (modificationInfo.paymentUrl) {
    return `
      <div style="margin-top:12px; padding:12px; background-color:#fef3c7; border-radius:8px; border:1px solid #fbbf24;">
        <p style="margin:0 0 6px; font-size:13px; font-weight:600; color:#92400e;">💳 Paiement supplémentaire requis</p>
        <p style="margin:0; font-size:12px; color:#92400e;">
          Vous avez déjà payé ${modificationInfo.originalDepositPaid != null ? formatCurrency(modificationInfo.originalDepositPaid) : "N/A"} d'acompte.
        </p>
        <p style="margin:8px 0 0; font-size:14px; font-weight:600; color:#92400e; text-align:center;">
          ✅ Vous devrez payer uniquement la différence : ${formatCurrency(depositDiff)}
        </p>
        ${modificationInfo.securityDepositPaid && modificationInfo.securityDepositPaid > 0 ? `
        <p style="margin:8px 0 0; font-size:11px; color:#92400e;">
          ℹ️ La caution de garantie (${formatCurrency(modificationInfo.securityDepositPaid)}) a déjà été payée et ne sera pas redemandée.
        </p>
        ` : ""}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:12px auto 0;">
          <tr>
            <td align="center" style="background-color:#f97316; border-radius:8px;">
              <a href="${modificationInfo.paymentUrl}" style="display:inline-block; padding:10px 20px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">Payer maintenant ${formatCurrency(depositDiff)}</a>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  return `
    <div style="margin-top:12px; padding:12px; background-color:#fef3c7; border-radius:8px; border:1px solid #fbbf24;">
      <p style="margin:0 0 6px; font-size:13px; font-weight:600; color:#92400e;">💳 Paiement supplémentaire prévu</p>
      <p style="margin:0; font-size:12px; color:#92400e;">
        Vous avez déjà payé ${modificationInfo.originalDepositPaid != null ? formatCurrency(modificationInfo.originalDepositPaid) : "N/A"} d'acompte.
      </p>
      <p style="margin:8px 0 0; font-size:14px; font-weight:600; color:#92400e; text-align:center;">
        ⏳ Un paiement supplémentaire de ${formatCurrency(depositDiff)} sera demandé après validation de votre demande par notre équipe.
      </p>
      ${modificationInfo.securityDepositPaid && modificationInfo.securityDepositPaid > 0 ? `
      <p style="margin:8px 0 0; font-size:11px; color:#92400e;">
        ℹ️ La caution de garantie (${formatCurrency(modificationInfo.securityDepositPaid)}) a déjà été payée et ne sera pas redemandée.
      </p>
      ` : ""}
    </div>
  `;
}

function renderRefundStatus(
  depositDiff: number,
  modificationInfo: ModificationInfo
): string {
  const refundAmount = Math.abs(depositDiff);
  const isRefunded = modificationInfo.refundAmount != null;

  return `
    <div style="margin-top:12px; padding:12px; background-color:#d1fae5; border-radius:8px; border:1px solid #86efac;">
      <p style="margin:0 0 6px; font-size:13px; font-weight:600; color:#065f46;">💰 Remboursement ${isRefunded ? "effectué" : "prévu"}</p>
      <p style="margin:0; font-size:12px; color:#065f46;">
        ${isRefunded
          ? `Un remboursement de ${formatCurrency(refundAmount)} a été effectué et sera crédité sur votre compte sous 5-10 jours ouvrés.`
          : `Un remboursement de ${formatCurrency(refundAmount)} sera effectué sous 5-10 jours ouvrés.`
        }
      </p>
      ${isRefunded ? `
      <p style="margin:8px 0 0; font-size:11px; color:#065f46; font-style:italic;">
        ✅ Le remboursement a été initié automatiquement via Stripe.
      </p>
      ` : ""}
    </div>
  `;
}

function renderRemainingDifference(
  remainingDiff: number | null,
  modificationInfo: ModificationInfo,
  remainingFormatted: string
): string {
  if (remainingDiff === null || remainingDiff === 0) return "";

  return `
    <div style="padding:14px; background-color:#ffffff; border-radius:12px; border:1px solid ${remainingDiff > 0 ? "#fbbf24" : "#86efac"};">
      <p style="margin:0 0 8px; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#92400e; font-weight:600;">Différence de solde</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding-bottom:8px;">
            <p style="margin:0; font-size:12px; color:#64748b;">Ancien solde à payer :</p>
            <p style="margin:4px 0 0; font-size:14px; color:#1f2937;">${modificationInfo.originalRemainingAmount != null ? formatCurrency(modificationInfo.originalRemainingAmount) : "N/A"}</p>
          </td>
          <td style="padding-bottom:8px; text-align:right;">
            <p style="margin:0; font-size:12px; color:#64748b;">Nouveau solde à payer :</p>
            <p style="margin:4px 0 0; font-size:14px; font-weight:600; color:#1f2937;">${remainingFormatted}</p>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:8px; border-top:1px solid #e2e8f0;">
            <p style="margin:0; font-size:14px; font-weight:600; color:${remainingDiff > 0 ? "#dc2626" : "#16a34a"};">
              ${remainingDiff > 0 ? "+" : ""}${formatCurrency(remainingDiff)}
            </p>
          </td>
        </tr>
      </table>
      ${remainingDiff > 0 ? `
      <p style="margin:12px 0 0; font-size:12px; color:#92400e;">
        ⚠️ Solde à payer augmenté<br>
        Vous devrez payer ${formatCurrency(remainingDiff)} de plus à la remise du véhicule qu'initialement prévu.
      </p>
      ` : ""}
    </div>
  `;
}

