import { BookingStatus } from "@/lib/types/booking-status";
import { InvoiceStatus } from "@/lib/types/invoice-status";

export const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

export const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: "En attente",
  [BookingStatus.CONFIRMED]: "Confirmée",
  [BookingStatus.IN_PROGRESS]: "En cours",
  [BookingStatus.COMPLETED]: "Terminée",
  [BookingStatus.CANCELLED]: "Annulée",
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: "bg-amber-100 text-amber-800 border border-amber-200",
  [BookingStatus.CONFIRMED]: "bg-blue-100 text-blue-800 border border-blue-200",
  [BookingStatus.IN_PROGRESS]: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  [BookingStatus.COMPLETED]: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  [BookingStatus.CANCELLED]: "bg-rose-100 text-rose-800 border border-rose-200",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: "Brouillon",
  [InvoiceStatus.SENT]: "Envoyée",
  [InvoiceStatus.PAID]: "Payée",
  [InvoiceStatus.OVERDUE]: "En retard",
  [InvoiceStatus.CANCELLED]: "Annulée",
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: "bg-slate-100 text-slate-700 border border-slate-200",
  [InvoiceStatus.SENT]: "bg-blue-100 text-blue-800 border border-blue-200",
  [InvoiceStatus.PAID]: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  [InvoiceStatus.OVERDUE]: "bg-amber-100 text-amber-800 border border-amber-200",
  [InvoiceStatus.CANCELLED]: "bg-rose-100 text-rose-800 border border-rose-200",
};


