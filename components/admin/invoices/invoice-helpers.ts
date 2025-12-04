import { InvoiceStatus } from "@/lib/types/invoice-status";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: "Brouillon",
  [InvoiceStatus.SENT]: "Envoyée",
  [InvoiceStatus.PAID]: "Payée",
  [InvoiceStatus.OVERDUE]: "En retard",
  [InvoiceStatus.CANCELLED]: "Annulée",
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: "bg-slate-100 text-slate-700 border-slate-200",
  [InvoiceStatus.SENT]: "bg-blue-50 text-blue-700 border-blue-200",
  [InvoiceStatus.PAID]: "bg-emerald-50 text-emerald-700 border-emerald-200",
  [InvoiceStatus.OVERDUE]: "bg-amber-100 text-amber-800 border-amber-300",
  [InvoiceStatus.CANCELLED]: "bg-red-50 text-red-700 border-red-200",
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}


