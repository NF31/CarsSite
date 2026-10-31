/**
 * Contenu du champ JSON Payment.metadata (données de la passerelle de paiement)
 */
export interface PaymentMetadata {
  isModificationPayment?: boolean;
  downPayment?: number;
  securityDeposit?: number;
  [key: string]: unknown;
}
