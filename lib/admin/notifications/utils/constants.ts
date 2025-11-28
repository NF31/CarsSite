import { subHours } from "date-fns";

export const RECENT_PAYMENT_THRESHOLD_HOURS = 48;

export function getRecentPaymentThreshold(): Date {
  return subHours(new Date(), RECENT_PAYMENT_THRESHOLD_HOURS);
}

