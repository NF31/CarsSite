export function combineDateTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(
    !isNaN(hours) ? hours : 0,
    !isNaN(minutes) ? minutes : 0,
    0,
    0
  );
  return combined;
}

