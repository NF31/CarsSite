"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText } from "lucide-react";
import { InvoiceStatus } from "@/lib/types/invoice-status";
import {
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  currencyFormatter,
  dateFormatter,
} from "@/components/client/dashboard/dashboard-constants";
import { downloadClientInvoiceAction } from "@/actions/client/invoices";
import { toast } from "sonner";

interface ClientInvoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  issuedAt: string;
  dueDate: string;
  paidAt: string | null;
  pdfUrl: string | null;
  booking: {
    id: string;
    reference: string;
    startDate: string;
    endDate: string;
    vehicle: {
      brand: string;
      model: string;
      licensePlate: string;
    };
  };
}

interface Summary {
  totalInvoices: number;
  totalAmount: number;
  outstandingAmount: number;
  paidCount: number;
  pendingCount: number;
}

interface ClientInvoicesPageClientProps {
  invoices: ClientInvoice[];
  summary: Summary;
}

export function ClientInvoicesPageClient({
  invoices,
  summary,
}: ClientInvoicesPageClientProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDownload = (invoiceId: string) => {
    setDownloadingId(invoiceId);
    startTransition(async () => {
      try {
        const result = await downloadClientInvoiceAction(invoiceId);

        if (!result.success || !result.url) {
          toast.error(result.error || "Impossible de télécharger la facture");
          return;
        }

        // Télécharger le PDF avec le nom du fichier original (comme pour le permis)
        try {
          const response = await fetch(result.url);
          if (!response.ok) throw new Error("Erreur lors du téléchargement");

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          // Utiliser le numéro de facture comme nom de fichier
          const invoice = invoices.find((inv) => inv.id === invoiceId);
          const fileName = invoice?.invoiceNumber 
            ? `facture-${invoice.invoiceNumber}.pdf`
            : `facture-${invoiceId}.pdf`;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success("Facture téléchargée avec succès");
        } catch {
          // Fallback : ouvrir dans un nouvel onglet
          window.open(result.url, "_blank", "noopener,noreferrer");
        }
      } catch (error) {
        console.error("Error downloading invoice:", error);
        toast.error("Une erreur est survenue lors du téléchargement");
      } finally {
        setDownloadingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total factures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{summary.totalInvoices}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {currencyFormatter.format(summary.totalAmount)} au total
            </p>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente de paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {currencyFormatter.format(summary.outstandingAmount)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.pendingCount} facture{summary.pendingCount > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Factures payées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{summary.paidCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Toutes régularisées</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Montant total payé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {currencyFormatter.format(summary.totalAmount - summary.outstandingAmount)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">À ce jour</p>
          </CardContent>
        </Card>
      </section>

      {/* Liste des factures */}
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle>Historique des factures</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
              <FileText className="h-10 w-10 text-slate-300" />
              <p className="text-base font-semibold text-gray-900">
                Aucune facture disponible
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Vos factures apparaîtront ici une fois vos réservations facturées.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => {
                const isDownloading = downloadingId === invoice.id && isPending;

                return (
                  <div
                    key={invoice.id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-gray-900">
                          {invoice.invoiceNumber}
                        </p>
                        <Badge
                          className={`${INVOICE_STATUS_COLORS[invoice.status]} text-[10px]`}
                        >
                          {INVOICE_STATUS_LABELS[invoice.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Émise le {dateFormatter.format(new Date(invoice.issuedAt))} • Échéance le{" "}
                        {dateFormatter.format(new Date(invoice.dueDate))}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Réservation {invoice.booking.reference} •{" "}
                        {invoice.booking.vehicle.brand} {invoice.booking.vehicle.model}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {currencyFormatter.format(invoice.total)}
                        </p>
                        {invoice.tax > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Dont TVA : {currencyFormatter.format(invoice.tax)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(invoice.id)}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-2"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="hidden sm:inline">Génération...</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Télécharger</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

