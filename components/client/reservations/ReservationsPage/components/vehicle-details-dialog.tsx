"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  currencyFormatter,
  dateTimeFormatter,
} from "@/components/client/dashboard/dashboard-constants";
import type { ProcessedBooking } from "../handlers/booking-processor";

type VehicleDetailsDialogProps = {
  booking: ProcessedBooking;
};

export function VehicleDetailsDialog({ booking }: VehicleDetailsDialogProps) {
  if (!booking.vehicle) return null;

  const startDate = new Date(booking.startDateISO);
  const endDate = new Date(booking.endDateISO);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="inline-flex items-center gap-1 text-xs sm:text-sm">
          <Info className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Détails véhicule</span>
          <span className="sm:hidden">Véhicule</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {booking.vehicle.brand} {booking.vehicle.model}
          </DialogTitle>
          <DialogDescription>
            Informations principales sur le véhicule associé à cette réservation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Marque</p>
              <p className="font-semibold text-gray-900">{booking.vehicle.brand}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Modèle</p>
              <p className="font-semibold text-gray-900">{booking.vehicle.model}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Immatriculation</p>
              <p className="font-semibold text-gray-900">{booking.vehicle.licensePlate}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Statut calculé</p>
              <Badge className={`${BOOKING_STATUS_COLORS[booking.derivedStatus]} text-[10px]`}>
                {BOOKING_STATUS_LABELS[booking.derivedStatus]}
              </Badge>
            </div>
          </div>
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Période de location</p>
            <p className="text-sm font-medium text-gray-900">
              {dateTimeFormatter.format(startDate)} → {dateTimeFormatter.format(endDate)}
            </p>
          </div>
          {booking.invoices[0] ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Facture associée</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-semibold text-gray-900">
                  {booking.invoices[0].invoiceNumber ?? "Facture en cours"}
                </span>
                <Badge className={`${INVOICE_STATUS_COLORS[booking.invoices[0].status]} text-[10px]`}>
                  {INVOICE_STATUS_LABELS[booking.invoices[0].status]}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Montant : {currencyFormatter.format(booking.invoices[0].total)}
              </p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

