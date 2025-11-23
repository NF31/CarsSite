"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2 } from "lucide-react";
import { InvoiceStatus } from "@prisma/client";
import {
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  currencyFormatter,
  dateFormatter,
} from "./dashboard-constants";
import { downloadClientInvoiceAction } from "@/actions/client/invoices";
import { toast } from "sonner";

interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  total: number;
  issuedAt: string;
  booking?: {
    reference: string;
  };
}

interface RecentInvoicesCardProps {
  invoices: RecentInvoice[];
}

export function RecentInvoicesCard({ invoices }: RecentInvoicesCardProps) {
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

        // Ouvrir le PDF dans un nouvel onglet
        window.open(result.url, "_blank", "noopener,noreferrer");
        toast.success("Facture téléchargée avec succès");
      } catch (error) {
        console.error("Error downloading invoice:", error);
        toast.error("Une erreur est survenue lors du téléchargement");
      } finally {
        setDownloadingId(null);
      }
    });
  };

  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-muted-foreground">
        Aucune facture disponible pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => {
        const isDownloading = downloadingId === invoice.id && isPending;

        return (
          <div
            key={invoice.id}
            className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{invoice.invoiceNumber}</p>
              <p className="text-xs text-muted-foreground">
                Émise le {dateFormatter.format(new Date(invoice.issuedAt))}
                {invoice.booking ? ` • Réservation ${invoice.booking.reference}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">
                {currencyFormatter.format(invoice.total)}
              </span>
              <Badge className={`${INVOICE_STATUS_COLORS[invoice.status]} text-[10px]`}>
                {INVOICE_STATUS_LABELS[invoice.status]}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(invoice.id)}
                disabled={isDownloading}
                className="inline-flex items-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="hidden sm:inline">Génération...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3 w-3" />
                    <span className="hidden sm:inline">Télécharger</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

