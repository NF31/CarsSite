"use server";

import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { subHours } from "date-fns";

export type BookingNotificationType = "creation" | "modification" | "cancellation" | "payment";

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
  requiresAction?: boolean;
}

export interface AdminNotificationData {
  totalPending: number;
  items: BookingNotificationItem[];
}

export async function getAdminNotificationData(adminId?: string): Promise<AdminNotificationData> {
  const recentPaymentThreshold = subHours(new Date(), 24);

  // Récupérer les IDs des notifications déjà vues par cet admin
  const viewedBookingIds = adminId
    ? await prisma.adminNotificationView.findMany({
        where: { adminId },
        select: { bookingId: true },
      }).then((views) => views.map((v) => v.bookingId))
    : [];

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
        AND: [
          {
            OR: [
              { status: BookingStatus.PENDING },
              { cancellationRequested: true },
              {
                AND: [
                  { status: BookingStatus.CONFIRMED },
                  { depositPaid: { gt: 0 } },
                  { updatedAt: { gte: recentPaymentThreshold } },
                ],
              },
            ],
          },
          // Exclure les notifications déjà vues par cet admin
          ...(viewedBookingIds.length > 0 ? [{ id: { notIn: viewedBookingIds } }] : []),
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
    let type: BookingNotificationType = "creation";
    let requiresAction = true;

    if (booking.cancellationRequested) {
      type = "cancellation";
    } else if (booking.status === BookingStatus.PENDING) {
      type = "modification";
    } else if (booking.status === BookingStatus.CONFIRMED && (booking.depositPaid ?? 0) > 0) {
      type = "payment";
      requiresAction = false;
    }

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
      requiresAction,
    };
  });

  return {
    totalPending,
    items,
  };
}


