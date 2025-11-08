import {
  getBookingOptionsAction,
} from "@/actions/admin/bookings";
import { BookingForm } from "@/components/admin/bookings/BookingForm";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminBookingAddPage() {
  const optionsResult = await getBookingOptionsAction();

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
    />
  );
}



