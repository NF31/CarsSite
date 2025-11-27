"use client";

import { memo } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rejectionReason: string;
  onRejectionReasonChange: (reason: string) => void;
  isCancellationRequest: boolean;
  isModerating: boolean;
  onConfirm: () => void;
}

export const RejectionDialog = memo(function RejectionDialog({
  open,
  onOpenChange,
  rejectionReason,
  onRejectionReasonChange,
  isCancellationRequest,
  isModerating,
  onConfirm,
}: RejectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isCancellationRequest ? "Conserver la réservation" : "Refuser la modification"}
          </DialogTitle>
          <DialogDescription>
            {isCancellationRequest
              ? "Veuillez expliquer pourquoi vous conservez cette réservation. Ce message sera envoyé au client par email."
              : "Veuillez expliquer pourquoi vous refusez cette modification de dates. Ce message sera envoyé au client par email."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">
              Message au client <span className="text-muted-foreground">(optionnel mais recommandé)</span>
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder={
                isCancellationRequest
                  ? "Ex: La réservation est confirmée et le véhicule est disponible. Nous ne pouvons pas accepter l'annulation à ce stade..."
                  : "Ex: Les nouvelles dates demandées ne sont pas disponibles. Le véhicule est déjà réservé pour cette période..."
              }
              value={rejectionReason}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{rejectionReason.length}/500 caractères</p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onRejectionReasonChange("");
            }}
            disabled={isModerating}
          >
            Annuler
          </Button>
          <Button onClick={onConfirm} disabled={isModerating} className="bg-green-600 hover:bg-green-700 text-white">
            {isModerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isCancellationRequest ? "Confirmer la conservation" : "Confirmer le refus"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

