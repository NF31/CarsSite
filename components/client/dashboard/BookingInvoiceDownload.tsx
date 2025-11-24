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

        // Ouvrir le PDF dans un nouvel onglet
        const newWindow = window.open(result.url, "_blank", "noopener,noreferrer");
        
        // Vérifier que la fenêtre s'est bien ouverte (pas bloquée par un bloqueur de popup)
        if (!newWindow) {
          toast.error("Impossible d'ouvrir la facture. Veuillez autoriser les fenêtres popup pour ce site.");
          return;
        }

        // Attendre un court instant pour vérifier si la fenêtre se ferme immédiatement (erreur)
        setTimeout(() => {
          if (newWindow.closed) {
            // La fenêtre s'est fermée, probablement une erreur
            toast.error("Erreur lors du chargement de la facture. Veuillez réessayer.");
          } else {
            // Tout semble OK, afficher le message de succès
            toast.success("Facture téléchargée avec succès");
          }
        }, 500);
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

