"use server";

import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/lib/types/booking-status";
import {
  computeDynamicStatus,
  monthFormatter,
  statusLabels,
  vehicleCategoryLabels,
  weekdayLabels,
  revenueStatuses,
  type CategoryKey,
} from "@/app/(admin)/admin/statistics/utils";

export interface StatisticsData {
  monthlyData: Array<{ month: string; bookings: number; revenue: number }>;
  statusData: Array<{
    status: BookingStatus;
    label: string;
    description: string;
    count: number;
  }>;
  categoryData: Array<{
    category: CategoryKey;
    label: string;
    bookings: number;
    revenue: number;
  }>;
  topVehiclesData: Array<{
    vehicleId: string;
    label: string;
    bookings: number;
    revenue: number;
  }>;
  weekdayData: Array<{ weekday: number; label: string; count: number }>;
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  bookingsGrowth: number;
  revenueGrowth: number;
  activeClients: number;
  totalVehicles: number;
  availableVehicles: number;
  reservedVehicles: number;
  maintenanceVehicles: number;
  occupiedVehicles: number;
  occupancyRate: number;
  availabilityRate: number;
  pendingInvoices: number;
  maintenanceCount: number;
  maintenanceCost: number;
  maintenanceCompleted: number;
  maintenanceUpcoming: number;
  servicesCount: number;
  topServiceLabel: string | null;
  topServiceCount: number;
}

export async function getStatisticsData(): Promise<StatisticsData> {
  const now = new Date();
  const months: { key: string; label: string; date: Date }[] = [];

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const rawLabel = `${monthFormatter.format(date)} ${String(date.getFullYear()).slice(-2)}`;
    const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
    months.push({ key, label, date });
  }

  const firstMonthDate = months[0]?.date ?? new Date(now.getFullYear(), now.getMonth(), 1);

  const bookings = await prisma.booking.findMany({
    where: {
      startDate: {
        gte: firstMonthDate,
      },
    },
    select: {
      startDate: true,
      endDate: true,
      totalPrice: true,
      status: true,
      serviceIds: true,
      vehicle: {
        select: {
          id: true,
          brand: true,
          model: true,
          licensePlate: true,
          category: true,
        },
      },
    },
  });

  const [
    servicesCatalog,
    maintenanceSummary,
    maintenanceUpcoming,
    maintenanceCompleted,
  ] = await Promise.all([
    prisma.service.findMany({ select: { id: true, name: true } }),
    prisma.maintenance.aggregate({
      where: {
        startDate: {
          gte: firstMonthDate,
        },
      },
      _count: true,
      _sum: {
        cost: true,
      },
    }),
    prisma.maintenance.count({
      where: {
        status: {
          in: ["SCHEDULED", "IN_PROGRESS"],
        },
        startDate: {
          gte: now,
        },
      },
    }),
    prisma.maintenance.count({
      where: {
        status: "COMPLETED",
        endDate: {
          gte: firstMonthDate,
        },
      },
    }),
  ]);

  const monthlyMap = new Map(
    months.map(({ key, label }) => [
      key,
      {
        month: label,
        bookings: 0,
        revenue: 0,
      },
    ]),
  );

  const statusCountMap = new Map<BookingStatus, number>();
  const allStatuses: BookingStatus[] = [
    BookingStatus.PENDING,
    BookingStatus.CONFIRMED,
    BookingStatus.IN_PROGRESS,
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ];
  allStatuses.forEach((status) => statusCountMap.set(status, 0));

  const categoryMap = new Map<CategoryKey, { bookings: number; revenue: number }>();
  const vehicleMap = new Map<
    string,
    { vehicleId: string; label: string; bookings: number; revenue: number }
  >();
  const weekdayCounts = Array(7).fill(0);
  const serviceUsage = new Map<string, number>();
  let servicesCount = 0;

  bookings.forEach((booking) => {
    const computedStatus = computeDynamicStatus(booking);
    statusCountMap.set(computedStatus, (statusCountMap.get(computedStatus) ?? 0) + 1);

    const startDate = new Date(booking.startDate);
    const mapKey = `${startDate.getFullYear()}-${startDate.getMonth()}`;
    const entry = monthlyMap.get(mapKey);
    if (!entry) {
      return;
    }

    entry.bookings += 1;

    const bookingRevenue = revenueStatuses.includes(computedStatus) ? booking.totalPrice ?? 0 : 0;
    entry.revenue += bookingRevenue;

    const weekday = (startDate.getDay() + 6) % 7;
    weekdayCounts[weekday] += 1;

    const categoryKey: CategoryKey =
      booking.vehicle?.category !== undefined && booking.vehicle?.category !== null
        ? booking.vehicle.category
        : "UNKNOWN";
    const categoryEntry = categoryMap.get(categoryKey) ?? { bookings: 0, revenue: 0 };
    categoryEntry.bookings += 1;
    categoryEntry.revenue += bookingRevenue;
    categoryMap.set(categoryKey, categoryEntry);

    if (booking.vehicle) {
      const vehicleKey = booking.vehicle.id;
      const label = `${booking.vehicle.brand ?? "Véhicule"} ${booking.vehicle.model ?? ""}${
        booking.vehicle.licensePlate ? ` • ${booking.vehicle.licensePlate}` : ""
      }`.trim();
      const vehicleEntry =
        vehicleMap.get(vehicleKey) ?? { vehicleId: vehicleKey, label, bookings: 0, revenue: 0 };
      vehicleEntry.bookings += 1;
      vehicleEntry.revenue += bookingRevenue;
      vehicleMap.set(vehicleKey, vehicleEntry);
    }

    const bookingServices = booking.serviceIds ?? [];
    servicesCount += bookingServices.length;
    bookingServices.forEach((serviceId) => {
      serviceUsage.set(serviceId, (serviceUsage.get(serviceId) ?? 0) + 1);
    });
  });

  const monthlyData = Array.from(monthlyMap.values());
  const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0);
  const totalBookings = monthlyData.reduce((sum, month) => sum + month.bookings, 0);
  const averageBookingValue =
    totalBookings > 0 ? Math.round((totalRevenue / totalBookings) * 100) / 100 : 0;

  const bookingsLastMonth = monthlyData[monthlyData.length - 1]?.bookings ?? 0;
  const previousMonthBookings = monthlyData[monthlyData.length - 2]?.bookings ?? 0;
  const bookingsGrowth =
    previousMonthBookings > 0
      ? ((bookingsLastMonth - previousMonthBookings) / previousMonthBookings) * 100
      : 0;

  const revenueLastMonth = monthlyData[monthlyData.length - 1]?.revenue ?? 0;
  const previousMonthRevenue = monthlyData[monthlyData.length - 2]?.revenue ?? 0;
  const revenueGrowth =
    previousMonthRevenue > 0
      ? ((revenueLastMonth - previousMonthRevenue) / previousMonthRevenue) * 100
      : 0;

  const statusData = allStatuses.map((status) => ({
    status,
    label: statusLabels[status].label,
    description: statusLabels[status].description,
    count: statusCountMap.get(status) ?? 0,
  }));

  const categoryData = Array.from(categoryMap.entries())
    .filter(([, value]) => value.bookings > 0)
    .map(([category, value]) => ({
      category,
      label: vehicleCategoryLabels[category] ?? "Autre",
      bookings: value.bookings,
      revenue: value.revenue,
    }))
    .sort((a, b) => b.bookings - a.bookings);

  const topVehiclesData = Array.from(vehicleMap.values())
    .sort((a, b) => {
      if (b.revenue === a.revenue) {
        return b.bookings - a.bookings;
      }
      return b.revenue - a.revenue;
    })
    .slice(0, 5);

  const weekdayData = weekdayCounts.map((count, index) => ({
    weekday: index,
    label: weekdayLabels[index],
    count,
  }));

  const distinctClients = await prisma.booking.findMany({
    where: {
      startDate: {
        gte: firstMonthDate,
      },
    },
    distinct: ["userId"],
    select: {
      userId: true,
    },
  });
  const activeClients = distinctClients.length;

  const [totalVehicles, availableVehicles, reservedVehicles, maintenanceVehicles, pendingInvoices] =
    await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: "AVAILABLE" } }),
      prisma.vehicle.count({ where: { status: "RESERVED" } }),
      prisma.vehicle.count({ where: { status: "MAINTENANCE" } }),
      prisma.invoice.count({
        where: {
          status: {
            in: ["DRAFT", "OVERDUE"],
          },
        },
      }),
    ]);

  const occupiedVehicles = reservedVehicles + maintenanceVehicles;
  const occupancyRate = totalVehicles > 0 ? Math.round((occupiedVehicles / totalVehicles) * 100) : 0;
  const availabilityRate = totalVehicles > 0 ? Math.round((availableVehicles / totalVehicles) * 100) : 0;

  const serviceCatalogMap = new Map(servicesCatalog.map((service) => [service.id, service.name]));
  const topServiceEntry = [...serviceUsage.entries()].sort((a, b) => b[1] - a[1])[0];
  const topServiceLabel = topServiceEntry
    ? serviceCatalogMap.get(topServiceEntry[0]) ?? "Service supplémentaire"
    : null;
  const topServiceCount = topServiceEntry ? topServiceEntry[1] : 0;

  const maintenanceCount = Number(maintenanceSummary._count ?? 0);
  const maintenanceCost = maintenanceSummary._sum.cost ?? 0;

  return {
    monthlyData,
    statusData,
    categoryData,
    topVehiclesData,
    weekdayData,
    totalRevenue,
    totalBookings,
    averageBookingValue,
    bookingsGrowth,
    revenueGrowth,
    activeClients,
    totalVehicles,
    availableVehicles,
    reservedVehicles,
    maintenanceVehicles,
    occupiedVehicles,
    occupancyRate,
    availabilityRate,
    pendingInvoices,
    maintenanceCount,
    maintenanceCost,
    maintenanceCompleted,
    maintenanceUpcoming,
    servicesCount,
    topServiceLabel,
    topServiceCount,
  };
}

