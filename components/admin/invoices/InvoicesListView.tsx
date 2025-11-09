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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import {
  Clock,
  Download,
  Mail,
  MoreHorizontal,
  User,
} from "lucide-react";

interface InvoicesListViewProps {
  invoices: InvoiceListItem[];
  onDownload: (invoice: InvoiceListItem) => void;
  onSend: (invoice: InvoiceListItem) => void;
  isDownloading: boolean;
  isSending: boolean;
  activeDownloadId: string | null;
  activeSendId: string | null;
}

export function InvoicesListView({
  invoices,
  onDownload,
  onSend,
  isDownloading,
  isSending,
  activeDownloadId,
  activeSendId,
}: InvoicesListViewProps) {
  if (invoices.length === 0) {
    return (
      <Card className="border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">Aucune facture pour le moment.</p>
      </Card>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Mode cartes mobile */}
      <div className="grid gap-4 xl:hidden">
        {invoices.map((invoice) => {
          const isDownloadPending = isDownloading && activeDownloadId === invoice.id;
          const isSendPending = isSending && activeSendId === invoice.id;

          return (
            <div key={invoice.id} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                  <Badge className={`border ${INVOICE_STATUS_COLORS[invoice.status]} text-[10px]`}>
                    {INVOICE_STATUS_LABELS[invoice.status]}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Émise le {formatDate(invoice.issuedAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Échéance le {formatDate(invoice.dueDate)}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <MoreHorizontal className="h-4 w-4" />
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

              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <p>
                  Client :{" "}
                  <span className="font-medium text-gray-900">
                    {invoice.user.name}
                  </span>
                </p>
                <p>Réservation : {invoice.booking.reference}</p>
                <p>
                  Montant :{" "}
                  <span className="font-medium text-gray-900">
                    {formatCurrency(invoice.total)}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tableau desktop */}
      <div className="hidden xl:block">
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="overflow-hidden">
            <table className="w-full table-auto text-sm text-slate-700">
              <thead className="border-b bg-gradient-to-r from-slate-50 to-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Facture</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Réservation</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Montant</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Échéance</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((invoice) => {
                  const isDownloadPending = isDownloading && activeDownloadId === invoice.id;
                  const isSendPending = isSending && activeSendId === invoice.id;
                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 align-top font-medium text-gray-900">
                        <div className="flex flex-col">
                          <span>{invoice.invoiceNumber}</span>
                          <span className="text-xs text-muted-foreground">
                            Émise le {formatDate(invoice.issuedAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{invoice.user.name}</span>
                          <span className="text-xs text-muted-foreground">{invoice.user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{invoice.booking.reference}</span>
                          <span className="text-xs text-muted-foreground">
                            {invoice.booking.vehicle.brand} {invoice.booking.vehicle.model}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top font-semibold text-gray-900">
                        {formatCurrency(invoice.total)}
                        <div className="text-xs text-muted-foreground">
                          TVA {formatCurrency(invoice.tax)}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Badge className={`border ${INVOICE_STATUS_COLORS[invoice.status]} text-[10px]`}>
                          {INVOICE_STATUS_LABELS[invoice.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {formatDate(invoice.dueDate)}
                        </div>
                        {invoice.paidAt ? (
                          <p className="mt-1 text-xs text-emerald-600">
                            Payée le {formatDate(invoice.paidAt)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                              disabled={isDownloadPending || isSendPending}
                            >
                              <MoreHorizontal className="h-4 w-4" />
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

