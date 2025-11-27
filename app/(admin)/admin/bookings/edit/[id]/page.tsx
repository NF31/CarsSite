import { redirect } from "next/navigation";
import {
  getBookingEditDataAction,
} from "@/actions/admin/bookings";
import {
  BookingForm,
} from "@/components/admin/bookings/BookingForm";
import { BookingEditError } from "@/components/admin/bookings/edit/BookingEditError";

interface AdminBookingEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminBookingEditPage({ params }: AdminBookingEditPageProps) {
  const resolvedParams = await params;
  const rawId = resolvedParams?.id;
  const bookingId = (Array.isArray(rawId) ? rawId[0] : rawId)?.trim?.() ?? "";

  if (!bookingId) {
    redirect("/admin/bookings?error=booking-invalid");
  }

  const result = await getBookingEditDataAction(bookingId);

  if (!result.success) {
    return <BookingEditError message={result.message ?? "Une erreur est survenue."} />;
  }

  const { booking, users, vehicles, locations, services } = result.data;

  return (
    <BookingForm
      mode="edit"
      booking={booking}
      users={users}
      vehicles={vehicles}
      locations={locations}
      services={services}
    />
  );
}
