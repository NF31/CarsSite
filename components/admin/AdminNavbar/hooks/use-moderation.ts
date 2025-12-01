import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { moderateBookingStatusAction } from "@/actions/admin/bookings";

export function useModeration() {
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [isModerating, startModerate] = useTransition();

  const handleModeration = (
    bookingId: string,
    action: "approve" | "reject",
    bookingType?: string,
    onReject?: () => void
  ) => {
    // Empêcher les doubles clics
    if (activeBookingId === bookingId || isModerating) {
      return;
    }

    setActionError(null);

    // Si c'est un rejet d'annulation OU de modification, appeler le callback
    if (action === "reject" && (bookingType === "cancellation" || bookingType === "modification")) {
      onReject?.();
      return;
    }

    // Sinon, procéder normalement
    setActiveBookingId(bookingId);
    startModerate(async () => {
      try {
        const result = await moderateBookingStatusAction({ bookingId, action });
        if (!result.success) {
          const errorMessage = result.error ?? "Impossible de traiter cette réservation.";
          setActionError(errorMessage);
          toast.error(errorMessage);
          setActiveBookingId(null);
          return;
        }

        // Afficher un message de succès selon le type et l'action
        if (action === "approve") {
          if (bookingType === "modification") {
            toast.success("Modification validée !", {
              description: `L'email a été envoyé au client avec les instructions de paiement.`,
            });
          } else if (bookingType === "cancellation") {
            toast.success("Annulation validée !", {
              description: `L'email de confirmation d'annulation a été envoyé au client.`,
            });
          } else {
            toast.success("Réservation validée !", {
              description: `L'email de confirmation a été envoyé au client.`,
            });
          }
        } else {
          if (bookingType === "modification") {
            toast.success("Modification refusée", {
              description: `L'email de refus a été envoyé au client.`,
            });
          } else if (bookingType === "cancellation") {
            toast.success("Annulation refusée", {
              description: `L'email de refus d'annulation a été envoyé au client.`,
            });
          } else {
            toast.success("Réservation refusée", {
              description: `L'email de refus a été envoyé au client.`,
            });
          }
        }

        // Revalider les données pour mettre à jour l'interface
        router.refresh();
      } catch (error) {
        console.error("[Admin Navbar] Erreur lors de la modération:", error);
        const errorMessage = "Une erreur est survenue lors du traitement.";
        setActionError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setActiveBookingId(null);
      }
    });
  };

  const handleRejectionConfirm = async (
    bookingId: string,
    rejectionReason: string,
    bookingType: string | null,
    onSuccess?: () => void
  ) => {
    // Empêcher les doubles clics
    if (activeBookingId === bookingId || isModerating) {
      return;
    }

    setActionError(null);
    setActiveBookingId(bookingId);
    startModerate(async () => {
      try {
        const result = await moderateBookingStatusAction({
          bookingId,
          action: "reject",
          rejectionReason: rejectionReason.trim() || undefined,
        });
        if (!result.success) {
          const errorMessage = result.error ?? "Impossible de traiter cette réservation.";
          setActionError(errorMessage);
          toast.error(errorMessage);
          setActiveBookingId(null);
          return;
        }

        // Adapter le message selon le type
        if (bookingType === "modification") {
          toast.success("Modification refusée", {
            description: `L'email de refus a été envoyé au client.`,
          });
        } else {
          toast.success("Annulation refusée", {
            description: `L'email de refus d'annulation a été envoyé au client.`,
          });
        }

        // Revalider les données pour mettre à jour l'interface
        router.refresh();
        onSuccess?.();
      } catch (error) {
        console.error("[Admin Navbar] Erreur lors du rejet:", error);
        const errorMessage = "Une erreur est survenue lors du traitement.";
        setActionError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setActiveBookingId(null);
      }
    });
  };

  return {
    actionError,
    activeBookingId,
    isModerating,
    handleModeration,
    handleRejectionConfirm,
  };
}

