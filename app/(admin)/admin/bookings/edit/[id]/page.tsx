import { notFound, redirect } from "next/navigation";
import {
  getBookingByIdAction,
  getBookingOptionsAction,
} from "@/actions/admin/bookings";
import {
  BookingForm,
  type BookingFormInitialValues,
} from "@/components/admin/bookings/BookingForm";
import { Card, CardContent } from "@/components/ui/card";

interface AdminBookingEditPageProps {
  params: {
    id: string;
  };
}

function formatDateTimeLocal(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  date.setSeconds(0, 0);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default async function AdminBookingEditPage({ params }: AdminBookingEditPageProps) {
  const resolvedParams = await params;
  const rawId = resolvedParams?.id;
  const bookingId = (Array.isArray(rawId) ? rawId[0] : rawId)?.trim?.() ?? "";

  if (!bookingId) {
    redirect("/admin/bookings?error=booking-invalid");
  }

  const bookingResult = await getBookingByIdAction(bookingId);

  if (!bookingResult.success || !bookingResult.data) {
    if (bookingResult?.status === 404) {
      notFound();
    }

    if (bookingResult?.status === 403) {
      redirect("/admin/bookings");
    }

    if (bookingResult?.status === 400) {
      redirect("/admin/bookings?error=booking-invalid");
    }

    throw new Error(
      bookingResult?.error ?? "Une erreur est survenue lors du chargement de la réservation."
    );
  }

  const booking = bookingResult.data;
  const now = new Date();

  if (new Date(booking.startDate) < now || new Date(booking.endDate) < now) {
    redirect("/admin/bookings?error=booking-locked");
  }

  const optionsResult = await getBookingOptionsAction({
    includeUserIds: [booking.user.id],
    includeServiceIds: booking.serviceIds,
    includeLocationIds: [booking.pickupLocationId, booking.returnLocationId],
  });

  if (!optionsResult.success || !optionsResult.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Impossible de charger les données nécessaires à la modification de la réservation. Veuillez
          réessayer plus tard.
        </CardContent>
      </Card>
    );
  }

  const { users, vehicles, locations, services } = optionsResult.data;

  const initialValues: BookingFormInitialValues = {
    id: booking.id,
    reference: booking.reference,
    userId: booking.userId,
    vehicleId: booking.vehicleId,
    pickupLocationId: booking.pickupLocationId,
    returnLocationId: booking.returnLocationId,
    startDate: formatDateTimeLocal(booking.startDate),
    endDate: formatDateTimeLocal(booking.endDate),
    status: booking.status,
    serviceIds: booking.serviceIds ?? [],
    totalPrice: booking.totalPrice,
    depositPaid: booking.depositPaid,
    notes: booking.notes,
  };

  return (
    <BookingForm
      mode="edit"
      booking={initialValues}
      users={users}
      vehicles={vehicles}
      locations={locations}
      services={services}
    />
  );
}


