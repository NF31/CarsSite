import { auth } from "@/auth";
import prisma from '@/lib/prisma'
import { z } from "zod";
import type { BookingModerationPayload } from "../types";

/**
 * Utilitaires de validation pour la modération des réservations
 */

export const moderateSchema = z.object({
  bookingId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().max(500).optional(),
});

export async function validateAuth(): Promise<
  { valid: boolean; error?: string }
> {
  const session = await auth();

  if (!session?.user) {
    return { valid: false, error: "Authentification requise." };
  }

  if (session.user.role !== "ADMIN") {
    return { valid: false, error: "Permissions insuffisantes." };
  }

  return { valid: true };
}

export async function validateBooking(
  bookingId: string
): Promise<{ valid: boolean; booking?: BookingModerationPayload; error?: string }> {
  const booking = (await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      vehicle: {
        select: {
          brand: true,
          model: true,
          licensePlate: true,
        },
      },
      pickupLocation: {
        select: {
          name: true,
        },
      },
      returnLocation: {
        select: {
          name: true,
        },
      },
    },
  })) as BookingModerationPayload | null;

  if (!booking) {
    return { valid: false, error: "Réservation introuvable." };
  }

  return { valid: true, booking };
}

