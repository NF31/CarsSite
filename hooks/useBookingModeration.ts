import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { moderateBookingStatusAction } from "@/actions/admin/bookings";
import type { BookingDetail } from "@/actions/admin/bookings";

interface UseBookingModerationProps {
  booking: BookingDetail;
}

export function useBookingModeration({ booking }: UseBookingModerationProps) {
  const router = useRouter();
  const [isModerating, startModerate] = useTransition();
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [activeModeration, setActiveModeration] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const isProcessing = isProcessingAction || isModerating || activeModeration !== null;

  const handleModeration = useCallback(
    (action: "approve" | "reject") => {
      if (isProcessing) {
        console.log(`[BookingDetails] ⚠️ Action déjà en cours, ignore le clic sur ${action}`, {
          isProcessingAction,
          isModerating,
          activeModeration,
        });
        return;
      }

      setIsProcessingAction(true);
      setModerationError(null);

      const isModification = booking.modificationRequested || (booking.modificationDepositDifference ?? 0) > 0;
      const isCancellationRequest = booking.cancellationRequested;

      if (action === "reject" && (isCancellationRequest || isModification)) {
        setRejectionDialogOpen(true);
        setIsProcessingAction(false);
        return;
      }

      setActiveModeration(action);

      startModerate(async () => {
        try {
          const result = await moderateBookingStatusAction({
            bookingId: booking.id,
            action,
          });

          if (!result.success) {
            setModerationError(result.error ?? "Erreur lors de la validation/refus de la réservation.");
            toast.error(result.error ?? "Erreur lors de la validation/refus de la réservation.");
            setIsProcessingAction(false);
            setActiveModeration(null);
            return;
          }

          const isModification = booking.modificationRequested || (booking.modificationDepositDifference ?? 0) > 0;
          const isCancellation = booking.cancellationRequested;

          if (action === "approve") {
            if (isModification) {
              toast.success("Modification validée !", {
                description: `L'email a été envoyé au client avec les instructions de paiement.`,
              });
            } else if (isCancellation) {
              toast.success("Annulation validée !", {
                description: `L'email de confirmation d'annulation a été envoyé au client.`,
              });
            } else {
              toast.success("Réservation validée !", {
                description: `L'email de confirmation a été envoyé au client.`,
              });
            }
          } else {
            if (isModification) {
              toast.success("Modification refusée", {
                description: `L'email de refus a été envoyé au client.`,
              });
            } else if (isCancellation) {
              toast.success("Annulation refusée", {
                description: `L'email de refus d'annulation a été envoyé au client.`,
              });
            } else {
              toast.success("Réservation refusée", {
                description: `L'email de refus a été envoyé au client.`,
              });
            }
          }

          setIsProcessingAction(false);
          setActiveModeration(null);

          setTimeout(() => {
            router.push("/admin/bookings");
          }, 500);
        } catch (error) {
          console.error("Erreur lors de la modération", error);
          const errorMessage = "Une erreur inattendue est survenue.";
          setModerationError(errorMessage);
          toast.error(errorMessage);
          setIsProcessingAction(false);
          setActiveModeration(null);
        }
      });
    },
    [booking, isProcessing, isProcessingAction, isModerating, activeModeration, router]
  );

  const handleRejectionConfirm = useCallback(() => {
    if (isProcessing) {
      return;
    }

    const isModification = booking.modificationRequested || (booking.modificationDepositDifference ?? 0) > 0;
    if (!rejectionReason.trim()) {
      setModerationError(
        isModification
          ? "Veuillez saisir un message expliquant pourquoi vous refusez cette modification."
          : "Veuillez saisir un message expliquant pourquoi vous conservez la réservation."
      );
      return;
    }

    setIsProcessingAction(true);
    setRejectionDialogOpen(false);
    setActiveModeration("reject");

    startModerate(async () => {
      try {
        const result = await moderateBookingStatusAction({
          bookingId: booking.id,
          action: "reject",
          rejectionReason: rejectionReason.trim(),
        });

        if (!result.success) {
          const errorMessage = result.error ?? "Erreur lors de la conservation de la réservation.";
          setModerationError(errorMessage);
          toast.error(errorMessage);
          setIsProcessingAction(false);
          setActiveModeration(null);
          return;
        }

        const isModification = booking.modificationRequested || (booking.modificationDepositDifference ?? 0) > 0;
        const isCancellation = booking.cancellationRequested;

        if (isModification) {
          toast.success("Modification refusée", {
            description: `L'email de refus a été envoyé au client.`,
          });
        } else if (isCancellation) {
          toast.success("Annulation refusée", {
            description: `L'email de refus d'annulation a été envoyé au client.`,
          });
        } else {
          toast.success("Réservation refusée", {
            description: `L'email de refus a été envoyé au client.`,
          });
        }

        setRejectionReason("");
        setIsProcessingAction(false);
        setActiveModeration(null);

        setTimeout(() => {
          router.push("/admin/bookings");
        }, 500);
      } catch (error) {
        console.error("Erreur lors de la conservation", error);
        const errorMessage = "Une erreur inattendue est survenue.";
        setModerationError(errorMessage);
        toast.error(errorMessage);
        setIsProcessingAction(false);
        setActiveModeration(null);
      }
    });
  }, [booking, isProcessing, rejectionReason, router]);

  return {
    isModerating,
    moderationError,
    activeModeration,
    isProcessingAction,
    isProcessing,
    rejectionDialogOpen,
    setRejectionDialogOpen,
    rejectionReason,
    setRejectionReason,
    handleModeration,
    handleRejectionConfirm,
  };
}

