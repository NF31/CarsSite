import { InvoiceStatus } from "@/lib/types/invoice-status";

/**
 * Handler pour le traitement des factures
 */

export interface InvoiceStats {
  outstandingInvoices: Array<{ id: string; status: InvoiceStatus; total: number }>;
  paidInvoices: Array<{ id: string; status: InvoiceStatus; total: number }>;
  totalSpent: number;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string | null;
    status: InvoiceStatus;
    total: number;
    issuedAt: Date;
    booking?: { reference: string };
  }>;
}

/**
 * Traite les factures pour calculer les statistiques
 */
export function processInvoices(
  invoices: Array<{
    id: string;
    invoiceNumber: string | null;
    status: InvoiceStatus;
    total: number;
    issuedAt: Date;
    booking?: { reference: string };
  }>
): InvoiceStats {
  const outstandingInvoices = invoices.filter(
    (invoice) => invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.OVERDUE
  );

  const paidInvoices = invoices.filter((invoice) => invoice.status === InvoiceStatus.PAID);
  const totalSpent = paidInvoices.reduce((total, invoice) => total + invoice.total, 0);
  const recentInvoices = invoices.slice(0, 5).map((invoice) => ({
    ...invoice,
    issuedAt: invoice.issuedAt,
  }));

  return {
    outstandingInvoices,
    paidInvoices,
    totalSpent,
    recentInvoices,
  };
}

