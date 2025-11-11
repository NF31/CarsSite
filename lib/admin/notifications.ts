"use server";

import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export type BookingNotificationType = "creation" | "modification" | "cancellation";

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
  type: BookingNotificationType;
  cancellationReason?: string | null;
  cancellationRequestedAt?: string | null;
  cancellationRefundRate?: number | null;
  depositPaid?: number;
}

export interface AdminNotificationData {
  totalPending: number;
  items: BookingNotificationItem[];
}

export async function getAdminNotificationData(): Promise<AdminNotificationData> {
  const [totalPending, bookings] = await Promise.all([
    prisma.booking.count({
      where: {
        OR: [
          { status: BookingStatus.PENDING },
          { cancellationRequested: true },
        ],
      },
    }),
    prisma.booking.findMany({
      where: {
        OR: [
          { status: BookingStatus.PENDING },
          { cancellationRequested: true },
        ],
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
        status: true,
        depositPaid: true,
        cancellationRequested: true,
        cancellationReason: true,
        cancellationRequestedAt: true,
        cancellationRequestedRefundRate: true,
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

  const items: BookingNotificationItem[] = bookings.map((booking) => {
    const type: BookingNotificationType = booking.cancellationRequested
      ? "cancellation"
      : booking.status === BookingStatus.PENDING
      ? "modification"
      : "creation";

    return {
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
      type,
      cancellationReason: booking.cancellationReason,
      cancellationRequestedAt: booking.cancellationRequestedAt
        ? booking.cancellationRequestedAt.toISOString()
        : null,
      cancellationRefundRate: booking.cancellationRequestedRefundRate,
      depositPaid: booking.depositPaid ?? 0,
    };
  });

  return {
    totalPending,
    items,
  };
}


