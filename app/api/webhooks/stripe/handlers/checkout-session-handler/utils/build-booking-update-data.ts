import { BookingStatus } from "@prisma/client";
import { roundAmount } from "../../../utils/helpers";
import type { BookingUpdateData, PaymentAmounts } from "../types";
import type { PaymentType } from "../../../types";

interface BuildBookingUpdateDataParams {
  paymentType: PaymentType;
  currentDepositPaid: number;
  currentSecurityDepositPaid: number;
  roundedDownPayment: number;
  roundedSecurityDeposit: number;
  roundedAmountPaid: number;
  totalPrice: number;
  roundedRemainingAmount: number;
}

export function buildBookingUpdateData({
  paymentType,
  currentDepositPaid,
  currentSecurityDepositPaid,
  roundedDownPayment,
  roundedSecurityDeposit,
  roundedAmountPaid,
  totalPrice,
  roundedRemainingAmount,
}: BuildBookingUpdateDataParams): {
  updateData: BookingUpdateData;
  emailAmounts: PaymentAmounts;
} {
  let updateData: BookingUpdateData = {};
  let emailDepositPaid: number = 0;
  let emailRemainingAmount: number = 0;

  if (paymentType.isModificationPayment) {
    const newDepositPaid = roundAmount(currentDepositPaid + roundedAmountPaid);
    const newRemainingAmount = roundAmount(totalPrice - newDepositPaid);
    emailDepositPaid = newDepositPaid;
    emailRemainingAmount = newRemainingAmount;

    updateData = {
      depositPaid: newDepositPaid,
      securityDepositPaid: currentSecurityDepositPaid,
      remainingAmount: newRemainingAmount,
      status: BookingStatus.CONFIRMED,
      modificationDepositDifference: null,
      originalStartDate: null,
      originalEndDate: null,
      originalTotalPrice: null,
      originalDepositPaid: null,
    };
  } else if (paymentType.isAuthorization) {
    emailDepositPaid = currentDepositPaid;
    emailRemainingAmount = roundedRemainingAmount;

    updateData = {
      securityDepositPaid: roundedSecurityDeposit,
      remainingAmount: roundedRemainingAmount,
      status: BookingStatus.PENDING,
    };
  } else if (paymentType.isDepositOnly) {
    const actualDepositPaid = roundedAmountPaid;
    const actualRemainingAmount = roundAmount(totalPrice - actualDepositPaid);
    emailDepositPaid = actualDepositPaid;
    emailRemainingAmount = actualRemainingAmount;

    updateData = {
      depositPaid: actualDepositPaid,
      remainingAmount: actualRemainingAmount,
      status: BookingStatus.CONFIRMED,
    };
  } else {
    const actualDepositPaid = roundedDownPayment;
    const actualRemainingAmount = roundAmount(totalPrice - actualDepositPaid);
    emailDepositPaid = actualDepositPaid;
    emailRemainingAmount = actualRemainingAmount;

    updateData = {
      depositPaid: actualDepositPaid,
      securityDepositPaid: roundedSecurityDeposit,
      remainingAmount: actualRemainingAmount,
      status: BookingStatus.CONFIRMED,
    };
  }

  return {
    updateData,
    emailAmounts: {
      emailDepositPaid,
      emailRemainingAmount,
      roundedAmountPaid,
    },
  };
}


