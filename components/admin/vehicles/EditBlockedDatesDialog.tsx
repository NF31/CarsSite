"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Loader2 } from "lucide-react";
import { updateBlockedDatesAction } from "@/actions/admin/vehicles/block-dates";
import { format } from "date-fns";

interface EditBlockedDatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenanceId: string;
  currentStartDate: Date;
  currentEndDate: Date;
  currentReason?: string | null;
  onSuccess: () => void;
}

export function EditBlockedDatesDialog({
  open,
  onOpenChange,
  maintenanceId,
  currentStartDate,
  currentEndDate,
  currentReason,
  onSuccess,
}: EditBlockedDatesDialogProps) {
  const [startDate, setStartDate] = useState(
    format(currentStartDate, "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState(
    format(currentStartDate, "HH:mm")
  );
  const [endDate, setEndDate] = useState(
    format(currentEndDate, "yyyy-MM-dd")
  );
  const [endTime, setEndTime] = useState(
    format(currentEndDate, "HH:mm")
  );
  const [reason, setReason] = useState(currentReason || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Mettre à jour les dates quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      setStartDate(format(currentStartDate, "yyyy-MM-dd"));
      setStartTime(format(currentStartDate, "HH:mm"));
      setEndDate(format(currentEndDate, "yyyy-MM-dd"));
      setEndTime(format(currentEndDate, "HH:mm"));
      setReason(currentReason || "");
      setError(null);
      setWarning(null);
    }
  }, [open, currentStartDate, currentEndDate, currentReason]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Combiner date et heure pour créer les objets Date complets
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const start = new Date(startDate);
    start.setHours(startHours, startMinutes, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(endHours, endMinutes, 0, 0);
    
    // Validation : vérifier que les dates ne sont pas dans le passé
    const now = new Date();
    
    if (start < now) {
      setError("La date et l'heure de début ne peuvent pas être dans le passé.");
      setIsSubmitting(false);
      return;
    }
    
    if (end <= start) {
      setError("La date et l'heure de fin doivent être postérieures à la date et l'heure de début.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await updateBlockedDatesAction(
        maintenanceId,
        start,
        end,
        reason || undefined
      );

      if (result.success) {
        // Afficher l'avertissement s'il y en a un
        if (result.warning) {
          setWarning(result.warning);
          setTimeout(() => {
            onOpenChange(false);
            setWarning(null);
            onSuccess();
          }, 2000);
        } else {
          onOpenChange(false);
          onSuccess();
        }
      } else {
        setError(result.error || "Erreur lors de la modification des dates");
        if (result.fieldErrors) {
          const fieldErrorMessages = Object.values(result.fieldErrors).flat();
          setError(fieldErrorMessages.join(", ") || result.error || "Erreur lors de la modification des dates");
        }
      }
    } catch (err) {
      setError("Une erreur inattendue s'est produite");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Modifier les dates bloquées
          </DialogTitle>
          <DialogDescription>
            Modifiez la période de dates bloquées pour ce véhicule.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // Minimum : aujourd'hui
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Heure de début</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  min={startDate || new Date().toISOString().split("T")[0]} // Minimum : date de début ou aujourd'hui
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Heure de fin</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Raison (optionnel)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Réparation, événement spécial, etc."
                rows={3}
              />
            </div>
            {warning && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                {warning}
              </div>
            )}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modification...
                </>
              ) : (
                "Modifier les dates"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

