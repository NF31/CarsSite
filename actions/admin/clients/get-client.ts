"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BookingStatus } from "@/lib/types/booking-status";
import { UserRole } from "@/lib/types/user-role";
import { type Prisma } from "@prisma/client";

import type { ClientStatus } from "./get-clients";

export interface ClientDetailBooking {
  id: string;
  reference: string;
  status: BookingStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  totalPrice: number;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
  } | null;
}

export interface ClientDetailStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  upcomingBookings: number;
  lastBookingDate: string | null;
  firstBookingDate: string | null;
  totalAmountSpent: number;
  averageAmountSpent: number;
}

export interface ClientDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  lockedUntil: string | null;
  status: ClientStatus;
  hasDriverLicense: boolean;
  driverLicenseUrl: string | null;
  driverLicensePublicId: string | null;
  driverLicenseFileName: string | null;
  driverLicenseUploadCount: number;
  driverLicenseLastUploadedAt: string | null;
  preferences: {
    emailNotifications: boolean;
    bookingReminders: boolean;
    promotionalEmails: boolean;
    marketingEmails: boolean;
    language: string;
  } | null;
  stats: ClientDetailStats;
  bookings: ClientDetailBooking[];
}

export interface GetClientByIdResult {
  success: boolean;
  data?: ClientDetail;
  status?: number;
  error?: string;
}

const NOW = () => new Date();

const bookingOrderBy: Prisma.BookingOrderByWithRelationInput = {
  startDate: "desc",
};

export async function getClientByIdAction(id: string): Promise<GetClientByIdResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires pour consulter ce client.",
        status: 403,
      };
    }

    const clientId = typeof id === "string" ? id.trim() : "";

    if (!clientId) {
      return {
        success: false,
        error: "Identifiant client invalide.",
        status: 400,
      };
    }

    const now = NOW();

    const client = await prisma.user.findUnique({
      where: {
        id: clientId,
        role: UserRole.CLIENT,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        lockedUntil: true,
        driverLicense: true,
        driverLicensePublicId: true,
        driverLicenseFileName: true,
        driverLicenseUploadCount: true,
        driverLicenseLastUploadedAt: true,
        preferences: {
          select: {
            emailNotifications: true,
            bookingReminders: true,
            promotionalEmails: true,
            marketingEmails: true,
            language: true,
          },
        },
        bookings: {
          orderBy: bookingOrderBy,
          take: 10,
          select: {
            id: true,
            reference: true,
            status: true,
            startDate: true,
            endDate: true,
            createdAt: true,
            updatedAt: true,
            totalPrice: true,
            vehicle: {
              select: {
                id: true,
                brand: true,
                model: true,
                licensePlate: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!client) {
      return {
        success: false,
        error: "Client introuvable.",
        status: 404,
      };
    }

    const [completedCount, cancelledCount, upcomingCount, aggregates] = await Promise.all([
      prisma.booking.count({
        where: {
          userId: clientId,
          status: BookingStatus.COMPLETED,
        },
      }),
      prisma.booking.count({
        where: {
          userId: clientId,
          status: BookingStatus.CANCELLED,
        },
      }),
      prisma.booking.count({
        where: {
          userId: clientId,
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
          },
          startDate: {
            gte: now,
          },
        },
      }),
      prisma.booking.aggregate({
        where: {
          userId: clientId,
        },
        _sum: {
          totalPrice: true,
        },
        _min: {
          startDate: true,
        },
        _max: {
          startDate: true,
        },
      }),
    ]);

    const totalBookings = client._count.bookings;
    const totalAmountSpent = aggregates._sum.totalPrice ?? 0;
    const averageAmountSpent =
      totalBookings > 0 ? Math.round((totalAmountSpent / totalBookings) * 100) / 100 : 0;

    let status: ClientStatus = "ACTIVE";
    if (client.deletedAt) {
      status = "INACTIVE";
    } else if (client.lockedUntil && client.lockedUntil > now) {
      status = "LOCKED";
    }

    const bookings: ClientDetailBooking[] = client.bookings.map((booking) => ({
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      totalPrice: booking.totalPrice,
      vehicle: booking.vehicle
        ? {
            id: booking.vehicle.id,
            brand: booking.vehicle.brand,
            model: booking.vehicle.model,
            licensePlate: booking.vehicle.licensePlate,
          }
        : null,
    }));

    const stats: ClientDetailStats = {
      totalBookings,
      completedBookings: completedCount,
      cancelledBookings: cancelledCount,
      upcomingBookings: upcomingCount,
      lastBookingDate: aggregates._max.startDate
        ? aggregates._max.startDate.toISOString()
        : null,
      firstBookingDate: aggregates._min.startDate
        ? aggregates._min.startDate.toISOString()
        : null,
      totalAmountSpent,
      averageAmountSpent,
    };

    return {
      success: true,
      data: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone ?? null,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
        deletedAt: client.deletedAt ? client.deletedAt.toISOString() : null,
        lockedUntil: client.lockedUntil ? client.lockedUntil.toISOString() : null,
        status,
        hasDriverLicense: Boolean(client.driverLicense),
        driverLicenseUrl: client.driverLicense ?? null,
        driverLicensePublicId: client.driverLicensePublicId ?? null,
        driverLicenseFileName: client.driverLicenseFileName ?? null,
        driverLicenseUploadCount: client.driverLicenseUploadCount,
        driverLicenseLastUploadedAt: client.driverLicenseLastUploadedAt
          ? client.driverLicenseLastUploadedAt.toISOString()
          : null,
        preferences: client.preferences
          ? {
              emailNotifications: client.preferences.emailNotifications,
              bookingReminders: client.preferences.bookingReminders,
              promotionalEmails: client.preferences.promotionalEmails,
              marketingEmails: client.preferences.marketingEmails,
              language: client.preferences.language,
            }
          : null,
        stats,
        bookings,
      },
    };
  } catch (error) {
    console.error("Error fetching client:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la récupération du client.",
      status: 500,
    };
  }
}



