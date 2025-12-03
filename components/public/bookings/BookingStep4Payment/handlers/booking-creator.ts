import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPublicBookingAction } from "@/actions/public/bookings/create-booking";
import { getPendingBookingAction } from "@/actions/public/bookings/get-pending-booking";
import { BookingStep4PaymentProps, PaymentOption } from "../types";
import { getPaymentType, combineDateAndTime, getBookingIdFromUrl } from "../utils/helpers";

interface UseBookingCreatorProps {
  bookingData: BookingStep4PaymentProps["bookingData"];
  existingBookingId?: string;
}

export function useBookingCreator({ bookingData, existingBookingId }: UseBookingCreatorProps) {
  const router = useRouter();
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateBooking = async () => {
    // Vérifier si une réservation existe déjà (depuis props ou URL)
    const bookingIdFromUrl = getBookingIdFromUrl();
    const finalBookingId = existingBookingId || bookingIdFromUrl;

    if (finalBookingId && finalBookingId.trim() !== "") {
      const paymentType = getPaymentType(bookingData.paymentOption);

      toast.success("Option de paiement mise à jour", {
        description: "Redirection vers le paiement...",
        duration: 2000,
      });
      router.push(`/bookings/payment?bookingId=${finalBookingId}&type=${paymentType}`);
      return;
    }

    setIsCreatingBooking(true);
    setCreateError(null);

    try {
      const startDate = combineDateAndTime(bookingData.startDate, bookingData.startTime);
      const endDate = combineDateAndTime(bookingData.endDate, bookingData.endTime);

      // Vérifier s'il existe une réservation PENDING dans la DB
      const pendingBookingResult = await getPendingBookingAction({
        vehicleId: bookingData.vehicleId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        serviceIds: bookingData.selectedServiceIds,
        pickupLocationId: bookingData.pickupPlaceId,
        returnLocationId: bookingData.returnPlaceId,
        customerEmail: bookingData.customerEmail,
      });

      if (pendingBookingResult.success && pendingBookingResult.booking) {
        const paymentType = getPaymentType(bookingData.paymentOption);

        toast.success("Réservation trouvée", {
          description: "Redirection vers le paiement...",
          duration: 2000,
        });
        router.push(`/bookings/payment?bookingId=${pendingBookingResult.booking.id}&type=${paymentType}`);
        setIsCreatingBooking(false);
        return;
      }

      // Créer une nouvelle réservation
      const result = await createPublicBookingAction({
        vehicleId: bookingData.vehicleId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        pickup: bookingData.pickup,
        returnLocation: bookingData.returnLocation,
        pickupPlaceId: bookingData.pickupPlaceId,
        returnPlaceId: bookingData.returnPlaceId,
        serviceIds: bookingData.selectedServiceIds,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        driverLicenseUrl: bookingData.driverLicenseUrl,
        acceptedTerms: bookingData.acceptedTerms,
      });

      if (result.success && result.data) {
        handleBookingSuccess(router, result.data.bookingId, result.data.reference, bookingData.paymentOption);
      } else {
        const errorMessage = result.error || "Erreur lors de la création de la réservation";
        setCreateError(errorMessage);
        toast.error("Erreur lors de la création de la réservation", {
          description: errorMessage,
          duration: 5000,
        });
      }
    } catch {
      const errorMessage = "Une erreur inattendue est survenue lors de la création de la réservation.";
      setCreateError(errorMessage);
      toast.error("Erreur lors de la création de la réservation", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsCreatingBooking(false);
    }
  };

  return { handleCreateBooking, isCreatingBooking, createError };
}

function handleBookingSuccess(
  router: ReturnType<typeof useRouter>,
  bookingId: string,
  reference: string,
  paymentOption: PaymentOption
) {

  if (paymentOption === "deposit") {
    toast.success("Réservation créée", {
      description: "Redirection vers le paiement de l'acompte...",
      duration: 2000,
    });
    router.push(`/bookings/payment?bookingId=${bookingId}&type=deposit`);
  } else if (paymentOption === "deposit_and_deposit") {
    toast.success("Réservation créée", {
      description: "Redirection vers le paiement...",
      duration: 2000,
    });
    router.push(`/bookings/payment?bookingId=${bookingId}&type=full`);
  } else if (paymentOption === "on_site") {
    toast.success("Réservation créée", {
      description: "Redirection vers la confirmation de l'empreinte bancaire...",
      duration: 2000,
    });
    router.push(`/bookings/payment?bookingId=${bookingId}&type=authorization`);
  } else {
    toast.success("Réservation créée avec succès", {
      description: `Votre réservation ${reference} a été créée avec succès. Vous allez recevoir un email de confirmation.`,
      duration: 5000,
    });
    router.push(`/bookings/confirmation?reference=${reference}`);
  }
}

