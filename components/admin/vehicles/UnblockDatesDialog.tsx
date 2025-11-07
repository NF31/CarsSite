"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Loader2, Unlock, Edit } from "lucide-react";
import { format } from "date-fns";

interface UnblockDatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenanceId: string;
  startDate: Date;
  endDate: Date;
  reason?: string | null;
  onConfirm: () => void;
  onEdit?: () => void;
}

export function UnblockDatesDialog({
  open,
  onOpenChange,
  maintenanceId,
  startDate,
  endDate,
  reason,
  onConfirm,
  onEdit,
}: UnblockDatesDialogProps) {
  const [isUnblocking, setIsUnblocking] = useState(false);

  const handleConfirm = async () => {
    setIsUnblocking(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error unblocking dates:", error);
    } finally {
      setIsUnblocking(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-primary" />
            Débloquer les dates
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Êtes-vous sûr de vouloir débloquer cette période de dates ?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Du</span>
            <span className="text-sm font-semibold">{format(startDate, "dd/MM/yyyy HH:mm")}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Au</span>
            <span className="text-sm font-semibold">{format(endDate, "dd/MM/yyyy HH:mm")}</span>
          </div>
          {reason && (
            <div className="p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">Raison :</span>
              <p className="text-sm mt-1">{reason}</p>
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {onEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onEdit();
              }}
              disabled={isUnblocking}
              className="w-full sm:w-auto"
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          )}
          <AlertDialogCancel disabled={isUnblocking} className="w-full sm:w-auto">Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isUnblocking}
            className="bg-primary hover:bg-primary/90"
          >
            {isUnblocking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Déblocage...
              </>
            ) : (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Débloquer
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

