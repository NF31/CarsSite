import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBookingByIdAction } from "@/actions/admin/bookings";
import { BookingDetailsPageClient } from "./BookingDetailsPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const bookingResult = await getBookingByIdAction(id);

  if (!bookingResult.success || !bookingResult.data) {
    return {
      title: "Réservation introuvable - Administration",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const booking = bookingResult.data;

  return {
    title: `Réservation ${booking.reference} - Administration`,
    description: `Détails de la réservation ${booking.reference} pour ${booking.user.name ?? "client"} concernant le véhicule ${booking.vehicle.brand} ${booking.vehicle.model} (${booking.vehicle.licensePlate}).`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

interface BookingDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const bookingResult = await getBookingByIdAction(id);

  if (!bookingResult.success || !bookingResult.data) {
    if (bookingResult.status === 404) {
      notFound();
    }

    const errorCode =
      bookingResult.status === 400 ? "booking-invalid" : "booking-unavailable";
    redirect(`/admin/bookings?error=${errorCode}`);
  }

  return <BookingDetailsPageClient booking={bookingResult.data} />;
}


