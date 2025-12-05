"use client";

import { useState, useEffect, useMemo, startTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EditBookingDialogProps } from "./types";
import { formatDateTimeLocal, minDateTimeValue } from "./utils/helpers";
import { useAvailabilityCheck } from "./hooks/use-availability-check";
import { usePriceCalculation } from "./hooks/use-price-calculation";
import { useBookingUpdate } from "./hooks/use-booking-update";
import { SubmitButton } from "./components/submit-button";
import { AvailabilityMessage } from "./components/availability-message";
import { PriceComparisonCard } from "./components/price-comparison-card";

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
  const [open, setOpen] = useState(false);
  const [startValue, setStartValue] = useState(() => formatDateTimeLocal(startDate));
  const [endValue, setEndValue] = useState(() => formatDateTimeLocal(endDate));

  const { state, action } = useBookingUpdate(setOpen);

  const { availabilityState, isCheckingAvailability, isSubmitDisabled } = useAvailabilityCheck(
    bookingId,
    open,
    startValue,
    endValue,
    startDate,
    endDate
  );

  const { priceCalculation, isCalculatingPrice } = usePriceCalculation(
    open,
    startValue,
    endValue,
    vehicleId,
    serviceIds,
    depositPaid,
    startDate,
    endDate
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    startTransition(() => {
      setStartValue(formatDateTimeLocal(startDate));
      setEndValue(formatDateTimeLocal(endDate));
    });
  }, [open, startDate, endDate]);

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
        <Button variant="outline" size="sm" disabled={disabled} className="text-xs sm:text-sm" aria-label="Modifier la réservation">
          <span className="hidden sm:inline">Modifier la réservation</span>
          <span className="sm:hidden">Modifier</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier les dates de la réservation</DialogTitle>
          <DialogDescription>
            Sélectionnez de nouvelles dates de départ et de retour. Votre demande sera traitée dans les plus brefs
            délais.
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
            <AvailabilityMessage
              availabilityState={availabilityState}
              isCheckingAvailability={isCheckingAvailability}
            />

            {/* Affichage de la comparaison des prix */}
            {priceCalculation && (
              <PriceComparisonCard
                priceCalculation={priceCalculation}
                currentTotalPrice={currentTotalPrice}
                depositPaid={depositPaid}
                securityDepositPaid={securityDepositPaid}
                isCalculatingPrice={isCalculatingPrice}
              />
            )}
          </div>
          {state.error ? <p className="text-sm font-medium text-red-600">{state.error}</p> : null}
          <div className="flex justify-end">
            <SubmitButton disabled={isSubmitDisabled} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

