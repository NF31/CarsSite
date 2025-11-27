"use client";

import {
  ClientDetailsHeader,
  ClientAccountInfoCard,
  ClientRecentBookingsCard,
  ClientStatsCard,
  ClientPreferencesCard,
  ClientRecentActivityCard,
} from "@/components/admin/clients/details";
import { useClientDetails } from "@/hooks/useClientDetails";
import { useDriverLicense } from "@/hooks/useDriverLicense";
import { Badge } from "@/components/ui/badge";
import { CLIENT_STATUS_COLORS, CLIENT_STATUS_LABELS } from "@/components/admin/clients/client-helpers";
import type { ClientDetail } from "@/actions/admin/clients";

interface ClientDetailsPageClientProps {
  client: ClientDetail;
}

export function ClientDetailsPageClient({ client }: ClientDetailsPageClientProps) {
  const { StatusIcon, bookingsWithStatus, lastBooking, canCreateReservation } = useClientDetails(client);
  const { licenseError, isPending, handleViewDriverLicense } = useDriverLicense();

  const statusBadge = (
    <Badge className={`${CLIENT_STATUS_COLORS[client.status]} flex items-center gap-1`}>
      <StatusIcon className="h-3.5 w-3.5" />
      {CLIENT_STATUS_LABELS[client.status]}
    </Badge>
  );

  return (
    <div className="space-y-6">
      <ClientDetailsHeader
        client={client}
        StatusIcon={StatusIcon}
        canCreateReservation={canCreateReservation}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ClientAccountInfoCard
            client={client}
            statusBadge={statusBadge}
            isPending={isPending}
            licenseError={licenseError}
            onViewLicense={() => handleViewDriverLicense(client.id)}
          />

          <ClientRecentBookingsCard bookings={bookingsWithStatus} />
        </div>

        <div className="space-y-6">
          <ClientStatsCard stats={client.stats} />

          <ClientPreferencesCard preferences={client.preferences} />

          <ClientRecentActivityCard client={client} lastBooking={lastBooking} />
        </div>
      </div>
    </div>
  );
}


