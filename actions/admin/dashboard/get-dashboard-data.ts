"use server";

import prisma from '@/lib/prisma'
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BookingStatus } from "@/lib/types/booking-status";

export interface DashboardData {
  bookingsToday: number;
  bookingsChange: number;
  revenueThisMonth: number;
  revenueChange: number;
  totalVehicles: number;
  availableVehicles: number;
  vehiclesPercentage: number;
  reservedVehicles: number;
  maintenanceVehicles: number;
  occupancyRate: number;
  revenueChartData: Array<{
    date: string;
    label: string;
    revenue: number;
  }>;
  revenueTotalLast30Days: number;
  revenueAveragePerDay: number;
  recentBookings: Array<{
    id: string;
    reference: string;
    status: BookingStatus;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    modificationRequested: boolean | null;
    modificationDepositDifference: number | null;
    cancellationRequested: boolean | null;
    user: {
      name: string | null;
      email: string;
    };
    vehicle: {
      brand: string;
      model: string;
      licensePlate: string;
    };
  }>;
  alerts: Array<{
    type: "reservation" | "maintenance";
    message: string;
    count: number;
  }>;
}

export async function getDashboardDataAction(): Promise<{
  success: boolean;
  data?: DashboardData;
  error?: string;
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const revenueDays = 30;
    const revenueWindowStart = new Date(today);
    revenueWindowStart.setDate(revenueWindowStart.getDate() - (revenueDays - 1));

    // Statistiques des réservations
    const bookingsToday = await prisma.booking.count({
      where: {
        startDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const bookingsLastMonth = await prisma.booking.count({
      where: {
        startDate: {
          gte: startOfLastMonth,
          lt: startOfMonth,
        },
      },
    });

    const bookingsChange =
      bookingsLastMonth > 0
        ? Math.round(
            ((bookingsToday - bookingsLastMonth / 30) / (bookingsLastMonth / 30)) * 100
          )
        : 0;

    // Revenus
    const revenueThisMonth = await prisma.booking.aggregate({
      where: {
        startDate: {
          gte: startOfMonth,
        },
        status: {
          in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"],
        },
      },
      _sum: {
        totalPrice: true,
      },
    });

    const revenueLastMonth = await prisma.booking.aggregate({
      where: {
        startDate: {
          gte: startOfLastMonth,
          lt: startOfMonth,
        },
        status: {
          in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"],
        },
      },
      _sum: {
        totalPrice: true,
      },
    });

    const revenueThisMonthValue = revenueThisMonth._sum.totalPrice || 0;
    const revenueLastMonthValue = revenueLastMonth._sum.totalPrice || 0;
    const revenueChange =
      revenueLastMonthValue > 0
        ? Math.round(
            ((revenueThisMonthValue - revenueLastMonthValue) / revenueLastMonthValue) * 100
          )
        : 0;

    // Véhicules
    const totalVehicles = await prisma.vehicle.count();
    const availableVehicles = await prisma.vehicle.count({
      where: {
        status: "AVAILABLE",
      },
    });

    const vehiclesPercentage =
      totalVehicles > 0 ? Math.round((availableVehicles / totalVehicles) * 100) : 0;

    const reservedVehicles = await prisma.vehicle.count({
      where: {
        status: "RESERVED",
      },
    });

    const maintenanceVehicles = await prisma.vehicle.count({
      where: {
        status: "MAINTENANCE",
      },
    });

    const occupancyRate =
      totalVehicles > 0 ? Math.round((reservedVehicles / totalVehicles) * 100) : 0;

    // Données pour le graphique de revenus
    const revenueWindowBookings = await prisma.booking.findMany({
      where: {
        startDate: {
          gte: revenueWindowStart,
          lt: tomorrow,
        },
        status: {
          in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"],
        },
      },
      select: {
        startDate: true,
        totalPrice: true,
      },
    });

    const revenueByDay = new Map<string, number>();
    for (const booking of revenueWindowBookings) {
      const dayKey = format(booking.startDate, "yyyy-MM-dd");
      const amount = Number(booking.totalPrice) || 0;
      revenueByDay.set(dayKey, (revenueByDay.get(dayKey) ?? 0) + amount);
    }

    const revenueChartData = Array.from({ length: revenueDays }, (_, index) => {
      const currentDate = new Date(revenueWindowStart);
      currentDate.setDate(revenueWindowStart.getDate() + index);
      const key = format(currentDate, "yyyy-MM-dd");
      return {
        date: key,
        label: format(currentDate, "dd MMM", { locale: fr }),
        revenue: revenueByDay.get(key) ?? 0,
      };
    });

    const revenueTotalLast30Days = revenueChartData.reduce(
      (sum, item) => sum + item.revenue,
      0
    );
    const revenueAveragePerDay = revenueDays > 0 ? revenueTotalLast30Days / revenueDays : 0;

    // Réservations récentes
    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        reference: true,
        status: true,
        startDate: true,
        endDate: true,
        totalPrice: true,
        modificationRequested: true,
        modificationDepositDifference: true,
        cancellationRequested: true,
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

    // Alertes
    const pendingBookings = await prisma.booking.count({
      where: {
        status: "PENDING",
      },
    });

    const maintenanceAlerts = await prisma.vehicle.count({
      where: {
        status: "MAINTENANCE",
      },
    });

    const alerts = [
      ...(pendingBookings > 0
        ? [
            {
              type: "reservation" as const,
              message: `${pendingBookings} réservation${pendingBookings > 1 ? "s" : ""} en attente de confirmation`,
              count: pendingBookings,
            },
          ]
        : []),
      ...(maintenanceAlerts > 0
        ? [
            {
              type: "maintenance" as const,
              message: `${maintenanceAlerts} véhicule${maintenanceAlerts > 1 ? "s" : ""} en maintenance`,
              count: maintenanceAlerts,
            },
          ]
        : []),
    ];

    return {
      success: true,
      data: {
        bookingsToday,
        bookingsChange,
        revenueThisMonth: revenueThisMonthValue,
        revenueChange,
        totalVehicles,
        availableVehicles,
        vehiclesPercentage,
        reservedVehicles,
        maintenanceVehicles,
        occupancyRate,
        revenueChartData,
        revenueTotalLast30Days,
        revenueAveragePerDay,
        recentBookings,
        alerts,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      success: false,
      error: "Impossible de charger les données du tableau de bord.",
    };
  }
}

