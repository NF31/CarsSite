import {
  getBookingOptionsAction,
} from "@/actions/admin/bookings";
import { BookingForm } from "@/components/admin/bookings/BookingForm";
import { Card, CardContent } from "@/components/ui/card";

interface AdminBookingAddPageProps {
  searchParams?: Promise<{
    clientId?: string;
  }>;
}

export default async function AdminBookingAddPage({ searchParams }: AdminBookingAddPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const preselectedClientId =
    typeof resolvedSearchParams?.clientId === "string" && resolvedSearchParams.clientId.trim().length > 0
      ? resolvedSearchParams.clientId.trim()
      : undefined;

  const optionsResult = await getBookingOptionsAction({
    includeUserIds: preselectedClientId ? [preselectedClientId] : undefined,
  });

  if (!optionsResult.success || !optionsResult.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Impossible de charger les données nécessaires à la création d'une réservation. Veuillez
          réessayer plus tard.
        </CardContent>
      </Card>
    );
  }

  const { users, vehicles, locations, services } = optionsResult.data;

  return (
    <BookingForm
      users={users}
      vehicles={vehicles}
      locations={locations}
      services={services}
      initialUserId={preselectedClientId}
    />
  );
}



