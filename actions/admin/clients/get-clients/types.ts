import type { BookingStatus } from "@/lib/types/booking-status";

export type ClientStatus = "ACTIVE" | "INACTIVE" | "LOCKED";

export type ClientReservationsFilter = "all" | "with" | "without" | "returning" | "vip";

export interface GetClientsFilters {
  search?: string;
  status?: "all" | "active" | "inactive" | "locked";
  reservations?: ClientReservationsFilter;
  registrationFrom?: string;
  registrationTo?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "bookingsCount";
  sortOrder?: "asc" | "desc";
}

export interface ClientListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  status: ClientStatus;
  bookingsCount: number;
  hasDriverLicense: boolean;
  driverLicenseUrl: string | null;
  lockedUntil: string | null;
  deletedAt: string | null;
  lastBooking:
    | {
        id: string;
        startDate: string;
        endDate: string | null;
        status: BookingStatus;
        vehicle: {
          id: string;
          brand: string;
          model: string;
          licensePlate: string;
        } | null;
      }
    | null;
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  lockedClients: number;
  returningClients: number;
  newClientsLast30Days: number;
}

export interface GetClientsResult {
  success: boolean;
  data?: {
    clients: ClientListItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    stats: ClientStats;
  };
  error?: string;
  status?: number;
}

