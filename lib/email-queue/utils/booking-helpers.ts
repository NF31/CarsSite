import { BookingStatus } from "@/lib/types/booking-status";
import type { BookingUpdateEmailParams } from "../types";

/**
 * Helpers pour la logique de booking dans les emails
 */

/**
 * Génère les labels de statut pour les emails de booking
 */
export function getBookingStatusLabels(
  status: BookingStatus,
  isPendingWithPayment = false
): Record<BookingStatus, string> {
  return {
    [BookingStatus.PENDING]: isPendingWithPayment ? "En attente de paiement" : "En attente",
    [BookingStatus.CONFIRMED]: "Confirmée",
    [BookingStatus.IN_PROGRESS]: "En cours",
    [BookingStatus.COMPLETED]: "Terminée",
    [BookingStatus.CANCELLED]: "Annulée",
  };
}

/**
 * Génère les couleurs de statut pour les emails de booking
 */
export function getBookingStatusColors(): Record<
  BookingStatus,
  { text: string; background: string }
> {
  return {
    [BookingStatus.PENDING]: { text: "#92400e", background: "#fef3c7" },
    [BookingStatus.CONFIRMED]: { text: "#1d4ed8", background: "#dbeafe" },
    [BookingStatus.IN_PROGRESS]: { text: "#7c3aed", background: "#ede9fe" },
    [BookingStatus.COMPLETED]: { text: "#065f46", background: "#d1fae5" },
    [BookingStatus.CANCELLED]: { text: "#991b1b", background: "#fee2e2" },
  };
}

/**
 * Génère les messages de statut pour les emails de booking update
 */
export function getBookingStatusMessages(
  status: BookingStatus,
  isPendingWithPayment: boolean,
  isRejection: boolean,
  hasModificationInfo: boolean
): Record<BookingStatus, string> {
  return {
    [BookingStatus.PENDING]: isPendingWithPayment
      ? "Bonne nouvelle ! Nous avons validé votre demande de modification. Pour finaliser votre réservation, veuillez effectuer le paiement supplémentaire requis."
      : "Votre demande de modification a bien été prise en compte et reste en attente de validation. Nous reviendrons vers vous sous peu.",
    [BookingStatus.CONFIRMED]: isRejection
      ? "Nous sommes désolés : nous n'avons pas pu accepter votre demande de modification. Les dates originales ont été restaurées et votre réservation reste confirmée avec les informations initiales."
      : hasModificationInfo
      ? "Bonne nouvelle ! Nous avons validé votre demande de modification. Les nouvelles dates ainsi que les informations ci-dessous sont désormais confirmées."
      : "Bonne nouvelle ! Votre réservation a été confirmée. Toutes les informations ci-dessous sont désormais validées. Votre véhicule vous attend pour la période indiquée.",
    [BookingStatus.IN_PROGRESS]:
      "Les nouvelles dates de votre réservation ont été intégrées. Votre véhicule vous attend pour la période indiquée ci-dessous.",
    [BookingStatus.COMPLETED]:
      "Votre réservation a été mise à jour et terminée. Retrouvez ci-dessous le récapitulatif des informations finales.",
    [BookingStatus.CANCELLED]:
      "Nous sommes désolés : nous n'avons pas pu accepter votre demande de modification. La réservation a été annulée. N'hésitez pas à nous contacter pour envisager une autre solution.",
  };
}

/**
 * Type pour le contenu hero des emails
 */
export interface HeroContent {
  title: string;
  subtitle: string;
  badge: string;
  gradientFrom: string;
  gradientTo: string;
  ctaLabel: string;
  ctaMutedLabel?: string;
}

/**
 * Génère le contenu hero pour les emails de booking update
 */
export function getBookingHeroContent(
  status: BookingStatus,
  isPendingWithPayment: boolean,
  isRejection: boolean,
  modificationInfo?: BookingUpdateEmailParams["modificationInfo"]
): Record<BookingStatus, HeroContent> {
  return {
    [BookingStatus.PENDING]: {
      title: isPendingWithPayment ? "Paiement supplémentaire requis" : "Modification en attente",
      subtitle: isPendingWithPayment
        ? "Votre demande est validée ! Effectuez le paiement pour finaliser votre réservation."
        : "Nous traitons votre demande et reviendrons vers vous rapidement.",
      badge: isPendingWithPayment ? "Paiement requis" : "Demande reçue",
      gradientFrom: isPendingWithPayment ? "#f59e0b" : "#fbbf24",
      gradientTo: isPendingWithPayment ? "#d97706" : "#f59e0b",
      ctaLabel: "Suivre ma réservation",
      ctaMutedLabel: "Besoin d'aide ? Répondez directement à ce message.",
    },
    [BookingStatus.CONFIRMED]: {
      title: isRejection
        ? "Votre demande de modification a été refusée"
        : modificationInfo?.paymentConfirmed === true
        ? "Paiement supplémentaire confirmé !"
        : modificationInfo
        ? "Votre demande est validée !"
        : "Votre réservation est confirmée !",
      subtitle: isRejection
        ? "Les dates originales ont été restaurées. Votre réservation reste confirmée avec les informations initiales."
        : modificationInfo?.paymentConfirmed === true
        ? "Votre paiement supplémentaire pour la modification a été effectué avec succès"
        : modificationInfo
        ? "Les nouvelles dates sont confirmées, retrouvez le détail ci-dessous."
        : "Toutes les informations sont validées, retrouvez le détail ci-dessous.",
      badge: isRejection
        ? "Demande refusée"
        : modificationInfo?.paymentConfirmed === true
        ? "Paiement confirmé"
        : modificationInfo
        ? "Demande acceptée"
        : "Réservation confirmée",
      gradientFrom: isRejection ? "#ef4444" : "#0ea5e9",
      gradientTo: isRejection ? "#b91c1c" : "#0284c7",
      ctaLabel: "Voir la réservation mise à jour",
    },
    [BookingStatus.IN_PROGRESS]: {
      title: "Votre trajet démarre bientôt",
      subtitle: "Retrouvez toutes les informations utiles avant votre départ.",
      badge: "Réservation active",
      gradientFrom: "#7c3aed",
      gradientTo: "#5b21b6",
      ctaLabel: "Consulter les détails",
    },
    [BookingStatus.COMPLETED]: {
      title: "Réservation finalisée",
      subtitle: "Merci d'avoir voyagé avec nous. Voici le récapitulatif final.",
      badge: "Trajet terminé",
      gradientFrom: "#10b981",
      gradientTo: "#059669",
      ctaLabel: "Voir mon historique",
    },
    [BookingStatus.CANCELLED]: {
      title: "Nous n'avons pas pu valider votre demande",
      subtitle: "Nous restons disponibles pour vous proposer une alternative.",
      badge: "Demande refusée",
      gradientFrom: "#ef4444",
      gradientTo: "#b91c1c",
      ctaLabel: "Contacter le support",
      ctaMutedLabel: "Une question ? Répondez à cet email et nous vous aiderons rapidement.",
    },
  };
}

/**
 * Génère le sujet de l'email pour les emails de booking update
 */
export function getBookingUpdateEmailSubject(
  reference: string,
  status: BookingStatus,
  isPendingWithPayment: boolean,
  isRejection: boolean,
  modificationInfo?: BookingUpdateEmailParams["modificationInfo"]
): string {
  switch (status) {
    case BookingStatus.PENDING:
      return isPendingWithPayment
        ? `Demande acceptée - Réservation ${reference}`
        : `Demande de modification reçue - Réservation ${reference}`;
    case BookingStatus.CONFIRMED:
      if (isRejection) {
        return `Demande refusée - Réservation ${reference}`;
      }
      if (modificationInfo?.paymentConfirmed === true) {
        return `Paiement supplémentaire confirmé - Réservation ${reference}`;
      }
      if (
        modificationInfo?.additionalPaymentAmount != null &&
        modificationInfo.additionalPaymentAmount > 0 &&
        !modificationInfo.paymentConfirmed
      ) {
        return `Paiement supplémentaire requis - Réservation ${reference}`;
      }
      if (modificationInfo?.refundAmount != null && modificationInfo.refundAmount > 0) {
        return `Remboursement effectué - Réservation ${reference}`;
      }
      if (modificationInfo) {
        return `Demande acceptée - Réservation ${reference}`;
      }
      return `Réservation confirmée - ${reference}`;
    case BookingStatus.CANCELLED:
      return `Demande refusée - Réservation ${reference}`;
    case BookingStatus.IN_PROGRESS:
      return `Réservation mise à jour - ${reference}`;
    case BookingStatus.COMPLETED:
      return `Réservation finalisée - ${reference}`;
    default:
      return `Votre réservation ${reference} a été mise à jour`;
  }
}

/**
 * Détecte si c'est un PENDING avec paiement nécessaire
 */
export function isPendingWithPaymentRequired(
  status: BookingStatus,
  modificationInfo?: BookingUpdateEmailParams["modificationInfo"]
): boolean {
  return (
    status === BookingStatus.PENDING &&
    modificationInfo?.paymentUrl != null &&
    modificationInfo?.additionalPaymentAmount != null &&
    modificationInfo.additionalPaymentAmount > 0
  );
}

/**
 * Détecte si c'est un refus de modification
 */
export function isModificationRejection(rejectionReason?: string | null): boolean {
  return rejectionReason != null && rejectionReason.trim() !== "";
}

