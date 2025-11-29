import { getGreeting } from "@/lib/email/utils/greeting";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

interface BookingUpdateTemplateParams {
  greeting?: string;
  name: string;
  reference: string;
  period: string;
  statusMessage: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  heroGradientFrom: string;
  heroGradientTo: string;
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
  status: {
    label: string;
    textColor: string;
    backgroundColor: string;
  };
  dashboardUrl: string;
  ctaLabel: string;
  ctaMutedLabel?: string;
  modificationInfo?: {
    originalTotalPrice?: number;
    originalDepositPaid?: number;
    originalRemainingAmount?: number;
    depositDifference?: number;
    refundAmount?: number;
    additionalPaymentAmount?: number;
    paymentUrl?: string;
    securityDepositPaid?: number;
    paymentConfirmed?: boolean; // Indique si le paiement supplémentaire a été confirmé (webhook)
  };
  rejectionReason?: string | null; // Message de refus de l'admin (pour les modifications refusées)
}

export function getBookingUpdateEmailTemplate({
  greeting,
  name,
  reference,
  period,
  statusMessage,
  heroTitle,
  heroSubtitle,
  heroBadge,
  heroGradientFrom,
  heroGradientTo,
  vehicle,
  locations,
  pricing,
  status,
  dashboardUrl,
  ctaLabel,
  ctaMutedLabel,
  modificationInfo,
  rejectionReason,
}: BookingUpdateTemplateParams) {
  const finalGreeting = greeting ?? getGreeting();
  const totalFormatted = formatCurrency(pricing.total);
  const depositFormatted = formatCurrency(pricing.deposit);
  const remainingFormatted = formatCurrency(pricing.remaining);
  const secondaryCtaLabel = ctaMutedLabel ?? "Besoin d'aide ? Contactez-nous";
  
  // Vérifier si c'est un refus (ne pas afficher la comparaison des prix dans ce cas)
  const isRejection = rejectionReason != null && rejectionReason.trim() !== "";
  
  // Calculer les différences si modificationInfo est présent ET que ce n'est PAS un refus
  // On vérifie que modificationInfo existe ET qu'il contient au moins une valeur significative
  // On accepte même les valeurs à 0 car elles peuvent être valides (ex: remboursement complet)
  // IMPORTANT: Vérifier aussi que les valeurs ne sont pas null (en plus de undefined)
  // Simplifié: Si modificationInfo existe, on considère qu'on a des données de modification
  // MAIS on ne montre pas la comparaison si c'est un refus
  const hasModificationInfo = !isRejection && !!modificationInfo && (
    modificationInfo.originalTotalPrice != null ||
    modificationInfo.originalDepositPaid != null ||
    modificationInfo.depositDifference != null ||
    modificationInfo.originalRemainingAmount != null ||
    modificationInfo.refundAmount != null ||
    modificationInfo.additionalPaymentAmount != null ||
    modificationInfo.securityDepositPaid != null ||
    modificationInfo.paymentUrl != null
  );
  
  // Log pour déboguer
  if (modificationInfo) {
    console.log(`\n📧 [Email Template] ==========================================`);
    console.log(`📧 [Email Template] Vérification de modificationInfo`);
    console.log(`📧 [Email Template] ==========================================`);
    console.log(`📧 [Email Template] modificationInfo existe: ${!!modificationInfo}`);
    console.log(`📧 [Email Template] hasModificationInfo: ${hasModificationInfo}`);
    console.log(`📧 [Email Template] Détails:`);
    console.log(`   - originalTotalPrice: ${modificationInfo.originalTotalPrice ?? "undefined"} (type: ${typeof modificationInfo.originalTotalPrice})`);
    console.log(`   - originalDepositPaid: ${modificationInfo.originalDepositPaid ?? "undefined"} (type: ${typeof modificationInfo.originalDepositPaid})`);
    console.log(`   - depositDifference: ${modificationInfo.depositDifference ?? "undefined"} (type: ${typeof modificationInfo.depositDifference})`);
    console.log(`   - originalRemainingAmount: ${modificationInfo.originalRemainingAmount ?? "undefined"} (type: ${typeof modificationInfo.originalRemainingAmount})`);
    console.log(`   - refundAmount: ${modificationInfo.refundAmount ?? "undefined"} (type: ${typeof modificationInfo.refundAmount})`);
    console.log(`   - additionalPaymentAmount: ${modificationInfo.additionalPaymentAmount ?? "undefined"} (type: ${typeof modificationInfo.additionalPaymentAmount})`);
    console.log(`   - securityDepositPaid: ${modificationInfo.securityDepositPaid ?? "undefined"} (type: ${typeof modificationInfo.securityDepositPaid})`);
    console.log(`📧 [Email Template] ==========================================`);
  } else {
    console.log(`\n📧 [Email Template] ⚠️  modificationInfo est undefined/null`);
  }
  
  const priceDifference = hasModificationInfo && modificationInfo?.originalTotalPrice != null
    ? pricing.total - modificationInfo.originalTotalPrice
    : null;
  
  const depositDiff = modificationInfo?.depositDifference != null ? modificationInfo.depositDifference : null;
  
  // Log pour déboguer
  if (modificationInfo) {
    console.log(`📧 [Email Template] Calculs de différences:`);
    console.log(`   - pricing.total: ${pricing.total}€`);
    console.log(`   - modificationInfo.originalTotalPrice: ${modificationInfo.originalTotalPrice ?? "undefined"}€`);
    console.log(`   - priceDifference: ${priceDifference !== null ? priceDifference + "€" : "null"}`);
    console.log(`   - depositDiff: ${depositDiff !== null ? depositDiff + "€" : "null"}`);
    console.log(`   - hasModificationInfo: ${hasModificationInfo}`);
    console.log(`📧 [Email Template] depositDiff calculé:`, {
      depositDifference: modificationInfo.depositDifference,
      depositDiff: depositDiff,
      refundAmount: modificationInfo.refundAmount,
    });
  }
  const remainingDiff = hasModificationInfo && 
    modificationInfo?.originalRemainingAmount != null
    ? pricing.remaining - modificationInfo.originalRemainingAmount
    : null;

  // Log final pour vérifier les valeurs avant génération du HTML
  console.log(`\n📧 [Email Template] ==========================================`);
  console.log(`📧 [Email Template] 🎯 GÉNÉRATION DU HTML`);
  console.log(`📧 [Email Template] ==========================================`);
  console.log(`📧 [Email Template] hasModificationInfo: ${hasModificationInfo}`);
  console.log(`📧 [Email Template] priceDifference: ${priceDifference !== null ? priceDifference + "€" : "null"}`);
  console.log(`📧 [Email Template] depositDiff: ${depositDiff !== null ? depositDiff + "€" : "null"}`);
  console.log(`📧 [Email Template] remainingDiff: ${remainingDiff !== null ? remainingDiff + "€" : "null"}`);
  if (modificationInfo) {
    console.log(`📧 [Email Template] modificationInfo.paymentUrl: ${modificationInfo.paymentUrl ? "✅ Présent" : "❌ Absent"}`);
  }
  console.log(`📧 [Email Template] ==========================================\n`);

  return {
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mise à jour de votre réservation ${reference}</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f3f4f6;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f4f6; padding:32px 0;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px; background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 24px 60px -30px rgba(2,132,199,0.25); font-family:'Geist Sans', Arial, sans-serif;">
                  <tr>
                    <td align="center" style="background:linear-gradient(135deg,${heroGradientFrom} 0%,${heroGradientTo} 100%); padding:32px 24px;">
                      <p style="margin:0; text-transform:uppercase; letter-spacing:2px; font-size:12px; color:rgba(255,255,255,0.75); font-weight:600;">${heroBadge}</p>
                      <h1 style="margin:12px 0 0; font-size:28px; line-height:1.3; color:#ffffff; font-weight:600;">${heroTitle}</h1>
                      <p style="margin:8px 0 0; font-size:16px; color:rgba(255,255,255,0.85);">${heroSubtitle}</p>
                      <p style="margin:14px 0 0; font-size:15px; color:rgba(255,255,255,0.9);">Référence <span style="font-weight:600;">${reference}</span></p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 24px 32px; color:#1f2937;">
                      <h2 style="margin:0 0 16px; font-size:20px; font-weight:600; color:#0f172a;">${finalGreeting} ${name},</h2>
                      <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#4b5563;">${statusMessage}</p>

                      ${rejectionReason ? `
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fef2f2; border:1px solid #fecaca; border-radius:16px; padding:18px 20px; margin:0 0 20px;">
                        <tr>
                          <td>
                            <p style="margin:0 0 10px; font-size:13px; text-transform:uppercase; letter-spacing:0.08em; color:#991b1b; font-weight:600;">Message de notre équipe</p>
                            <p style="margin:0; font-size:14px; line-height:1.6; color:#7f1d1d;">${rejectionReason}</p>
                          </td>
                        </tr>
                      </table>
                      ` : ""}

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                        <tr>
                          <td style="background-color:#f1f5f9; border-radius:18px; padding:16px 18px;">
                            <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#475569; font-weight:600;">${isRejection ? "Période conservée" : "Nouvelle période"}</p>
                            <p style="margin:10px 0 0; font-size:15px; color:#0f172a; font-weight:500;">${period}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="height:12px;"></td>
                        </tr>
                        <tr>
                          <td style="background-color:#ecfeff; border-radius:18px; padding:16px 18px;">
                            <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#0f172a; font-weight:600;">Statut mis à jour</p>
                            <span style="display:inline-block; margin-top:10px; padding:8px 14px; border-radius:9999px; font-size:13px; font-weight:600; color:${status.textColor}; background:${status.backgroundColor};">${status.label}</span>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:20px; padding:0; margin-bottom:24px;">
                        <tr>
                          <td style="padding:20px 22px;">
                            <h3 style="margin:0 0 12px; font-size:17px; font-weight:600; color:#0f172a;">Résumé actualisé</h3>
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
                                  <p style="margin:8px 0 0; font-size:14px; color:#1f2937;"><span style="font-weight:600; color:#0284c7;">Retrait :</span> ${locations.pickup}</p>
                                  <p style="margin:6px 0 0; font-size:14px; color:#1f2937;"><span style="font-weight:600; color:#0284c7;">Retour :</span> ${locations.return}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0f172a; border-radius:20px; margin-bottom:28px;">
                        <tr>
                          <td style="padding:22px; color:#ffffff;">
                            <h3 style="margin:0 0 14px; font-size:17px; font-weight:600;">Détails financiers</h3>
                            ${hasModificationInfo ? `
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td style="padding-bottom:12px;">
                                  <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.65); font-weight:600;">Montant total</p>
                                  <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.7); text-decoration:line-through;">${modificationInfo?.originalTotalPrice !== undefined ? formatCurrency(modificationInfo.originalTotalPrice) : "N/A"}</p>
                                  <p style="margin:4px 0 0; font-size:20px; font-weight:600; color:#ffffff;">${totalFormatted}</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding-bottom:12px;">
                                  <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.65); font-weight:600;">Acompte versé</p>
                                  <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.7); text-decoration:line-through;">${modificationInfo?.originalDepositPaid !== undefined ? formatCurrency(modificationInfo.originalDepositPaid) : "N/A"}</p>
                                  <p style="margin:4px 0 0; font-size:16px; color:#ffffff;">${depositFormatted}</p>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.65); font-weight:600;">Reste à payer</p>
                                  <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.7); text-decoration:line-through;">${modificationInfo?.originalRemainingAmount !== undefined ? formatCurrency(modificationInfo.originalRemainingAmount) : "N/A"}</p>
                                  <p style="margin:4px 0 0; font-size:16px; color:#ffffff;">${remainingFormatted}</p>
                                </td>
                              </tr>
                            </table>
                            ` : `
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
                            `}
                          </td>
                        </tr>
                      </table>

                      ${hasModificationInfo ? `
                      <!-- DEBUG: hasModificationInfo=${hasModificationInfo}, modificationInfo=${modificationInfo ? "présent" : "absent"} -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fff7ed; border:2px solid #fbbf24; border-radius:20px; margin-bottom:28px;">
                        <tr>
                          <td style="padding:22px;">
                            <h3 style="margin:0 0 16px; font-size:17px; font-weight:600; color:#92400e;">📊 Comparaison des prix</h3>
                            ${priceDifference !== null ? `
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
                                  <p style="margin:4px 0 0; font-size:14px; color:#1f2937;">${modificationInfo?.originalTotalPrice != null ? formatCurrency(modificationInfo.originalTotalPrice) : "N/A"}</p>
                                </td>
                                <td style="padding-bottom:10px; text-align:right;">
                                  <p style="margin:0; font-size:12px; color:#92400e; font-weight:600;">Nouveau prix :</p>
                                  <p style="margin:4px 0 0; font-size:14px; font-weight:600; color:#1f2937;">${totalFormatted}</p>
                                </td>
                              </tr>
                            </table>
                            ` : ""}
                            ${depositDiff !== null && depositDiff !== 0 ? `
                            <div style="margin-bottom:16px; padding:14px; background-color:#ffffff; border-radius:12px; border:1px solid ${depositDiff > 0 ? "#fbbf24" : "#86efac"};">
                              <p style="margin:0 0 8px; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#92400e; font-weight:600;">Différence d'acompte</p>
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                  <td style="padding-bottom:8px;">
                                    <p style="margin:0; font-size:12px; color:#64748b;">Acompte actuel (30%) :</p>
                                    <p style="margin:4px 0 0; font-size:14px; color:#1f2937;">${modificationInfo?.originalDepositPaid != null ? formatCurrency(modificationInfo.originalDepositPaid) : "N/A"}</p>
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
                              ${depositDiff > 0 ? `
                              ${modificationInfo?.paymentConfirmed ? `
                              <!-- Paiement confirmé : webhook a traité le paiement -->
                              <div style="margin-top:12px; padding:12px; background-color:#d1fae5; border-radius:8px; border:1px solid #86efac;">
                                <p style="margin:0 0 6px; font-size:13px; font-weight:600; color:#065f46;">✅ Paiement supplémentaire confirmé</p>
                                <p style="margin:0; font-size:12px; color:#065f46;">
                                  Vous avez déjà payé ${modificationInfo?.originalDepositPaid != null ? formatCurrency(modificationInfo.originalDepositPaid) : "N/A"} d'acompte.
                                </p>
                                <p style="margin:8px 0 0; font-size:14px; font-weight:600; color:#065f46; text-align:center;">
                                  ✅ Votre paiement supplémentaire de ${formatCurrency(depositDiff)} a été effectué avec succès.
                                </p>
                                ${modificationInfo?.securityDepositPaid && modificationInfo.securityDepositPaid > 0 ? `
                                <p style="margin:8px 0 0; font-size:11px; color:#065f46;">
                                  ℹ️ La caution de garantie (${formatCurrency(modificationInfo.securityDepositPaid)}) a déjà été payée et ne sera pas redemandée.
                                </p>
                                ` : ""}
                              </div>
                              ` : modificationInfo?.paymentUrl ? `
                              <!-- Admin a validé : afficher le bouton de paiement -->
                              <div style="margin-top:12px; padding:12px; background-color:#fef3c7; border-radius:8px; border:1px solid #fbbf24;">
                                <p style="margin:0 0 6px; font-size:13px; font-weight:600; color:#92400e;">💳 Paiement supplémentaire requis</p>
                                <p style="margin:0; font-size:12px; color:#92400e;">
                                  Vous avez déjà payé ${modificationInfo?.originalDepositPaid != null ? formatCurrency(modificationInfo.originalDepositPaid) : "N/A"} d'acompte.
                                </p>
                                <p style="margin:8px 0 0; font-size:14px; font-weight:600; color:#92400e; text-align:center;">
                                  ✅ Vous devrez payer uniquement la différence : ${formatCurrency(depositDiff)}
                                </p>
                                ${modificationInfo?.securityDepositPaid && modificationInfo.securityDepositPaid > 0 ? `
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
                              ` : `
                              <!-- Demande en attente : informer qu'un paiement sera demandé après validation -->
                              <div style="margin-top:12px; padding:12px; background-color:#fef3c7; border-radius:8px; border:1px solid #fbbf24;">
                                <p style="margin:0 0 6px; font-size:13px; font-weight:600; color:#92400e;">💳 Paiement supplémentaire prévu</p>
                                <p style="margin:0; font-size:12px; color:#92400e;">
                                  Vous avez déjà payé ${modificationInfo?.originalDepositPaid != null ? formatCurrency(modificationInfo.originalDepositPaid) : "N/A"} d'acompte.
                                </p>
                                <p style="margin:8px 0 0; font-size:14px; font-weight:600; color:#92400e; text-align:center;">
                                  ⏳ Un paiement supplémentaire de ${formatCurrency(depositDiff)} sera demandé après validation de votre demande par notre équipe.
                                </p>
                                ${modificationInfo?.securityDepositPaid && modificationInfo.securityDepositPaid > 0 ? `
                                <p style="margin:8px 0 0; font-size:11px; color:#92400e;">
                                  ℹ️ La caution de garantie (${formatCurrency(modificationInfo.securityDepositPaid)}) a déjà été payée et ne sera pas redemandée.
                                </p>
                                ` : ""}
                              </div>
                              `}
                              ` : depositDiff < 0 ? `
                              <div style="margin-top:12px; padding:12px; background-color:#d1fae5; border-radius:8px; border:1px solid #86efac;">
                                <p style="margin:0 0 6px; font-size:13px; font-weight:600; color:#065f46;">💰 Remboursement ${modificationInfo?.refundAmount ? "effectué" : "prévu"}</p>
                                <p style="margin:0; font-size:12px; color:#065f46;">
                                  ${modificationInfo?.refundAmount 
                                    ? `Un remboursement de ${formatCurrency(Math.abs(depositDiff))} a été effectué et sera crédité sur votre compte sous 5-10 jours ouvrés.`
                                    : `Un remboursement de ${formatCurrency(Math.abs(depositDiff))} sera effectué sous 5-10 jours ouvrés.`
                                  }
                                </p>
                                ${modificationInfo?.refundAmount ? `
                                <p style="margin:8px 0 0; font-size:11px; color:#065f46; font-style:italic;">
                                  ✅ Le remboursement a été initié automatiquement via Stripe.
                                </p>
                                ` : ""}
                              </div>
                              ` : ""}
                            </div>
                            ` : ""}
                            ${remainingDiff !== null && remainingDiff !== 0 ? `
                            <div style="padding:14px; background-color:#ffffff; border-radius:12px; border:1px solid ${remainingDiff > 0 ? "#fbbf24" : "#86efac"};">
                              <p style="margin:0 0 8px; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#92400e; font-weight:600;">Différence de solde</p>
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                  <td style="padding-bottom:8px;">
                                    <p style="margin:0; font-size:12px; color:#64748b;">Ancien solde à payer :</p>
                                    <p style="margin:4px 0 0; font-size:14px; color:#1f2937;">${modificationInfo?.originalRemainingAmount != null ? formatCurrency(modificationInfo.originalRemainingAmount) : "N/A"}</p>
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
                            ` : ""}
                          </td>
                        </tr>
                      </table>
                      ` : ""}

                      <p style="margin:0 0 22px; font-size:14px; line-height:1.6; color:#475569;">
                        Vous pouvez consulter les documents mis à jour et suivre l'évolution de votre réservation depuis votre espace client sécurisé.
                      </p>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 28px;">
                        <tr>
                          <td align="center" style="background-color:#0ea5e9; border-radius:9999px;">
                            <a href="${dashboardUrl}" style="display:inline-block; padding:14px 28px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none;">${ctaLabel}</a>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e2e8f0; padding-top:18px;">
                        <tr>
                          <td>
                            <p style="margin:0 0 10px; font-size:13px; color:#64748b;">
                              ${secondaryCtaLabel}
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

${statusMessage}

${isRejection ? "Période conservée" : "Nouvelle période"} : ${period}
Véhicule : ${vehicle.label} (${vehicle.licensePlate})
Prise en charge : ${locations.pickup}
Retour : ${locations.return}
Montant total : ${totalFormatted}
Acompte versé : ${depositFormatted}
Reste à payer : ${remainingFormatted}
Statut mis à jour : ${status.label}

Consultez les détails depuis votre espace client :
${dashboardUrl}

${secondaryCtaLabel}

À bientôt,
L’équipe CarRental
`,
  };
}

