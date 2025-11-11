"use server";

import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export interface BookingNotificationItem {
  id: string;
  reference: string;
  startDate: string;
  endDate: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
  vehicleLabel: string;
  vehiclePlate?: string | null;
}

export interface AdminNotificationData {
  totalPending: number;
  items: BookingNotificationItem[];
}

export async function getAdminNotificationData(): Promise<AdminNotificationData> {
  const [totalPending, bookings] = await Promise.all([
    prisma.booking.count({
      where: {
        status: BookingStatus.PENDING,
      },
    }),
    prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        reference: true,
        startDate: true,
        endDate: true,
        updatedAt: true,
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
      },
    }),
  ]);

  const items: BookingNotificationItem[] = bookings.map((booking) => ({
    id: booking.id,
    reference: booking.reference,
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    userName: booking.user?.name ?? "Client inconnu",
    userEmail: booking.user?.email ?? "",
    vehicleLabel: booking.vehicle
      ? `${booking.vehicle.brand} ${booking.vehicle.model}`
      : "Véhicule non renseigné",
    vehiclePlate: booking.vehicle?.licensePlate ?? null,
  }));

  return {
    totalPending,
    items,
  };
}

