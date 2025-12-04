import prisma from "@/lib/prisma";
import type { DashboardBooking } from "../types";

/**
 * Utilitaires pour le chargement des données du dashboard
 */

/**
 * Charge toutes les données nécessaires pour le dashboard
 */
export async function loadDashboardData(userId: string) {
  const [bookings, invoices, cancellationPolicySetting] = await Promise.all([
    prisma.booking.findMany({
      where: { userId },
      include: {
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
            city: true,
            address: true,
          },
        },
        returnLocation: {
          select: {
            name: true,
            city: true,
            address: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    }) as Promise<DashboardBooking[]>,
    prisma.invoice.findMany({
      where: { userId },
      include: {
        booking: {
          select: {
            reference: true,
            startDate: true,
          },
        },
      },
      orderBy: {
        issuedAt: "desc",
      },
    }),
    prisma.setting.findUnique({
      where: { key: "config.cancellationPolicy" },
      select: { value: true },
    }),
  ]);

  return { bookings, invoices, cancellationPolicySetting };
}

/**
 * Charge les services pour toutes les réservations
 */
export async function loadServicesForBookings(bookings: DashboardBooking[]) {
  const allServiceIds = new Set<string>();
  bookings.forEach((booking) => {
    booking.serviceIds.forEach((id) => allServiceIds.add(id));
  });

  const servicesMap = new Map<string, { id: string; name: string; price: number }>();
  if (allServiceIds.size > 0) {
    const services = await prisma.service.findMany({
      where: {
        id: {
          in: Array.from(allServiceIds),
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });
    services.forEach((service) => {
      servicesMap.set(service.id, service);
    });
  }

  return servicesMap;
}

