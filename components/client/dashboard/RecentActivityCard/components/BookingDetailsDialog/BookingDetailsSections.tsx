import { Badge } from "@/components/ui/badge";
import type { ClientRecentBooking } from "@/actions/client/bookings/get-recent";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  currencyFormatter,
  dateFormatter,
  dateTimeFormatter,
} from "../../../dashboard-constants";

export function BookingBasicInfo({ booking }: { booking: ClientRecentBooking }) {
  return (
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
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Statut original</p>
        <Badge className={`${BOOKING_STATUS_COLORS[booking.status]} text-[10px]`}>
          {BOOKING_STATUS_LABELS[booking.status]}
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
  );
}

export function BookingPeriodSection({ startDate, endDate }: { startDate: Date; endDate: Date }) {
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">Période de location</p>
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-900">Départ : {dateTimeFormatter.format(startDate)}</p>
        <p className="text-sm font-medium text-gray-900">Retour : {dateTimeFormatter.format(endDate)}</p>
      </div>
    </div>
  );
}

export function BookingLocationsSection({ booking }: { booking: ClientRecentBooking }) {
  if (!booking.pickupLocation && !booking.returnLocation) {
    return null;
  }

  return (
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
  );
}

export function BookingPricingSection({ booking }: { booking: ClientRecentBooking }) {
  return (
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
          {currencyFormatter.format(booking.remainingAmount ?? 0)}
        </p>
      </div>
    </div>
  );
}

export function BookingServicesSection({ booking }: { booking: ClientRecentBooking }) {
  if (booking.services.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">Services additionnels</p>
      <div className="space-y-1">
        {booking.services.map((service) => (
          <div key={service.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-900">{service.name}</span>
            <span className="font-semibold text-gray-900">{currencyFormatter.format(service.price)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BookingNotesSection({ booking }: { booking: ClientRecentBooking }) {
  if (!booking.notes) {
    return null;
  }

  return (
    <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">Notes</p>
      <p className="text-sm text-gray-900">{booking.notes}</p>
    </div>
  );
}

export function BookingCancellationPendingSection({ booking }: { booking: ClientRecentBooking }) {
  if (!booking.isCancellationPending) {
    return null;
  }

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
      <p className="text-xs font-semibold text-orange-900 uppercase tracking-wide">Annulation en attente</p>
      {booking.cancellationRequestedAt ? (
        <p className="mt-1 text-xs text-orange-700">
          Demandée le {dateTimeFormatter.format(new Date(booking.cancellationRequestedAt))}
        </p>
      ) : null}
      {booking.cancellationRequestedRefundRate !== null ? (
        <p className="mt-1 text-xs text-orange-700">
          Taux de remboursement : {booking.cancellationRequestedRefundRate}%
        </p>
      ) : null}
    </div>
  );
}

export function BookingInvoicesSection({ booking }: { booking: ClientRecentBooking }) {
  if (booking.invoices.length === 0) {
    return null;
  }

  return (
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
  );
}

