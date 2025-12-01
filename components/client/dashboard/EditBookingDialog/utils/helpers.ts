export function formatDateTimeLocal(dateValue: string): string {
  const date = new Date(dateValue);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function minDateTimeValue(offsetMinutes = 0): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() + offsetMinutes);
  return formatDateTimeLocal(date.toISOString());
}

