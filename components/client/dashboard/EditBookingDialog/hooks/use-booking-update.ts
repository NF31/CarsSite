import { useEffect, useMemo, startTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateClientBookingAction, UpdateBookingResult } from "@/actions/client/bookings/update-booking";
import { toast } from "sonner";

export function useBookingUpdate(setOpen: (open: boolean) => void) {
  const router = useRouter();
  const initialState = useMemo<UpdateBookingResult>(() => ({ success: false, error: undefined }), []);
  const [state, action] = useActionState(updateClientBookingAction, initialState);

  useEffect(() => {
    if (state.success) {
      // Fermer le dialog d'abord
      startTransition(() => {
        setOpen(false);
      });

      // Afficher le toast APRÈS la fermeture du dialog, sur la page
      setTimeout(() => {
        // Toujours afficher le même message : la demande est en attente de validation admin
        toast.success("Demande de modification envoyée", {
          description:
            "Votre demande de modification de dates a été envoyée avec succès. Elle sera traitée par un administrateur dans les plus brefs délais. Vous recevrez un email de confirmation une fois la modification validée.",
          duration: 5000,
        });
        setTimeout(() => {
          router.refresh();
        }, 1000);
      }, 150);
    } else if (state.error) {
      // Pour les erreurs, on peut afficher le toast directement car le dialog reste ouvert
      toast.error("Erreur lors de la modification", {
        description: state.error,
        duration: 5000,
      });
    }
  }, [state.success, state.error, state.requiresPayment, state.paymentUrl, state.refundAmount, router, setOpen]);

  return { state, action };
}

