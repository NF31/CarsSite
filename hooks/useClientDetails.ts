import { useMemo } from "react";
import { CLIENT_STATUS_ICONS } from "@/components/admin/clients/client-helpers";
import { computeBookingStatus } from "@/components/admin/clients/details/utils";
import type { ClientDetail, ClientDetailBooking } from "@/actions/admin/clients";
import { BookingStatus } from "@prisma/client";

interface BookingWithStatus extends ClientDetailBooking {
  computedStatus: BookingStatus;
}

export function useClientDetails(client: ClientDetail) {
  const StatusIcon = CLIENT_STATUS_ICONS[client.status];

  const bookingsWithStatus = useMemo<BookingWithStatus[]>(
    () =>
      client.bookings.map((booking) => ({
        ...booking,
        computedStatus: computeBookingStatus(booking),
      })),
    [client.bookings]
  );

  const lastBooking = bookingsWithStatus[0] ?? null;

  const canCreateReservation = client.status === "ACTIVE" && !client.deletedAt;

  return {
    StatusIcon,
    bookingsWithStatus,
    lastBooking,
    canCreateReservation,
  } as const;
}

