"use client";

import {
  type GetClientRecentBookingsSuccess,
} from "@/actions/client/bookings/get-recent";
import { useRecentBookings, usePaginationSync } from "./RecentActivityCard/hooks";
import { EmptyState, ErrorBanner, PaginationControls, BookingItem } from "./RecentActivityCard/components";

interface RecentActivityCardProps {
  initialData: GetClientRecentBookingsSuccess;
  cancellationPolicy: string;
}

export function RecentActivityCard({ initialData, cancellationPolicy }: RecentActivityCardProps) {
  const { bookings, pagination, isError, isPending, fetchPage } = useRecentBookings(
    initialData,
    initialData.pagination.limit
  );
  const { handlePageChange } = usePaginationSync(pagination, fetchPage);

  if (pagination.total === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {isError ? <ErrorBanner message={isError} /> : null}
      <div className="space-y-3">
        {bookings.map((booking) => (
          <BookingItem key={booking.id} booking={booking} cancellationPolicy={cancellationPolicy} />
        ))}
      </div>
      <PaginationControls
        pagination={pagination}
        isPending={isPending}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
