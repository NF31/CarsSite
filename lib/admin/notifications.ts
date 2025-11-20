"use server";

import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { subHours } from "date-fns";

export type BookingNotificationType = "creation" | "modification" | "cancellation" | "payment" | "modificationPayment";

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
  // Augmenter la fenêtre à 48h pour capturer les paiements de modification récents
  const recentPaymentThreshold = subHours(new Date(), 48);

  // Récupérer les notifications déjà vues par cet admin avec leur date de vue
  const viewedNotifications = adminId
    ? await prisma.adminNotificationView.findMany({
        where: { adminId },
        select: { 
          bookingId: true,
          viewedAt: true,
        },
      })
    : [];

  const viewedBookingIds = viewedNotifications.map((v) => v.bookingId);

  console.log(`[Admin Notifications] 🔔 Récupération des notifications pour admin: ${adminId || "non connecté"}`);
  console.log(`[Admin Notifications] 📋 Notifications déjà vues: ${viewedBookingIds.length}`);

  // D'abord, récupérer toutes les réservations éligibles (sans filtre des vues)
  const allEligibleBookings = await prisma.booking.findMany({
    where: {
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
    select: {
      id: true,
      reference: true,
      status: true,
      cancellationRequested: true,
      updatedAt: true,
      originalStartDate: true, // Pour vérifier les paiements de modification
      originalEndDate: true, // Pour vérifier les paiements de modification
    },
    take: 50, // Limite pour le debug
  });

  console.log(`[Admin Notifications] 🔍 Réservations éligibles (sans filtre vues): ${allEligibleBookings.length}`);
  console.log(`[Admin Notifications] 📋 IDs éligibles:`, allEligibleBookings.map(b => ({
    id: b.id,
    reference: b.reference,
    status: b.status,
    updatedAt: b.updatedAt.toISOString(),
    updatedAtHoursAgo: Math.round((new Date().getTime() - b.updatedAt.getTime()) / (1000 * 60 * 60)),
    hasOriginalDates: !!(b.originalStartDate || b.originalEndDate),
    originalStartDate: b.originalStartDate?.toISOString() ?? "N/A",
    originalEndDate: b.originalEndDate?.toISOString() ?? "N/A",
    isWithinThreshold: b.updatedAt >= recentPaymentThreshold,
  })));
  console.log(`[Admin Notifications] ⏰ Seuil de temps (recentPaymentThreshold): ${recentPaymentThreshold.toISOString()}`);
  console.log(`[Admin Notifications] ⏰ Heures depuis le seuil: ${Math.round((new Date().getTime() - recentPaymentThreshold.getTime()) / (1000 * 60 * 60))}h`);

  const [totalPending, totalNotifications, bookings] = await Promise.all([
    prisma.booking.count({
      where: {
        OR: [
          { status: BookingStatus.PENDING },
          { cancellationRequested: true },
        ],
      },
    }),
    // Compter toutes les notifications (y compris les paiements récents)
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
    prisma.booking.findMany({
      where: {
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
        originalStartDate: true, // Pour détecter les paiements de modification
        originalEndDate: true, // Pour détecter les paiements de modification
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

  console.log(`[Admin Notifications] 📊 Total PENDING: ${totalPending}, Total Notifications: ${totalNotifications}, Réservations trouvées: ${bookings.length}`);
  console.log(`[Admin Notifications] 🔍 IDs déjà vus:`, viewedBookingIds);
  console.log(`[Admin Notifications] 🔍 IDs trouvés après filtre:`, bookings.map(b => b.id));
  console.log(`[Admin Notifications] 🔍 Détails des réservations trouvées:`, bookings.map(b => ({
    id: b.id,
    reference: b.reference,
    status: b.status,
    depositPaid: b.depositPaid,
    updatedAt: b.updatedAt.toISOString(),
    hasOriginalStartDate: !!b.originalStartDate,
    hasOriginalEndDate: !!b.originalEndDate,
    cancellationRequested: b.cancellationRequested,
  })));
  
  // Vérifier si toutes les réservations éligibles sont filtrées
  if (allEligibleBookings.length > 0 && bookings.length === 0) {
    const filteredIds = allEligibleBookings
      .filter(b => viewedBookingIds.includes(b.id))
      .map(b => b.id);
    console.log(`[Admin Notifications] ⚠️  Toutes les réservations éligibles sont filtrées (déjà vues):`, filteredIds);
  }

  const items: BookingNotificationItem[] = bookings.map((booking) => {
    let type: BookingNotificationType = "creation";
    let requiresAction = true;

    if (booking.cancellationRequested) {
      type = "cancellation";
    } else if (booking.status === BookingStatus.PENDING) {
      type = "modification";
    } else if (booking.status === BookingStatus.CONFIRMED && (booking.depositPaid ?? 0) > 0) {
      // Détecter spécifiquement les paiements de modification
      // Si originalStartDate ou originalEndDate sont présents, c'est un paiement de modification
      const isModificationPayment = !!(booking.originalStartDate || booking.originalEndDate);
      type = isModificationPayment ? "modificationPayment" : "payment";
      requiresAction = false;
      
      console.log(`[Admin Notifications] 🔍 Détection du type de notification pour ${booking.reference}:`, {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        depositPaid: booking.depositPaid,
        updatedAt: booking.updatedAt.toISOString(),
        isModificationPayment,
        hasOriginalStartDate: !!booking.originalStartDate,
        hasOriginalEndDate: !!booking.originalEndDate,
        originalStartDate: booking.originalStartDate?.toISOString() ?? "N/A",
        originalEndDate: booking.originalEndDate?.toISOString() ?? "N/A",
        type,
        requiresAction,
      });
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

  console.log(`[Admin Notifications] ✅ Notifications retournées: ${items.length} items`);
  
  // Log détaillé pour les notifications de type modificationPayment
  const modificationPaymentNotifications = items.filter(item => item.type === "modificationPayment");
  if (modificationPaymentNotifications.length > 0) {
    console.log(`[Admin Notifications] 🔔 Notifications de paiement de modification trouvées: ${modificationPaymentNotifications.length}`, {
      items: modificationPaymentNotifications.map(item => ({
        reference: item.reference,
        type: item.type,
        requiresAction: item.requiresAction,
      })),
    });
  }

  return {
    totalPending: totalNotifications, // Utiliser totalNotifications pour le badge (inclut les paiements)
    items,
  };
}


