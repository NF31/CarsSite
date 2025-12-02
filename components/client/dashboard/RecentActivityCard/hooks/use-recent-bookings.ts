import { useState, useTransition } from "react";
import {
  getClientRecentBookingsAction,
  type ClientRecentBooking,
  type ClientRecentBookingsPagination,
  type GetClientRecentBookingsSuccess,
} from "@/actions/client/bookings/get-recent";

interface UseRecentBookingsReturn {
  bookings: ClientRecentBooking[];
  pagination: ClientRecentBookingsPagination;
  isError: string | null;
  isPending: boolean;
  fetchPage: (page: number) => void;
}

/**
 * Hook pour gérer les réservations récentes avec pagination
 */
export function useRecentBookings(
  initialData: GetClientRecentBookingsSuccess,
  limit: number
): UseRecentBookingsReturn {
  const [bookings, setBookings] = useState<ClientRecentBooking[]>(initialData.bookings);
  const [pagination, setPagination] = useState<ClientRecentBookingsPagination>(initialData.pagination);
  const [isError, setIsError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchPage = (page: number) => {
    startTransition(async () => {
      const result = await getClientRecentBookingsAction({ page, limit });
      if (!result.success || !result.data) {
        setIsError(result.error ?? "Impossible de charger les réservations récentes.");
        return;
      }

      setBookings(result.data.bookings);
      setPagination(result.data.pagination);
      setIsError(null);
    });
  };

  return {
    bookings,
    pagination,
    isError,
    isPending,
    fetchPage,
  };
}

