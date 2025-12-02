import { roundAmount } from "../../../utils/helpers";

interface CalculateAmountsParams {
  downPayment: number;
  securityDeposit: number;
  remainingAmount: number;
  amountPaid: number;
}

export function calculateAmounts({
  downPayment,
  securityDeposit,
  remainingAmount,
  amountPaid,
}: CalculateAmountsParams): {
  roundedDownPayment: number;
  roundedSecurityDeposit: number;
  roundedRemainingAmount: number;
  roundedAmountPaid: number;
} {
  return {
    roundedDownPayment: roundAmount(downPayment),
    roundedSecurityDeposit: roundAmount(securityDeposit),
    roundedRemainingAmount: roundAmount(remainingAmount),
    roundedAmountPaid: roundAmount(amountPaid),
  };
}


