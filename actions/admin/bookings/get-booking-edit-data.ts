"use server";

import { notFound, redirect } from "next/navigation";
import { getBookingByIdAction, getBookingOptionsAction } from "@/actions/admin/bookings";
import { formatDateTimeLocal } from "@/lib/utils/date-formatters";
import type { BookingFormInitialValues } from "@/components/admin/bookings/BookingForm";
import type { 
  BookingUserOption,
  BookingVehicleOption,
  BookingLocationOption,
  BookingServiceOption,
} from "./get-options/types";

interface GetBookingEditDataResult {
  success: true;
  data: {
    booking: BookingFormInitialValues;
    users: BookingUserOption[];
    vehicles: BookingVehicleOption[];
    locations: BookingLocationOption[];
    services: BookingServiceOption[];
  };
}

interface GetBookingEditDataError {
  success: false;
  type: "not-found" | "forbidden" | "invalid" | "locked" | "options-error";
  message?: string;
}

export async function getBookingEditDataAction(
  bookingId: string
): Promise<GetBookingEditDataResult | GetBookingEditDataError> {
  if (!bookingId?.trim()) {
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

    return {
      success: false,
      type: "invalid",
      message: bookingResult?.error ?? "Une erreur est survenue lors du chargement de la réservation.",
    };
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
    return {
      success: false,
      type: "options-error",
      message: "Impossible de charger les données nécessaires à la modification de la réservation.",
    };
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

  return {
    success: true,
    data: {
      booking: initialValues,
      users,
      vehicles,
      locations,
      services,
    },
  };
}

