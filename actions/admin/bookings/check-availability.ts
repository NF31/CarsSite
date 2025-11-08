 "use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BookingStatus, MaintenanceStatus, MaintenanceType } from "@prisma/client";
import { z } from "zod";

const checkAvailabilitySchema = z.object({
  vehicleId: z.string().min(1),
  startDate: z
    .string()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date invalide")
    .transform((value) => new Date(value)),
  endDate: z
    .string()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date invalide")
    .transform((value) => new Date(value)),
  bookingId: z
    .string()
    .min(1)
    .optional(),
});

export type VehicleAvailabilityResponse =
  | {
      success: true;
      status: "available";
    }
  | {
      success: true;
      status: "booking_conflict";
      conflict: {
        reference: string;
        startDate: string;
        endDate: string;
      };
    }
  | {
      success: true;
      status: "maintenance_conflict";
      maintenance: {
        id: string;
        type: MaintenanceType;
        status: MaintenanceStatus;
        startDate: string;
        endDate: string;
      };
    }
  | {
      success: false;
      error: string;
    };

export async function checkVehicleAvailabilityAction(
  rawInput: z.input<typeof checkAvailabilitySchema>
): Promise<VehicleAvailabilityResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Permissions insuffisantes.",
      };
    }

    const parsed = checkAvailabilitySchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: "Données invalides fournies.",
      };
    }

    const { vehicleId, startDate, endDate, bookingId } = parsed.data;

    if (endDate <= startDate) {
      return {
        success: false,
        error: "La date de fin doit être postérieure à la date de début.",
      };
    }

    const now = new Date();
    if (startDate < now || endDate < now) {
      return {
        success: false,
        error: "Les dates passées ne peuvent pas être sélectionnées.",
      };
    }

    const bookingConflict = await prisma.booking.findFirst({
      where: {
        vehicleId,
        ...(bookingId
          ? {
              id: {
                not: bookingId,
              },
            }
          : {}),
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
        },
        startDate: {
          lt: endDate,
        },
        endDate: {
          gt: startDate,
        },
      },
      select: {
        reference: true,
        startDate: true,
        endDate: true,
      },
    });

    if (bookingConflict) {
      return {
        success: true,
        status: "booking_conflict",
        conflict: {
          reference: bookingConflict.reference,
          startDate: bookingConflict.startDate.toISOString(),
          endDate: bookingConflict.endDate.toISOString(),
        },
      };
    }

    const maintenanceConflict = await prisma.maintenance.findFirst({
      where: {
        vehicleId,
        status: {
          in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
        },
        startDate: {
          lt: endDate,
        },
        endDate: {
          gt: startDate,
        },
      },
      select: {
        id: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    });

    if (maintenanceConflict) {
      return {
        success: true,
        status: "maintenance_conflict",
        maintenance: {
          id: maintenanceConflict.id,
          type: maintenanceConflict.type,
          status: maintenanceConflict.status,
          startDate: maintenanceConflict.startDate.toISOString(),
          endDate: maintenanceConflict.endDate.toISOString(),
        },
      };
    }

    return {
      success: true,
      status: "available",
    };
  } catch (error) {
    console.error("Check availability error:", error);
    return {
      success: false,
      error: "Impossible de vérifier la disponibilité du véhicule.",
    };
  }
}



