import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export async function getViewedNotifications(adminId?: string) {
  if (!adminId) return [];
  
  return await prisma.adminNotificationView.findMany({
    where: { adminId },
    select: { 
      bookingId: true,
      viewedAt: true,
    },
  });
}

export function getViewedBookingIds(viewedNotifications: Array<{ bookingId: string }>): string[] {
  return viewedNotifications.map((v) => v.bookingId);
}

export function buildNotificationWhereClause(
  recentPaymentThreshold: Date,
  viewedBookingIds: string[]
) {
  return {
    OR: [
      // Toujours afficher les PENDING et cancellationRequested (même si vues)
      // car elles nécessitent une action de l'admin
      { status: BookingStatus.PENDING },
      { cancellationRequested: true },
      // Paiements récents (CONFIRMED avec depositPaid > 0) - Pas encore vus
      {
        AND: [
          { status: BookingStatus.CONFIRMED },
          { depositPaid: { gt: 0 } },
          { updatedAt: { gte: recentPaymentThreshold } },
          ...(viewedBookingIds.length > 0 ? [{ id: { notIn: viewedBookingIds } }] : []),
        ],
      },
      // Paiements de modification récents (CONFIRMED avec originalStartDate/originalEndDate)
      // TOUJOURS afficher même si vue avant (nouveau paiement)
      {
        AND: [
          { status: BookingStatus.CONFIRMED },
          { depositPaid: { gt: 0 } },
          { updatedAt: { gte: recentPaymentThreshold } },
          {
            OR: [
              { originalStartDate: { not: null } },
              { originalEndDate: { not: null } },
            ],
          },
        ],
      },
    ],
  };
}

export async function getBookingCounts(
  recentPaymentThreshold: Date,
  viewedBookingIds: string[]
) {
  return await Promise.all([
    // Total PENDING et cancellationRequested
    prisma.booking.count({
      where: {
        OR: [
          { status: BookingStatus.PENDING },
          { cancellationRequested: true },
        ],
      },
    }),
    // Total notifications (y compris les paiements récents)
    prisma.booking.count({
      where: {
        OR: [
          { status: BookingStatus.PENDING },
          { cancellationRequested: true },
          {
            AND: [
              { status: BookingStatus.CONFIRMED },
              { depositPaid: { gt: 0 } },
              { updatedAt: { gte: recentPaymentThreshold } },
              ...(viewedBookingIds.length > 0 ? [{ id: { notIn: viewedBookingIds } }] : []),
            ],
          },
        ],
      },
    }),
  ]);
}

export async function getNotificationBookings(
  recentPaymentThreshold: Date,
  viewedBookingIds: string[]
) {
  return await prisma.booking.findMany({
    where: buildNotificationWhereClause(recentPaymentThreshold, viewedBookingIds),
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
      originalStartDate: true,
      originalEndDate: true,
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
  });
}

