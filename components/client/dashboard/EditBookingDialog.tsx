"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateClientBookingAction, UpdateBookingResult } from "@/actions/client/bookings/update-booking";
import { checkClientBookingAvailabilityAction } from "@/actions/client/bookings/check-availability";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EditBookingDialogProps {
  bookingId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  vehicleId: string;
  serviceIds: string[];
  depositPaid: number;
  securityDepositPaid?: number;
  disabled?: boolean;
}

function formatDateTimeLocal(dateValue: string) {
  const date = new Date(dateValue);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

function minDateTimeValue(offsetMinutes = 0) {
  const date = new Date();
  date.setMinutes(date.getMinutes() + offsetMinutes);
  return formatDateTimeLocal(date.toISOString());
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? "Enregistrement..." : "Enregistrer les nouvelles dates"}
    </Button>
  );
}

export function EditBookingDialog({
  bookingId,
  startDate,
  endDate,
  totalPrice: currentTotalPrice,
  vehicleId,
  serviceIds,
  depositPaid,
  securityDepositPaid = 0,
  disabled = false,
}: EditBookingDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initialState = useMemo<UpdateBookingResult>(() => ({ success: false, error: undefined }), []);
  const [state, action] = useActionState(updateClientBookingAction, initialState);
  const [availabilityState, setAvailabilityState] = useState<
    | { status: "idle" }
    | { status: "checking" }
    | { status: "available" }
    | { status: "booking_conflict"; message: string }
    | { status: "maintenance_conflict"; message: string }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const [isCheckingAvailability, startAvailabilityTransition] = useTransition();
  const [priceCalculation, setPriceCalculation] = useState<{
    totalPrice: number;
    remainingAmount: number;
    newDownPayment: number;
    depositDifference: number;
  } | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const scheduleAvailabilityUpdate = useCallback(
    (nextState: typeof availabilityState) => {
      startAvailabilityTransition(() => {
        setAvailabilityState(nextState);
      });
    },
    [startAvailabilityTransition],
  );


  const [startValue, setStartValue] = useState(() => formatDateTimeLocal(startDate));
  const [endValue, setEndValue] = useState(() => formatDateTimeLocal(endDate));

  useEffect(() => {
    if (!open) {
      setPriceCalculation(null);
      return;
    }
    startTransition(() => {
      setStartValue(formatDateTimeLocal(startDate));
      setEndValue(formatDateTimeLocal(endDate));
      setPriceCalculation(null);
    });
  }, [open, startDate, endDate]);

  // Calculer le nouveau prix quand les dates changent
  useEffect(() => {
    if (!open) {
      return;
    }

    const start = startValue ? new Date(startValue) : null;
    const end = endValue ? new Date(endValue) : null;

    if (!start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
      setPriceCalculation(null);
      return;
    }

    if (end <= start) {
      setPriceCalculation(null);
      return;
    }

    const originalStart = formatDateTimeLocal(startDate);
    const originalEnd = formatDateTimeLocal(endDate);
    
    // Si les dates n'ont pas changé, ne pas calculer
    if (startValue === originalStart && endValue === originalEnd) {
      setPriceCalculation(null);
      return;
    }

    // Calculer le nouveau prix
    setIsCalculatingPrice(true);
    const calculatePrice = async () => {
      try {
        const startHours = start.getHours().toString().padStart(2, "0");
        const startMinutes = start.getMinutes().toString().padStart(2, "0");
        const endHours = end.getHours().toString().padStart(2, "0");
        const endMinutes = end.getMinutes().toString().padStart(2, "0");

        const result = await calculateBookingPriceAction({
          vehicleId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          startTime: `${startHours}:${startMinutes}`,
          endTime: `${endHours}:${endMinutes}`,
          serviceIds: serviceIds || [],
        });

        if (result.success && result.data) {
          const newTotalPrice = result.data.totalPrice;
          const newDownPayment = Math.round(newTotalPrice * 0.3 * 100) / 100;
          const newRemainingAmount = Math.round((newTotalPrice - newDownPayment) * 100) / 100;
          const depositDifference = newDownPayment - depositPaid;
          setPriceCalculation({
            totalPrice: newTotalPrice,
            remainingAmount: newRemainingAmount,
            newDownPayment,
            depositDifference,
          });
        } else {
          setPriceCalculation(null);
        }
      } catch (error) {
        console.error("Erreur lors du calcul du prix", error);
        setPriceCalculation(null);
      } finally {
        setIsCalculatingPrice(false);
      }
    };

    calculatePrice();
  }, [open, startValue, endValue, vehicleId, serviceIds, depositPaid, startDate, endDate]);

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
          description: "Votre demande de modification de dates a été envoyée avec succès. Elle sera traitée par un administrateur dans les plus brefs délais. Vous recevrez un email de confirmation une fois la modification validée.",
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
  }, [state.success, state.error, state.requiresPayment, state.paymentUrl, state.refundAmount, router]);

  useEffect(() => {
    if (!open) {
      scheduleAvailabilityUpdate({ status: "idle" });
      return;
    }

    const start = startValue ? new Date(startValue) : null;
    const end = endValue ? new Date(endValue) : null;
    const now = new Date();

    if (!start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
      scheduleAvailabilityUpdate({ status: "idle" });
      return;
    }

    if (end <= start) {
      scheduleAvailabilityUpdate({
        status: "error",
        message: "La date de fin doit être postérieure à la date de début.",
      });
      return;
    }

    if (start <= now) {
      scheduleAvailabilityUpdate({
        status: "error",
        message: "La date de départ doit être dans le futur.",
      });
      return;
    }

    if (end <= now) {
      scheduleAvailabilityUpdate({
        status: "error",
        message: "La date de fin doit être dans le futur.",
      });
      return;
    }

    const originalStart = formatDateTimeLocal(startDate);
    const originalEnd = formatDateTimeLocal(endDate);
    // Si les dates n'ont pas changé, afficher une disponibilité neutre
    if (startValue === originalStart && endValue === originalEnd) {
      scheduleAvailabilityUpdate({ status: "available" });
      return;
    }

    scheduleAvailabilityUpdate({ status: "checking" });
    startAvailabilityTransition(async () => {
      const result = await checkClientBookingAvailabilityAction({
        bookingId,
        startDate: new Date(startValue).toISOString(),
        endDate: new Date(endValue).toISOString(),
      });

      if (!result.success) {
        scheduleAvailabilityUpdate({
          status: "error",
          message: result.error ?? "Impossible de vérifier la disponibilité.",
        });
        return;
      }

      if (result.status === "available") {
        scheduleAvailabilityUpdate({ status: "available" });
        return;
      }

      if (result.status === "booking_conflict") {
        scheduleAvailabilityUpdate({
          status: "booking_conflict",
          message: `Réservation existante (${result.conflict.reference}) du ${format(
            new Date(result.conflict.startDate),
            "dd/MM/yyyy HH:mm",
            { locale: fr },
          )} au ${format(new Date(result.conflict.endDate), "dd/MM/yyyy HH:mm", { locale: fr })}.`,
        });
        return;
      }

      if (result.status === "maintenance_conflict") {
        scheduleAvailabilityUpdate({
          status: "maintenance_conflict",
          message: `Maintenance planifiée (${result.maintenance.type.toLowerCase()}) du ${format(
            new Date(result.maintenance.startDate),
            "dd/MM/yyyy HH:mm",
            { locale: fr },
          )} au ${format(new Date(result.maintenance.endDate), "dd/MM/yyyy HH:mm", { locale: fr })}.`,
        });
      }
    });
  }, [
    bookingId,
    endDate,
    endValue,
    open,
    scheduleAvailabilityUpdate,
    startAvailabilityTransition,
    startDate,
    startValue,
  ]);

  const availabilityMessage =
    availabilityState.status === "checking" || isCheckingAvailability
      ? "Vérification des disponibilités en cours..."
      : availabilityState.status === "available"
      ? "Le véhicule est disponible pour les dates sélectionnées."
      : availabilityState.status === "booking_conflict" || availabilityState.status === "maintenance_conflict"
      ? availabilityState.message
      : availabilityState.status === "error"
      ? availabilityState.message
      : "Sélectionnez vos nouvelles dates pour vérifier la disponibilité.";

  const availabilityClassName = cn(
    "rounded-md border px-3 py-2 text-sm transition-colors",
    availabilityState.status === "available"
      ? "border-green-200 bg-green-50 text-green-700"
      : availabilityState.status === "booking_conflict" || availabilityState.status === "maintenance_conflict"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : availabilityState.status === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-slate-200 bg-slate-50 text-muted-foreground",
  );

  const isSubmitDisabled =
    availabilityState.status === "checking" ||
    isCheckingAvailability ||
    availabilityState.status === "booking_conflict" ||
    availabilityState.status === "maintenance_conflict" ||
    availabilityState.status === "error";

  const minStart = useMemo(() => minDateTimeValue(30), []);
  const minEnd = useMemo(() => {
    const start = new Date(startValue);
    if (Number.isNaN(start.getTime())) {
      return minStart;
    }
    start.setHours(start.getHours() + 1);
    return formatDateTimeLocal(start.toISOString());
  }, [startValue, minStart]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          Modifier la réservation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier les dates de la réservation</DialogTitle>
          <DialogDescription>
            Sélectionnez de nouvelles dates de départ et de retour. La réservation passera en
            statut <span className="font-semibold text-primary">En attente</span> jusqu&apos;à
            validation par un administrateur.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="bookingId" value={bookingId} />
          <div className="space-y-3">
            <div className="space-y-2">
              <label htmlFor={`start-${bookingId}`} className="text-sm font-medium text-gray-900">
                Nouvelle date de départ
              </label>
              <Input
                id={`start-${bookingId}`}
                name="startDate"
                type="datetime-local"
                value={startValue}
                min={minStart}
                onChange={(event) => setStartValue(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor={`end-${bookingId}`} className="text-sm font-medium text-gray-900">
                Nouvelle date de retour
              </label>
              <Input
                id={`end-${bookingId}`}
                name="endDate"
                type="datetime-local"
                value={endValue}
                min={startValue > minEnd ? startValue : minEnd}
                onChange={(event) => setEndValue(event.target.value)}
                required
              />
            </div>
            <div className={availabilityClassName}>{availabilityMessage}</div>
            
            {/* Affichage de la comparaison des prix */}
            {priceCalculation && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Prix actuel :</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    }).format(currentTotalPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Nouveau prix :</span>
                  <span className="text-sm font-semibold text-blue-900">
                    {isCalculatingPrice ? (
                      <span className="text-muted-foreground">Calcul en cours...</span>
                    ) : (
                      new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      }).format(priceCalculation.totalPrice)
                    )}
                  </span>
                </div>
                {!isCalculatingPrice && (
                  <>
                    <div className="border-t border-blue-200 pt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Acompte actuel (30%) :</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(depositPaid)}
                        </span>
                      </div>
                      {securityDepositPaid > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Caution déjà payée :</span>
                          <span className="text-sm font-semibold text-green-600">
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            }).format(securityDepositPaid)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Nouvel acompte (30%) :</span>
                        <span className="text-sm font-semibold text-blue-900">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(priceCalculation.newDownPayment)}
                        </span>
                      </div>
                      {priceCalculation.depositDifference !== 0 && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-sm font-medium text-gray-700">Différence d'acompte :</span>
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              priceCalculation.depositDifference > 0
                                ? "text-red-600"
                                : "text-green-600"
                            )}
                          >
                            {priceCalculation.depositDifference > 0 ? "+" : ""}
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            }).format(priceCalculation.depositDifference)}
                          </span>
                        </div>
                      )}
                    </div>
                    {priceCalculation.depositDifference < 0 && (
                      <div className="rounded-md bg-green-50 p-3 border border-green-200">
                        <p className="text-xs text-green-700 font-medium mb-1">
                          💰 Remboursement prévu
                        </p>
                        <p className="text-xs text-green-600">
                          Un remboursement de {Math.abs(priceCalculation.depositDifference).toFixed(2)}€ sera effectué sous 5-10 jours ouvrés.
                        </p>
                      </div>
                    )}
                    {priceCalculation.depositDifference > 0 && (
                      <div className="rounded-md bg-amber-50 p-3 border border-amber-200">
                        <p className="text-xs text-amber-700 font-medium mb-1">
                          💳 Paiement supplémentaire requis
                        </p>
                        <p className="text-xs text-amber-600">
                          Vous avez déjà payé {depositPaid.toFixed(2)}€ d'acompte. Seule la différence de {priceCalculation.depositDifference.toFixed(2)}€ sera demandée (pas le nouvel acompte en entier).
                          {securityDepositPaid > 0 && (
                            <span className="block mt-1 text-amber-700 font-medium">
                              ℹ️ La caution de garantie ({securityDepositPaid.toFixed(2)}€) a déjà été payée et ne sera pas redemandée.
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    <div className="border-t border-blue-200 pt-2 space-y-3">
                      {/* Ancien solde */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Ancien solde à payer :</span>
                        <span className="text-sm text-gray-700">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(currentTotalPrice - depositPaid)}
                        </span>
                      </div>
                      
                      {/* Nouveau solde */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Nouveau solde à payer :</span>
                        <span className="font-semibold text-blue-900">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(priceCalculation.remainingAmount)}
                        </span>
                      </div>
                      
                      {/* Différence de solde */}
                      {(() => {
                        const oldRemainingAmount = currentTotalPrice - depositPaid;
                        const newRemainingAmount = priceCalculation.remainingAmount;
                        const remainingDifference = newRemainingAmount - oldRemainingAmount;
                        const roundedDifference = Math.round(remainingDifference * 100) / 100;
                        
                        if (roundedDifference !== 0) {
                          return (
                            <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                              <span className="text-sm font-medium text-gray-700">Différence de solde :</span>
                              <span
                                className={cn(
                                  "text-sm font-semibold",
                                  roundedDifference > 0 ? "text-red-600" : "text-green-600"
                                )}
                              >
                                {roundedDifference > 0 ? "+" : ""}
                                {new Intl.NumberFormat("fr-FR", {
                                  style: "currency",
                                  currency: "EUR",
                                }).format(roundedDifference)}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Explication */}
                      {(() => {
                        const oldRemainingAmount = currentTotalPrice - depositPaid;
                        const newRemainingAmount = priceCalculation.remainingAmount;
                        const remainingDifference = newRemainingAmount - oldRemainingAmount;
                        const roundedDifference = Math.round(remainingDifference * 100) / 100;
                        
                        if (roundedDifference > 0) {
                          return (
                            <div className="rounded-md bg-amber-50 p-3 border border-amber-200">
                              <p className="text-xs text-amber-700 font-medium mb-1">
                                ⚠️ Solde à payer augmenté
                              </p>
                              <p className="text-xs text-amber-600">
                                Vous devrez payer {Math.abs(roundedDifference).toFixed(2)}€ de plus à la remise du véhicule qu'initialement prévu.
                              </p>
                            </div>
                          );
                        } else if (roundedDifference < 0) {
                          return (
                            <div className="rounded-md bg-green-50 p-3 border border-green-200">
                              <p className="text-xs text-green-700 font-medium mb-1">
                                ✅ Solde à payer réduit
                              </p>
                              <p className="text-xs text-green-600">
                                Vous paierez {Math.abs(roundedDifference).toFixed(2)}€ de moins à la remise du véhicule qu'initialement prévu.
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    {priceCalculation.totalPrice === currentTotalPrice && priceCalculation.depositDifference === 0 && (
                      <div className="rounded-md bg-green-50 p-2 border border-green-200">
                        <p className="text-xs text-green-700 text-center font-medium">
                          Le prix et l'acompte restent identiques
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          {state.error ? (
            <p className="text-sm font-medium text-red-600">{state.error}</p>
          ) : null}
          <div className="flex justify-end">
            <SubmitButton disabled={isSubmitDisabled} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

