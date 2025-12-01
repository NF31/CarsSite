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
  dateFormatter,
  dateTimeFormatter,
} from "@/components/client/dashboard/dashboard-constants";
import type { ProcessedBooking } from "../handlers/booking-processor";

type BookingDetailsDialogProps = {
  booking: ProcessedBooking;
  servicesMap: Map<string, { id: string; name: string; price: number }>;
};

export function BookingDetailsDialog({ booking, servicesMap }: BookingDetailsDialogProps) {
  const startDate = new Date(booking.startDateISO);
  const endDate = new Date(booking.endDateISO);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="inline-flex items-center gap-1 text-xs sm:text-sm">
          <Info className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Détails réservation</span>
          <span className="sm:hidden">Détails</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Réservation {booking.reference}</DialogTitle>
          <DialogDescription>Informations détaillées de votre réservation.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Référence</p>
              <p className="font-semibold text-gray-900">{booking.reference}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Statut</p>
              <Badge className={`${BOOKING_STATUS_COLORS[booking.derivedStatus]} text-[10px]`}>
                {BOOKING_STATUS_LABELS[booking.derivedStatus]}
              </Badge>
            </div>
            {booking.createdAt ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Date de création</p>
                <p className="font-semibold text-gray-900">
                  {(() => {
                    if (!booking.createdAt) return "N/A";
                    const date = new Date(booking.createdAt);
                    if (isNaN(date.getTime())) return "N/A";
                    return dateFormatter.format(date);
                  })()}
                </p>
              </div>
            ) : null}
          </div>
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Période de location</p>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">Départ : {dateTimeFormatter.format(startDate)}</p>
              <p className="text-sm font-medium text-gray-900">Retour : {dateTimeFormatter.format(endDate)}</p>
            </div>
          </div>
          {booking.pickupLocation || booking.returnLocation ? (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Lieux</p>
              {booking.pickupLocation ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-700">Prise en charge</p>
                  <p className="text-sm text-gray-900">
                    {booking.pickupLocation.name}
                    {booking.pickupLocation.address ? ` - ${booking.pickupLocation.address}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{booking.pickupLocation.city}</p>
                </div>
              ) : null}
              {booking.returnLocation ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-700">Restitution</p>
                  <p className="text-sm text-gray-900">
                    {booking.returnLocation.name}
                    {booking.returnLocation.address ? ` - ${booking.returnLocation.address}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{booking.returnLocation.city}</p>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Prix total</p>
              <p className="font-semibold text-gray-900">{currencyFormatter.format(booking.totalPrice ?? 0)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Acompte payé</p>
              <p className="font-semibold text-gray-900">{currencyFormatter.format(booking.depositPaid ?? 0)}</p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Montant restant</p>
              <p className="font-semibold text-gray-900">
                {currencyFormatter.format((booking.totalPrice ?? 0) - (booking.depositPaid ?? 0))}
              </p>
            </div>
          </div>
          {booking.serviceIds && booking.serviceIds.length > 0 ? (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Services additionnels</p>
              <div className="space-y-1">
                {booking.serviceIds
                  .map((serviceId) => servicesMap.get(serviceId))
                  .filter(
                    (service): service is { id: string; name: string; price: number } => service !== undefined
                  )
                  .map((service) => (
                    <div key={service.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-900">{service.name}</span>
                      <span className="font-semibold text-gray-900">
                        {currencyFormatter.format(service.price)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
          {booking.notes ? (
            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Notes</p>
              <p className="text-sm text-gray-900">{booking.notes}</p>
            </div>
          ) : null}
          {booking.vehicle ? (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Véhicule</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-700">Marque</p>
                  <p className="text-sm text-gray-900">{booking.vehicle.brand}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-700">Modèle</p>
                  <p className="text-sm text-gray-900">{booking.vehicle.model}</p>
                </div>
                {booking.vehicle.licensePlate ? (
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs font-semibold text-gray-700">Immatriculation</p>
                    <p className="text-sm text-gray-900">{booking.vehicle.licensePlate}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          {booking.invoices.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Factures associées</p>
              {booking.invoices.map((invoice) => (
                <div key={invoice.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{invoice.invoiceNumber || "N/A"}</span>
                    <Badge className={`${INVOICE_STATUS_COLORS[invoice.status]} text-[10px]`}>
                      {INVOICE_STATUS_LABELS[invoice.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Montant : {currencyFormatter.format(invoice.total)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          {booking.isCancellationPending ? (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <p className="text-xs font-semibold text-orange-900 uppercase tracking-wide">
                Annulation en attente
              </p>
              {booking.cancellationRequestedAtISO ? (
                <p className="mt-1 text-xs text-orange-700">
                  Demandée le {dateTimeFormatter.format(new Date(booking.cancellationRequestedAtISO))}
                </p>
              ) : null}
              {booking.cancellationRequestedRefundRate !== null ? (
                <p className="mt-1 text-xs text-orange-700">
                  Taux de remboursement : {booking.cancellationRequestedRefundRate}%
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

