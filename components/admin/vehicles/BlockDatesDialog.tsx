"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Lock, X } from "lucide-react";
import { blockVehicleDatesAction } from "@/actions/admin/vehicles/block-dates";
import { format } from "date-fns";

interface BlockDatesDialogProps {
  vehicleId: string;
  selectedStartDate?: Date;
  selectedEndDate?: Date;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BlockDatesDialog({
  vehicleId,
  selectedStartDate,
  selectedEndDate,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: BlockDatesDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Utiliser l'état contrôlé si fourni, sinon utiliser l'état interne
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [startDate, setStartDate] = useState(
    selectedStartDate ? format(selectedStartDate, "yyyy-MM-dd") : ""
  );
  const [startTime, setStartTime] = useState(
    selectedStartDate ? format(selectedStartDate, "HH:mm") : "00:00"
  );
  const [endDate, setEndDate] = useState(
    selectedEndDate ? format(selectedEndDate, "yyyy-MM-dd") : ""
  );
  const [endTime, setEndTime] = useState(
    selectedEndDate ? format(selectedEndDate, "HH:mm") : "23:59"
  );
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const now = new Date();
  const todayIso = now.toISOString().split("T")[0];
  const hasStarted =
    selectedStartDate && selectedStartDate < now ? true : false;
  const hasEnded = selectedEndDate && selectedEndDate < now ? true : false;

  // Mettre à jour les dates quand elles changent depuis l'extérieur ou quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      // Quand le dialog s'ouvre, pré-remplir avec les dates sélectionnées
      if (selectedStartDate) {
        const formattedStart = format(selectedStartDate, "yyyy-MM-dd");
        const formattedStartTime = format(selectedStartDate, "HH:mm");
        setStartDate(formattedStart);
        setStartTime(formattedStartTime);
      } else {
        // Si pas de date sélectionnée, mettre aujourd'hui par défaut
        const today = new Date();
        setStartDate(today.toISOString().split('T')[0]);
        setStartTime("00:00");
      }
      
      if (selectedEndDate) {
        const formattedEnd = format(selectedEndDate, "yyyy-MM-dd");
        const formattedEndTime = format(selectedEndDate, "HH:mm");
        setEndDate(formattedEnd);
        setEndTime(formattedEndTime);
      } else if (selectedStartDate) {
        // Si on a une date de début mais pas de fin, mettre la même date
        setEndDate(format(selectedStartDate, "yyyy-MM-dd"));
        setEndTime("23:59");
      } else {
        // Si pas de date sélectionnée, mettre aujourd'hui par défaut
        const today = new Date();
        setEndDate(today.toISOString().split('T')[0]);
        setEndTime("23:59");
      }
      
      // Réinitialiser l'erreur et l'avertissement quand le dialog s'ouvre
      setError(null);
      setWarning(null);
    }
  }, [open, selectedStartDate, selectedEndDate]);

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
      const result = await blockVehicleDatesAction(
        vehicleId,
        start,
        end,
        reason || undefined
      );

      if (result.success) {
        // Afficher l'avertissement s'il y en a un (mais continuer quand même)
        if (result.warning) {
          setWarning(result.warning);
          // Ne pas fermer le dialog immédiatement si il y a un avertissement
          // L'utilisateur peut voir l'avertissement et continuer
          setTimeout(() => {
            setOpen(false);
            setStartDate("");
            setStartTime("00:00");
            setEndDate("");
            setEndTime("23:59");
            setReason("");
            setWarning(null);
            if (onSuccess) {
              onSuccess();
            } else {
              router.refresh();
            }
          }, 2000); // Fermer après 2 secondes pour laisser voir l'avertissement
        } else {
          setOpen(false);
          setStartDate("");
          setStartTime("00:00");
          setEndDate("");
          setEndTime("23:59");
          setReason("");
          if (onSuccess) {
            onSuccess();
          } else {
            router.refresh();
          }
        }
      } else {
        setError(result.error || "Erreur lors du blocage des dates");
      }
    } catch (err) {
      setError("Une erreur inattendue s'est produite");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Lock className="mr-2 h-4 w-4" />
          Bloquer des dates
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[min(92vw,420px)] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bloquer des dates</DialogTitle>
          <DialogDescription>
            Bloque une période de dates pour rendre le véhicule indisponible à la location.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={todayIso}
                  required
                  disabled={hasStarted || isSubmitting}
                  className="w-full"
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
                  min={
                    startDate === todayIso ? now.toISOString().slice(11, 16) : undefined
                  }
                  disabled={hasStarted || isSubmitting}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  min={startDate || todayIso}
                  disabled={hasEnded || isSubmitting}
                  className="w-full"
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
                  min={startDate === endDate ? startTime : undefined}
                  disabled={hasEnded || isSubmitting}
                  className="w-full"
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
                className="w-full"
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
            {hasEnded && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                Ce blocage est terminé, les dates ne peuvent plus être modifiées.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || hasEnded}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Blocage..." : "Bloquer les dates"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


