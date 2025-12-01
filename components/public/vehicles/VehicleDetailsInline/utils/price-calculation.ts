import type { Vehicle, PriceCalculation } from "../types";

export function calculatePrice(
  vehicle: Vehicle,
  startDate?: string,
  endDate?: string,
  startTime?: string,
  endTime?: string
): PriceCalculation {
  if (!startDate || !endDate) {
    return { totalAmount: null, numberOfDays: null };
  }

  const startTimeStr = startTime || "10:00";
  const endTimeStr = endTime || "10:00";

  const [startHours, startMinutes] = startTimeStr.split(":").map(Number);
  const [endHours, endMinutes] = endTimeStr.split(":").map(Number);

  const start = new Date(
    `${startDate}T${String(startHours || 10).padStart(2, "0")}:${String(startMinutes || 0).padStart(2, "0")}:00`
  );
  const end = new Date(
    `${endDate}T${String(endHours || 10).padStart(2, "0")}:${String(endMinutes || 0).padStart(2, "0")}:00`
  );

  const diffMs = end.getTime() - start.getTime();
  const msPerDay = 1000 * 60 * 60 * 24;
  const exactDays = diffMs / msPerDay;
  const numberOfDays = Math.max(exactDays, 1);
  const totalAmount = numberOfDays * vehicle.pricePerDay;

  return { totalAmount, numberOfDays };
}

