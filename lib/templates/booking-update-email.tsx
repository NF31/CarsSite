import { getGreeting } from "@/lib/email/utils/greeting";
import { formatCurrency } from "@/lib/email/utils/format-currency";
import { renderEmailBase } from "./email-base";
import {
  shouldShowModificationInfo,
  calculatePriceDifference,
  calculateRemainingDifference,
  type ModificationInfo,
} from "./booking-update-email/helpers";

// Ré-exporter le type pour compatibilité
export type { ModificationInfo } from "./booking-update-email/helpers";
import { renderHeroSection } from "./booking-update-email/sections/hero-section";
import { renderRejectionSection } from "./booking-update-email/sections/rejection-section";
import { renderSummarySection } from "./booking-update-email/sections/summary-section";
import { renderBookingDetailsSection } from "./booking-update-email/sections/booking-details-section";
import { renderPricingSection } from "./booking-update-email/sections/pricing-section";
import { renderPriceComparisonSection } from "./booking-update-email/sections/price-comparison-section";
import { renderFooterSection } from "./booking-update-email/sections/footer-section";

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
  modificationInfo?: ModificationInfo;
  rejectionReason?: string | null;
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
  const secondaryCtaLabel = ctaMutedLabel ?? "Besoin d'aide ? Contactez-nous";
  const isRejection = rejectionReason != null && rejectionReason.trim() !== "";
  const hasModificationInfo = shouldShowModificationInfo(modificationInfo, rejectionReason);
  
  const priceDifference = hasModificationInfo && modificationInfo
    ? calculatePriceDifference(pricing.total, modificationInfo.originalTotalPrice)
    : null;
  
  const depositDiff = modificationInfo?.depositDifference ?? null;
  
  const remainingDiff = hasModificationInfo && modificationInfo
    ? calculateRemainingDifference(pricing.remaining, modificationInfo.originalRemainingAmount)
    : null;

  // Construction du contenu HTML
  const bodyContent = `
    ${renderHeroSection({
      heroBadge,
      heroTitle,
      heroSubtitle,
      reference,
      heroGradientFrom,
      heroGradientTo,
    })}
    <tr>
      <td style="padding:28px 24px 32px; color:#1f2937;">
        <h2 style="margin:0 0 16px; font-size:20px; font-weight:600; color:#0f172a;">${finalGreeting} ${name},</h2>
        <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#4b5563;">${statusMessage}</p>

        ${rejectionReason ? renderRejectionSection(rejectionReason) : ""}

        ${renderSummarySection({ period, status, isRejection })}

        ${renderBookingDetailsSection({ vehicle, locations })}

        ${renderPricingSection({
          pricing,
          hasModificationInfo,
          modificationInfo,
        })}

        ${hasModificationInfo && modificationInfo ? renderPriceComparisonSection({
          pricing,
          modificationInfo,
          priceDifference,
          depositDiff,
          remainingDiff,
        }) : ""}

        ${renderFooterSection({
          dashboardUrl,
          ctaLabel,
          secondaryCtaLabel,
        })}
      </td>
    </tr>
  `;

  // Génération du texte brut
  const totalFormatted = formatCurrency(pricing.total);
  const depositFormatted = formatCurrency(pricing.deposit);
  const remainingFormatted = formatCurrency(pricing.remaining);

  const textContent = `
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
L'équipe CarRental
`;

  return {
    html: renderEmailBase({
      title: `Mise à jour de votre réservation ${reference}`,
      bodyContent,
    }),
    text: textContent,
  };
}
