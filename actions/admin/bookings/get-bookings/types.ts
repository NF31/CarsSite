import { BookingStatus } from "@/lib/types/booking-status";

export interface GetBookingsFilters {
  status?: BookingStatus;
  pickupLocationId?: string;
  returnLocationId?: string;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: "startDate" | "endDate" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface BookingListItem {
  id: string;
  reference: string;
  status: BookingStatus;
  startDate: string;
  endDate: string;
  period: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
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

export interface GetBookingsResult {
  success: boolean;
  data?: {
    bookings: BookingListItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  error?: string;
}

