import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TYPE_LABELS } from "../constants";
import type { MaintenanceCancelDialogProps } from "../types";

export function MaintenanceCancelDialog({
  maintenance,
  onConfirm,
  onDismiss,
}: MaintenanceCancelDialogProps) {
  return (
    <AlertDialog open={Boolean(maintenance)} onOpenChange={(open) => !open && onDismiss()}>
      <AlertDialogContent className="w-[min(92vw,480px)] max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            Confirmer l&apos;annulation de la maintenance ?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {maintenance
              ? `Vous êtes sur le point d'annuler l'intervention "${TYPE_LABELS[maintenance.type]}" programmée pour le véhicule ${maintenance.vehicle.brand} ${maintenance.vehicle.model}.`
              : "Annulation de la maintenance sélectionnée."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <AlertDialogCancel className="w-full sm:w-auto">Revenir en arrière</AlertDialogCancel>
          <AlertDialogAction className="w-full sm:w-auto" onClick={onConfirm}>
            Oui, annuler
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

