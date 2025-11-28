import { useMemo } from "react";
import type { InvoiceClientItem } from "@/actions/admin/invoices/get-invoices";

export interface ClientBookingMatch {
  client: InvoiceClientItem;
  booking: InvoiceClientItem["bookings"][number];
}

interface UseClientBookingsFilterProps {
  clients: InvoiceClientItem[];
  searchValue: string;
}

export function useClientBookingsFilter({
  clients,
  searchValue,
}: UseClientBookingsFilterProps) {
  const filteredClientBookings = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const matches: ClientBookingMatch[] = [];

    clients.forEach((client) => {
      const clientMatches =
        normalizedSearch.length === 0 ||
        client.name.toLowerCase().includes(normalizedSearch) ||
        client.email.toLowerCase().includes(normalizedSearch) ||
        (client.phone ?? "").toLowerCase().includes(normalizedSearch);

      client.bookings.forEach((booking) => {
        const bookingMatches =
          normalizedSearch.length === 0 ||
          booking.reference.toLowerCase().includes(normalizedSearch) ||
          booking.vehicle.brand.toLowerCase().includes(normalizedSearch) ||
          booking.vehicle.model.toLowerCase().includes(normalizedSearch) ||
          (booking.invoice
            ? booking.invoice.invoiceNumber.toLowerCase().includes(normalizedSearch)
            : false);

        if (clientMatches || bookingMatches) {
          matches.push({ client, booking });
        }
      });
    });

    return matches;
  }, [clients, searchValue]);

  return { filteredClientBookings };
}

