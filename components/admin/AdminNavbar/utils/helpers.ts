const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return dateTimeFormatter.format(date);
}

export function formatCurrency(value?: number | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  return currencyFormatter.format(value);
}

export function truncateReference(reference: string): string {
  if (reference.length <= 12) {
    return reference;
  }
  return `${reference.slice(0, 8)}…${reference.slice(-2)}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

