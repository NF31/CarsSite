/**
 * Parse une valeur FormData en Date
 */
export function parseDate(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

