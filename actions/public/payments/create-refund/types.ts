/**
 * Types pour la création de remboursements
 */

export interface PaymentMetadata {
  isModificationPayment?: boolean;
  stripePaymentIntentId?: string;
  [key: string]: unknown;
}

export interface CreateRefundInput {
  bookingId: string;
  amount: number; // Montant en euros
  reason: string; // "booking_modification" | "cancellation" | etc.
}

export interface CreateRefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
  warning?: string; // Message d'avertissement pour les remboursements partiels
}

export interface PaymentData {
  id: string;
  amount: number;
  status: string;
  method: string;
  transactionId: string | null;
  metadata: PaymentMetadata | null;
  createdAt: Date;
}

export interface BookingWithPayments {
  id: string;
  userId: string;
  reference: string;
  depositPaid: number | null;
  originalDepositPaid: number | null;
  payments: PaymentData[];
}

export interface RefundableAmountInfo {
  refundableAmount: number;
  effectivePaymentAmount: number;
  finalRefundableAmount: number;
  totalRefunded: number;
  originalAmount: number;
}

export interface PaymentSearchResult {
  payment: PaymentData;
  paymentIntentId: string;
  refundableAmount?: number;
}

