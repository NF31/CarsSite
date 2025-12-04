import { BookingStatus } from "@/lib/types/booking-status";

/**
 * Types pour les emails d'authentification
 */
export interface AuthEmailParams {
  email: string;
  name: string;
  token: string;
}

/**
 * Types pour les emails de réservation
 */
export interface BookingConfirmationEmailParams {
  to: string;
  name: string;
  greeting: string;
  booking: {
    reference: string;
    totalPrice: number;
    depositPaid: number;
    remainingAmount: number;
    securityDepositPaid?: number; // Caution de garantie payée (optionnel)
    startDate: Date;
    endDate: Date;
    status: BookingStatus;
    period: string;
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

export interface BookingUpdateEmailParams {
  to: string;
  name: string;
  greeting: string;
  booking: {
    reference: string;
    totalPrice: number;
    depositPaid: number;
    remainingAmount: number;
    startDate: Date;
    endDate: Date;
    status: BookingStatus;
    period: string;
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
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

export interface BookingReminderEmailParams {
  to: string;
  name: string;
  greeting: string;
  booking: {
    reference: string;
    totalPrice: number;
    depositPaid: number;
    remainingAmount: number;
    startDate: Date;
    endDate: Date;
    period: string;
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
}

export interface BookingCancellationRejectedEmailParams {
  to: string;
  name: string;
  greeting: string;
  booking: {
    reference: string;
    totalPrice: number;
    depositPaid: number;
    remainingAmount: number;
    startDate: Date;
    endDate: Date;
    period: string;
    reason?: string | null;
    rejectionReason?: string | null; // Message de refus de l'admin
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
}

export interface BookingCancellationRequestEmailParams {
  to: string;
  name: string;
  greeting: string;
  booking: {
    reference: string;
    period: string;
    reason?: string | null;
  };
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
    refund: number;
    retained: number;
  };
  policy: string;
}

export interface BookingCancellationEmailParams {
  to: string;
  name: string;
  greeting: string;
  booking: {
    reference: string;
    totalPrice: number;
    depositPaid: number;
    remainingAmount: number;
    startDate: Date;
    endDate: Date;
    refundAmount: number;
    refundRate: number;
    refundLabel: string;
    retentionAmount: number;
    period: string;
    reason?: string | null;
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
  policy: string;
}

/**
 * Types pour les emails de contact
 */
export interface ContactEmailParams {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/**
 * Type de retour standard pour les fonctions de queue
 */
export interface QueueEmailResult {
  success: boolean;
  queued: boolean;
}

