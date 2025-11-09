"use client";

import type { InvoiceListItem } from "@/actions/admin/invoices/get-invoices";
import {
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  formatCurrency,
  formatDate,
} from "./invoice-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  Download,
  Mail,
  MoreVertical,
  User,
  Car,
} from "lucide-react";

interface InvoicesGridViewProps {
  invoices: InvoiceListItem[];
  onDownload: (invoice: InvoiceListItem) => void;
  onSend: (invoice: InvoiceListItem) => void;
  isDownloading: boolean;
  isSending: boolean;
  activeDownloadId: string | null;
  activeSendId: string | null;
}

export function InvoicesGridView({
  invoices,
  onDownload,
  onSend,
  isDownloading,
  isSending,
  activeDownloadId,
  activeSendId,
}: InvoicesGridViewProps) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-lg font-semibold text-gray-900">Aucune facture.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      {invoices.map((invoice) => {
        const isDownloadPending = isDownloading && activeDownloadId === invoice.id;
        const isSendPending = isSending && activeSendId === invoice.id;

        return (
          <Card
            key={invoice.id}
            className="relative overflow-hidden border border-slate-100 shadow-sm transition-shadow hover:shadow-lg"
          >
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
                    <Badge className={`border ${INVOICE_STATUS_COLORS[invoice.status]}`}>
                      {INVOICE_STATUS_LABELS[invoice.status]}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Émise le {formatDate(invoice.issuedAt)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Échéance : {formatDate(invoice.dueDate)}
                  </p>
                  {invoice.paidAt ? (
                    <p className="text-xs text-emerald-600">
                      Payée le {formatDate(invoice.paidAt)}
                    </p>
                  ) : null}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <MoreVertical className="h-4 w-4" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        onDownload(invoice);
                      }}
                      disabled={isDownloadPending || isSendPending}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {isDownloadPending ? "Téléchargement..." : "Télécharger le PDF"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        onSend(invoice);
                      }}
                      disabled={isSendPending || isDownloadPending}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {isSendPending ? "Envoi en cours..." : "Envoyer par email"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="opacity-60">
                      <User className="mr-2 h-4 w-4" />
                      Historique client (bientôt)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="rounded-md border border-dashed border-slate-200 bg-white/70 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <span className="font-medium text-gray-900">Montant total</span>
                  <span className="text-base font-semibold text-gray-900">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs uppercase text-muted-foreground">Réservation</span>
                      <span className="font-medium text-gray-900">{invoice.booking.reference}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(invoice.booking.startDate)} → {formatDate(invoice.booking.endDate)}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {formatCurrency(invoice.total)}
                    </Badge>
                  </div>
                  <div className="rounded-md bg-slate-50 px-3 py-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Car className="h-4 w-4 text-primary" />
                      <span>
                        {invoice.booking.vehicle.brand} {invoice.booking.vehicle.model} •{" "}
                        {invoice.booking.vehicle.licensePlate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-gray-900">{invoice.user.name}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{invoice.user.email}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

