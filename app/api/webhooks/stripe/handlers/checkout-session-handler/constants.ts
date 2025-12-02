import type { BookingSelectFields, UpdatedBookingSelectFields } from "./types";

export const BOOKING_SELECT_FIELDS: BookingSelectFields = {
  id: true,
  userId: true,
  totalPrice: true,
  depositPaid: true,
  securityDepositPaid: true,
  remainingAmount: true,
  serviceIds: true,
  startDate: true,
  endDate: true,
  status: true,
  modificationDepositDifference: true,
  originalStartDate: true,
  originalEndDate: true,
  originalTotalPrice: true,
  originalDepositPaid: true,
  vehicle: {
    select: {
      id: true,
      deposit: true,
    },
  },
} as const;

export const UPDATED_BOOKING_SELECT_FIELDS: UpdatedBookingSelectFields = {
  id: true,
  reference: true,
  status: true,
  depositPaid: true,
  securityDepositPaid: true,
  remainingAmount: true,
  totalPrice: true,
  startDate: true,
  endDate: true,
  userId: true,
  vehicleId: true,
  pickupLocationId: true,
  returnLocationId: true,
} as const;

export const AGENCY_SETTINGS_KEYS = [
  "agency.name",
  "agency.address",
  "agency.phone",
  "agency.email",
] as const;


