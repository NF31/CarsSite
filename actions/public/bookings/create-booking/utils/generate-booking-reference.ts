import prisma from '@/lib/prisma'
import { startOfYear, endOfYear } from "date-fns";
import { REFERENCE_GENERATION_ATTEMPTS } from "../constants";

export async function generateBookingReference(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  let attempts = 0;

  while (attempts < REFERENCE_GENERATION_ATTEMPTS) {
    const start = startOfYear(now);
    const end = endOfYear(now);
    const count = await prisma.booking.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    });

    const reference = `BK-${year}-${String(count + attempts + 1).padStart(4, "0")}`;
    const existing = await prisma.booking.findUnique({
      where: { reference },
      select: { id: true },
    });

    if (!existing) {
      return reference;
    }

    attempts += 1;
  }

  throw new Error("Impossible de générer une référence unique pour la réservation.");
}

