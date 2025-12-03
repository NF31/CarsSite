"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2 } from "lucide-react";
import { InvoiceStatus } from "@prisma/client";
import { downloadClientInvoiceAction } from "@/actions/client/invoices";
import { toast } from "sonner";

interface BookingInvoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
}

interface BookingInvoiceDownloadProps {
  invoice: BookingInvoice | null;
}

export function BookingInvoiceDownload({ invoice }: BookingInvoiceDownloadProps) {
  const [isPending, startTransition] = useTransition();

  const handleDownload = () => {
    if (!invoice) return;

    startTransition(async () => {
      try {
        const result = await downloadClientInvoiceAction(invoice.id);

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
          const fileName = invoice.invoiceNumber 
            ? `facture-${invoice.invoiceNumber}.pdf`
            : `facture-${invoice.id}.pdf`;
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
      }
    });
  };

  if (!invoice) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        Facture en cours
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-xs">
        Facture {invoice.invoiceNumber}
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        disabled={isPending}
        className="h-7 px-2 text-xs"
        title="Télécharger la facture"
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Download className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

