"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type {
  InvoiceClientItem,
  InvoiceListItem,
  InvoicesSummary,
} from "@/actions/admin/invoices/get-invoices";
import { downloadInvoiceAction, sendInvoiceAction } from "@/actions/admin/invoices";
import {
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  formatCurrency,
  formatDate,
} from "./invoice-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
  Filter,
  Grid3x3,
  List,
  Mail,
  Receipt,
  Search,
} from "lucide-react";
import { InvoicesGridView } from "./InvoicesGridView";
import { InvoicesListView } from "./InvoicesListView";
import { InvoicesPagination } from "./InvoicesPagination";

interface InvoicesPageClientProps {
  invoices: InvoiceListItem[];
  summary: InvoicesSummary;
  clients: InvoiceClientItem[];
}

type StatusFilter = "ALL" | InvoiceListItem["status"];
type ViewMode = "grid" | "list";

interface ClientBookingMatch {
  client: InvoiceClientItem;
  booking: InvoiceClientItem["bookings"][number];
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 30, 40];

export function InvoicesPageClient({ invoices, summary, clients }: InvoicesPageClientProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const [activeSendId, setActiveSendId] = useState<string | null>(null);
  const [isDownloading, startDownloadTransition] = useTransition();
  const [isSending, startSendTransition] = useTransition();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (!successMessage) {
      return;
    }
    const timeout = window.setTimeout(() => setSuccessMessage(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const hasInvoices = invoices.length > 0;

  const pendingSentInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "SENT").length,
    [invoices],
  );

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        invoice.invoiceNumber.toLowerCase().includes(normalizedSearch) ||
        invoice.user.name.toLowerCase().includes(normalizedSearch) ||
        invoice.user.email.toLowerCase().includes(normalizedSearch) ||
        invoice.booking.reference.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === "ALL" || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchValue, statusFilter]);

  const totalItems = filteredInvoices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const clampedPage = Math.min(page, totalPages);
  const startIndex = (clampedPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  const filteredClientBookings = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const matches: ClientBookingMatch[] = [];

    clients.forEach((client) => {
      const clientMatches =
        normalizedSearch.length === 0 ||
        client.name.toLowerCase().includes(normalizedSearch) ||
        client.email.toLowerCase().includes(normalizedSearch) ||
        (client.phone ?? "").toLowerCase().includes(normalizedSearch);

      client.bookings.forEach((booking) => {
        const bookingMatches =
          normalizedSearch.length === 0 ||
          booking.reference.toLowerCase().includes(normalizedSearch) ||
          booking.vehicle.brand.toLowerCase().includes(normalizedSearch) ||
          booking.vehicle.model.toLowerCase().includes(normalizedSearch) ||
          (booking.invoice ? booking.invoice.invoiceNumber.toLowerCase().includes(normalizedSearch) : false);

        if (clientMatches || bookingMatches) {
          matches.push({ client, booking });
        }
      });
    });

    return matches;
  }, [clients, searchValue]);

  const handleDownload = (invoice: InvoiceListItem) => {
    startDownloadTransition(async () => {
      setErrorMessage(null);
      setActiveDownloadId(invoice.id);
      const result = await downloadInvoiceAction(invoice.id);
      setActiveDownloadId(null);

      if (!result.success || !result.url) {
        setErrorMessage(result.error ?? "Impossible de télécharger la facture.");
        return;
      }

      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  };

  const handleSend = (invoice: InvoiceListItem) => {
    startSendTransition(async () => {
      setErrorMessage(null);
      setActiveSendId(invoice.id);
      const result = await sendInvoiceAction(invoice.id);
      setActiveSendId(null);

      if (!result.success) {
        setErrorMessage(result.error ?? "Impossible d'envoyer la facture.");
        return;
      }

      setSuccessMessage(`Facture ${invoice.invoiceNumber} envoyée avec succès.`);
    });
  };

  const handleGenerate = (client: InvoiceClientItem, bookingId?: string) => {
    console.log("[Invoices] Génération de facture demandée", { clientId: client.id, bookingId });
    setSuccessMessage("La génération de facture sera disponible bientôt.");
  };

  const clientBookingGrid = (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filteredClientBookings.map(({ client, booking }) => {
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
                  {hasInvoice
                    ? INVOICE_STATUS_LABELS[booking.invoice!.status]
                    : "À facturer"}
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
                  onClick={() => handleGenerate(client, booking.id)}
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

  const clientBookingList = (
    <div className="space-y-4">
      <div className="grid gap-3 lg:hidden">
        {filteredClientBookings.map(({ client, booking }) => {
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
                  {hasInvoice
                    ? INVOICE_STATUS_LABELS[booking.invoice!.status]
                    : "À facturer"}
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
                onClick={() => handleGenerate(client, booking.id)}
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
              {filteredClientBookings.map(({ client, booking }) => {
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
                        {hasInvoice
                          ? INVOICE_STATUS_LABELS[booking.invoice!.status]
                          : "À facturer"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatCurrency(invoiceTotal)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        onClick={() => handleGenerate(client, booking.id)}
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

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Factures</h1>
          <p className="text-sm text-muted-foreground">
            Téléchargez et envoyez les factures clients en un clic. Suivez leurs statuts en temps réel.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row">
          <Button variant="outline" disabled>
            <Receipt className="mr-2 h-4 w-4" />
            Générer une facture (bientôt)
          </Button>
          <Button disabled>
            <Mail className="mr-2 h-4 w-4" />
            Envoyer en masse (bientôt)
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full items-center gap-3 md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une facture, un client, une réservation…"
                  className="pl-9"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value: StatusFilter) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="DRAFT">{INVOICE_STATUS_LABELS.DRAFT}</SelectItem>
                  <SelectItem value="SENT">{INVOICE_STATUS_LABELS.SENT}</SelectItem>
                  <SelectItem value="PAID">{INVOICE_STATUS_LABELS.PAID}</SelectItem>
                  <SelectItem value="OVERDUE">{INVOICE_STATUS_LABELS.OVERDUE}</SelectItem>
                  <SelectItem value="CANCELLED">{INVOICE_STATUS_LABELS.CANCELLED}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchValue("");
                setStatusFilter("ALL");
                setPage(1);
              }}
            >
              Réinitialiser
            </Button>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            Utilisez la recherche pour filtrer par numéro de facture, client ou référence de réservation.
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Factures totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{summary.totalInvoices}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatCurrency(summary.totalAmount)} facturés
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente de paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {formatCurrency(summary.outstandingAmount)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {pendingSentInvoices} factures à échéance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Factures payées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{summary.paidCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.sentCount} factures envoyées
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{summary.overdueCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.draftCount} brouillons à finaliser
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>
                {filteredInvoices.length} facture{filteredInvoices.length > 1 ? "s" : ""} trouvée{filteredInvoices.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                aria-label="Vue grille"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                aria-label="Vue liste"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {paginatedInvoices.length} élément{paginatedInvoices.length > 1 ? "s" : ""} affiché{paginatedInvoices.length > 1 ? "s" : ""} sur {totalItems}
            </p>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                const numeric = Number(value);
                setItemsPerPage(Number.isNaN(numeric) ? 10 : numeric);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="10 par page" />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {successMessage && (
        <Card className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <CardContent className="flex items-center justify-between gap-3 py-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-wide hover:underline"
              onClick={() => setSuccessMessage(null)}
            >
              Fermer
            </button>
          </CardContent>
        </Card>
      )}

      {errorMessage && (
        <Card className="border-red-200 bg-red-50 text-red-800">
          <CardContent className="flex items-center justify-between gap-3 py-3 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-wide hover:underline"
              onClick={() => setErrorMessage(null)}
            >
              Fermer
            </button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="text-lg font-semibold">Historique des factures</CardTitle>
            <p className="text-sm text-muted-foreground">
              {filteredInvoices.length} facture{filteredInvoices.length > 1 ? "s" : ""} affichée
              {filteredInvoices.length > 1 ? "s" : ""}. Téléchargez ou envoyez-les directement.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {!hasInvoices ? (
            filteredClientBookings.length > 0 ? (
              viewMode === "grid" ? clientBookingGrid : clientBookingList
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                <Receipt className="h-10 w-10 text-slate-300" />
                <p className="text-base font-semibold text-gray-900">
                  Aucune facture disponible
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Les factures générées apparaîtront ici. Créez une réservation facturable pour commencer.
                </p>
              </div>
            )
          ) : filteredInvoices.length === 0 ? (
            filteredClientBookings.length > 0 ? (
              viewMode === "grid" ? clientBookingGrid : clientBookingList
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                <Search className="h-10 w-10 text-slate-300" />
                <p className="text-base font-semibold text-gray-900">
                  Aucun résultat pour ces filtres
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Modifiez la recherche ou le statut sélectionné pour afficher les factures correspondantes.
                </p>
              </div>
            )
          ) : viewMode === "grid" ? (
            <InvoicesGridView
              invoices={paginatedInvoices}
              onDownload={handleDownload}
              onSend={handleSend}
              isDownloading={isDownloading}
              isSending={isSending}
              activeDownloadId={activeDownloadId}
              activeSendId={activeSendId}
            />
          ) : (
            <InvoicesListView
              invoices={paginatedInvoices}
              onDownload={handleDownload}
              onSend={handleSend}
              isDownloading={isDownloading}
              isSending={isSending}
              activeDownloadId={activeDownloadId}
              activeSendId={activeSendId}
            />
          )}
        </CardContent>
      </Card>

      <InvoicesPagination
        page={clampedPage}
        totalPages={totalPages}
        totalItems={totalItems}
        limit={itemsPerPage}
        onPageChange={setPage}
      />
    </div>
  );
}


