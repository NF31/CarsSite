import { useState, useTransition, useCallback } from "react";
import { downloadInvoiceAction, sendInvoiceAction } from "@/actions/admin/invoices";
import type { InvoiceListItem } from "@/actions/admin/invoices/get-invoices";

export function useInvoicesActions() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const [activeSendId, setActiveSendId] = useState<string | null>(null);
  const [isDownloading, startDownloadTransition] = useTransition();
  const [isSending, startSendTransition] = useTransition();

  const handleDownload = useCallback(
    (invoice: InvoiceListItem) => {
      startDownloadTransition(async () => {
        setErrorMessage(null);
        setActiveDownloadId(invoice.id);
        const result = await downloadInvoiceAction(invoice.id);
        setActiveDownloadId(null);

        if (!result.success || !result.url) {
          setErrorMessage(result.error ?? "Impossible de télécharger la facture.");
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
          setSuccessMessage(`Facture ${invoice.invoiceNumber} téléchargée avec succès.`);
        } catch {
          // Fallback : ouvrir dans un nouvel onglet
          window.open(result.url, "_blank", "noopener,noreferrer");
        }
      });
    },
    []
  );

  const handleSend = useCallback((invoice: InvoiceListItem) => {
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
  }, []);

  const handleGenerate = useCallback((clientId: string, bookingId?: string) => {
    console.log("[Invoices] Génération de facture demandée", { clientId, bookingId });
    setSuccessMessage("La génération de facture sera disponible bientôt.");
  }, []);

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  const clearErrorMessage = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    successMessage,
    errorMessage,
    activeDownloadId,
    activeSendId,
    isDownloading,
    isSending,
    handleDownload,
    handleSend,
    handleGenerate,
    clearSuccessMessage,
    clearErrorMessage,
  };
}

