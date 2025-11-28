import { memo } from "react";
import { Calendar, FileText, Receipt, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate, INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS } from "../invoice-helpers";
import type { ClientBookingMatch } from "../hooks/useClientBookingsFilter";

interface ClientBookingsSectionProps {
  bookings: ClientBookingMatch[];
  viewMode: "grid" | "list";
  onGenerate: (clientId: string, bookingId?: string) => void;
}

export const ClientBookingsSection = memo(function ClientBookingsSection({
  bookings,
  viewMode,
  onGenerate,
}: ClientBookingsSectionProps) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
        <Receipt className="h-10 w-10 text-slate-300" />
        <p className="text-base font-semibold text-gray-900">Aucune réservation disponible</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Les réservations facturables apparaîtront ici. Créez une réservation facturable pour commencer.
        </p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bookings.map(({ client, booking }) => {
          const hasInvoice = Boolean(booking.invoice);
          const invoiceTotal = hasInvoice ? booking.invoice!.total : booking.totalPrice;

          return (
            <Card key={`${client.id}-${booking.id}`} className="border border-slate-100 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{client.name}</h3>
                    <p className="text-xs text-muted-foreground">{client.email}</p>
                    {client.phone ? (
                      <p className="text-xs text-muted-foreground">{client.phone}</p>
                    ) : null}
                  </div>
                  <Badge
                    className={`text-[10px] ${
                      hasInvoice
                        ? INVOICE_STATUS_COLORS[booking.invoice!.status]
                        : "border-slate-200 bg-white text-slate-600"
                    } border`}
                  >
                    {hasInvoice ? INVOICE_STATUS_LABELS[booking.invoice!.status] : "À facturer"}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    Montant : {formatCurrency(invoiceTotal)}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    {hasInvoice ? (
                      <span>
                        Facture {booking.invoice!.invoiceNumber} – {formatCurrency(booking.invoice!.total)}
                      </span>
                    ) : (
                      <span>Aucune facture générée pour cette réservation.</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => onGenerate(client.id, booking.id)}
                    disabled={hasInvoice}
                  >
                    {hasInvoice ? "Facture déjà générée" : "Générer une facture"}
                  </Button>
                  {hasInvoice ? (
                    <p className="text-xs text-muted-foreground">
                      Retrouvez la facture ci-dessus pour la télécharger ou l&apos;envoyer.
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:hidden">
        {bookings.map(({ client, booking }) => {
          const hasInvoice = Boolean(booking.invoice);
          const invoiceTotal = hasInvoice ? booking.invoice!.total : booking.totalPrice;

          return (
            <div
              key={`${client.id}-${booking.id}`}
              className="space-y-3 rounded-lg border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{client.name}</h3>
                  <p className="text-xs text-muted-foreground">{client.email}</p>
                  {client.phone ? (
                    <p className="text-xs text-muted-foreground">{client.phone}</p>
                  ) : null}
                </div>
                <Badge
                  className={`text-[10px] ${
                    hasInvoice
                      ? INVOICE_STATUS_COLORS[booking.invoice!.status]
                      : "border-slate-200 bg-white text-slate-600"
                  } border`}
                >
                  {hasInvoice ? INVOICE_STATUS_LABELS[booking.invoice!.status] : "À facturer"}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{booking.reference}</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(invoiceTotal)}</span>
                </div>
                <div className="text-xs">
                  {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                </div>
              </div>

              <Button
                size="sm"
                className="w-full"
                onClick={() => onGenerate(client.id, booking.id)}
                disabled={hasInvoice}
              >
                {hasInvoice ? "Facture déjà générée" : "Générer une facture"}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="hidden lg:block">
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="w-full table-auto text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Client</th>
                <th className="px-4 py-3 text-left font-semibold">Réservation</th>
                <th className="px-4 py-3 text-left font-semibold">Statut facture</th>
                <th className="px-4 py-3 text-left font-semibold">Montant</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map(({ client, booking }) => {
                const hasInvoice = Boolean(booking.invoice);
                const invoiceTotal = hasInvoice ? booking.invoice!.total : booking.totalPrice;

                return (
                  <tr key={`${client.id}-${booking.id}`} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                      {client.phone ? (
                        <p className="text-xs text-muted-foreground">{client.phone}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{booking.reference}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`text-[10px] ${
                          hasInvoice
                            ? INVOICE_STATUS_COLORS[booking.invoice!.status]
                            : "border-slate-200 bg-white text-slate-600"
                        } border`}
                      >
                        {hasInvoice ? INVOICE_STATUS_LABELS[booking.invoice!.status] : "À facturer"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatCurrency(invoiceTotal)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        onClick={() => onGenerate(client.id, booking.id)}
                        disabled={hasInvoice}
                      >
                        {hasInvoice ? "Facture générée" : "Générer"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

