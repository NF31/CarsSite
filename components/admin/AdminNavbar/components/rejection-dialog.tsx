"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type RejectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingType: string | null;
  rejectionReason: string;
  onRejectionReasonChange: (reason: string) => void;
  onConfirm: () => void;
  isModerating: boolean;
  isProcessing: boolean;
};

export function RejectionDialog({
  open,
  onOpenChange,
  bookingType,
  rejectionReason,
  onRejectionReasonChange,
  onConfirm,
  isModerating,
  isProcessing,
}: RejectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {bookingType === "modification" ? "Refuser la modification" : "Rejeter la demande d'annulation"}
          </DialogTitle>
          <DialogDescription>
            {bookingType === "modification"
              ? "Veuillez expliquer pourquoi vous refusez cette modification de dates. Ce message sera envoyé au client par email."
              : "Vous pouvez ajouter un message expliquant pourquoi la demande d'annulation est refusée. Ce message sera envoyé au client par email."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Message de refus (optionnel)</Label>
            <Textarea
              id="rejection-reason"
              placeholder={
                bookingType === "modification"
                  ? "Ex: Les nouvelles dates demandées ne sont pas disponibles. Le véhicule est déjà réservé pour cette période..."
                  : "Ex: La réservation est trop proche de la date de début pour permettre une annulation selon notre politique..."
              }
              value={rejectionReason}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">{rejectionReason.length}/500 caractères</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isModerating}>
            Annuler
          </Button>
          <Button onClick={onConfirm} disabled={isModerating}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              "Confirmer le refus"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

