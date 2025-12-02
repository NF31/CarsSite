"use client";

import { useMemo } from "react";
import type { BookingsListViewProps } from "./BookingsListView/types";
import { formatBookingRow } from "./BookingsListView/utils";
import { EmptyState, BookingCard, BookingTable } from "./BookingsListView/components";

export function BookingsListView({ bookings, startIndex = 0 }: BookingsListViewProps) {
  const formattedRows = useMemo(() => {
    return bookings.map((booking, index) => formatBookingRow(booking, index, startIndex));
  }, [bookings, startIndex]);

  if (bookings.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="space-y-4 xl:hidden">
        {formattedRows.map((row) => (
          <BookingCard key={row.booking.id} row={row} />
        ))}
      </div>
      <BookingTable rows={formattedRows} />
    </>
  );
}