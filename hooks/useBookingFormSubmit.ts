import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { UseFormReturn } from "react-hook-form";
import { createBookingAction, updateBookingAction } from "@/actions/admin/bookings";
import type { BookingFormValues } from "./useBookingForm";
import type { BookingFormInitialValues } from "@/components/admin/bookings/BookingForm";

const toDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

type AvailabilityStatus =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available" }
  | { status: "booking_conflict"; message: string }
  | { status: "maintenance_conflict"; message: string }
  | { status: "error"; message: string };

interface UseBookingFormSubmitProps {
  form: UseFormReturn<BookingFormValues>;
  isEditMode: boolean;
  booking?: BookingFormInitialValues;
  availability: AvailabilityStatus;
  selectedUser: { hasDriverLicense: boolean } | null;
}

export function useBookingFormSubmit({
  form,
  isEditMode,
  booking,
  availability,
  selectedUser,
}: UseBookingFormSubmitProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (values: BookingFormValues) => {
      setServerError(null);

      const start = toDate(values.startDate);
      const end = toDate(values.endDate);
      const now = new Date();

      if (!start || !end) {
        form.setError("startDate", { message: "Dates invalides" });
        form.setError("endDate", { message: "Dates invalides" });
        return;
      }

      if (end <= start) {
        form.setError("endDate", { message: "La date de fin doit être postérieure à la date de début" });
        return;
      }

      if (start < now) {
        form.setError("startDate", { message: "La date de début doit être dans le futur" });
        return;
      }

      if (end < now) {
        form.setError("endDate", { message: "La date de fin doit être dans le futur" });
        return;
      }

      if (availability.status === "booking_conflict" || availability.status === "maintenance_conflict") {
        setServerError("Le véhicule n&apos;est pas disponible aux dates sélectionnées.");
        return;
      }

      if (values.totalPrice < values.depositPaid) {
        form.setError("depositPaid", {
          message: "L&apos;acompte ne peut pas dépasser le montant total",
        });
        return;
      }

      if (isEditMode && !booking) {
        setServerError("Impossible de modifier cette réservation pour le moment.");
        return;
      }

      startTransition(async () => {
        const payload = {
          userId: values.userId,
          vehicleId: values.vehicleId,
          pickupLocationId: values.pickupLocationId,
          returnLocationId: values.returnLocationId,
          startDate: values.startDate,
          endDate: values.endDate,
          status: values.status,
          serviceIds: values.serviceIds,
          totalPrice: Number(values.totalPrice),
          depositPaid: Number(values.depositPaid),
          notes: values.notes,
          sendConfirmation: values.sendConfirmation ?? true,
        };

        const result = isEditMode && booking
          ? await updateBookingAction({
              ...payload,
              bookingId: booking.id,
              sendConfirmation: values.sendConfirmation ?? false,
            })
          : await createBookingAction(payload);

        if (!result.success) {
          if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([field, messages]) => {
              const message = messages?.[0];
              if (message) {
                form.setError(field as keyof BookingFormValues, {
                  message,
                });
              }
            });
          }
          setServerError(result.error);
          return;
        }

        router.push(
          isEditMode ? "/admin/bookings?success=booking-updated" : "/admin/bookings?success=booking-created"
        );
      });
    },
    [form, isEditMode, booking, availability, router]
  );

  const isSubmitDisabled =
    isPending ||
    availability.status === "booking_conflict" ||
    availability.status === "maintenance_conflict" ||
    (selectedUser ? !selectedUser.hasDriverLicense : false);

  return {
    handleSubmit,
    isPending,
    serverError,
    setServerError,
    isSubmitDisabled,
  };
}

