export interface ModificationInfo {
  originalTotalPrice?: number;
  originalDepositPaid?: number;
  originalRemainingAmount?: number;
  depositDifference?: number;
  refundAmount?: number;
  additionalPaymentAmount?: number;
  paymentUrl?: string;
  securityDepositPaid?: number;
  paymentConfirmed?: boolean;
}

export interface PricingInfo {
  total: number;
  deposit: number;
  remaining: number;
}

/**
 * Vérifie si les informations de modification doivent être affichées
 */
export function shouldShowModificationInfo(
  modificationInfo: ModificationInfo | undefined,
  rejectionReason: string | null | undefined
): boolean {
  const isRejection = rejectionReason != null && rejectionReason.trim() !== "";
  
  if (isRejection || !modificationInfo) {
    return false;
  }

  return (
    modificationInfo.originalTotalPrice != null ||
    modificationInfo.originalDepositPaid != null ||
    modificationInfo.depositDifference != null ||
    modificationInfo.originalRemainingAmount != null ||
    modificationInfo.refundAmount != null ||
    modificationInfo.additionalPaymentAmount != null ||
    modificationInfo.securityDepositPaid != null ||
    modificationInfo.paymentUrl != null
  );
}

/**
 * Calcule la différence de prix total
 */
export function calculatePriceDifference(
  currentTotal: number,
  originalTotal: number | null | undefined
): number | null {
  if (originalTotal == null) return null;
  return currentTotal - originalTotal;
}

/**
 * Calcule la différence de solde restant
 */
export function calculateRemainingDifference(
  currentRemaining: number,
  originalRemaining: number | null | undefined
): number | null {
  if (originalRemaining == null) return null;
  return currentRemaining - originalRemaining;
}

