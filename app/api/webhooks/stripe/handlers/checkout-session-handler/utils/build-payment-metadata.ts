import type { PaymentType } from "../../../types";

interface BuildPaymentMetadataParams {
  paymentType: PaymentType;
  roundedAmountPaid: number;
  roundedDownPayment: number;
  roundedSecurityDeposit: number;
  sessionId: string;
  paymentIntentId?: string;
}

export function buildPaymentMetadata({
  paymentType,
  roundedAmountPaid,
  roundedDownPayment,
  roundedSecurityDeposit,
  sessionId,
  paymentIntentId,
}: BuildPaymentMetadataParams): {
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  paymentType: string;
  isModificationPayment: boolean;
  downPayment: number;
  securityDeposit: number;
  amountPaid: number;
} {
  let metadataDownPayment: number;
  let metadataSecurityDeposit: number;

  if (paymentType.isModificationPayment) {
    metadataDownPayment = roundedAmountPaid;
    metadataSecurityDeposit = 0;
  } else if (paymentType.isAuthorization) {
    metadataDownPayment = 0;
    metadataSecurityDeposit = roundedSecurityDeposit;
  } else if (paymentType.isDepositOnly) {
    metadataDownPayment = roundedDownPayment;
    metadataSecurityDeposit = 0;
  } else {
    metadataDownPayment = roundedDownPayment;
    metadataSecurityDeposit = roundedSecurityDeposit;
  }

  return {
    stripeSessionId: sessionId,
    stripePaymentIntentId: paymentIntentId,
    paymentType: paymentType.type,
    isModificationPayment: paymentType.isModificationPayment,
    downPayment: metadataDownPayment,
    securityDeposit: metadataSecurityDeposit,
    amountPaid: roundedAmountPaid,
  };
}


