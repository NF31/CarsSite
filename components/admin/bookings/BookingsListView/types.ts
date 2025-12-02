import type { BOOKING_STATUS_LABELS } from "../booking-helpers";

export interface BookingListItem {
  id: string;
  reference: string;
  status: keyof typeof BOOKING_STATUS_LABELS;
  startDate: string;
  endDate: string;
  period: string;
  totalPrice: number;
  depositPaid: number;
  remainingAmount: number;
  securityDepositPaid: number | null;
  servicesCount: number;
  notes: string | null;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    hasDriverLicense: boolean;
  };
  vehicle: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
    category: string;
  };
  pickupLocation: {
    id: string;
    name: string;
    city: string;
  };
  returnLocation: {
    id: string;
    name: string;
    city: string;
  };
}

export interface BookingsListViewProps {
  bookings: BookingListItem[];
  startIndex?: number;
}

export interface FormattedBookingRow {
  booking: BookingListItem;
  index: number;
  canEdit: boolean;
  start: Date;
  end: Date;
}

