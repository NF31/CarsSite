import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  DollarSign,
  Car,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DashboardRevenueChart } from "@/components/admin/dashboard/DashboardRevenueChart";
import { DashboardFleetDistributionChart } from "@/components/admin/dashboard/DashboardFleetDistributionChart";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BookingStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const STATUS_META: Record<BookingStatus, { label: string; badgeClass: string }> = {
  [BookingStatus.PENDING]: {
    label: "En attente",
    badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  [BookingStatus.CONFIRMED]: {
    label: "Confirmée",
    badgeClass: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  [BookingStatus.IN_PROGRESS]: {
    label: "En cours",
    badgeClass: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  },
  [BookingStatus.COMPLETED]: {
    label: "Terminée",
    badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  [BookingStatus.CANCELLED]: {
    label: "Annulée",
    badgeClass: "bg-rose-100 text-rose-800 border border-rose-200",
  },
};

// Utiliser la fonction centralisée depuis lib/booking-status-sync
import { deriveBookingStatus } from "@/lib/booking-status-sync";

function computeDynamicStatus(booking: { 
  status: BookingStatus; 
  startDate: Date; 
  endDate: Date;
  modificationRequested?: boolean | null;
  modificationDepositDifference?: number | null;
  cancellationRequested?: boolean | null;
}) {
  return deriveBookingStatus({
    status: booking.status,
    startDate: booking.startDate,
    endDate: booking.endDate,
    modificationRequested: booking.modificationRequested ?? false,
    modificationDepositDifference: booking.modificationDepositDifference ?? null,
    cancellationRequested: booking.cancellationRequested ?? false,
  });
}

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Rediriger les non-admins vers leur dashboard
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Récupérer les statistiques réelles depuis la base de données
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

  // Calcul de l'évolution des réservations
  const bookingsChange = bookingsLastMonth > 0 
    ? Math.round(((bookingsToday - (bookingsLastMonth / 30)) / (bookingsLastMonth / 30)) * 100)
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
  const revenueChange = revenueLastMonthValue > 0
    ? Math.round(((revenueThisMonthValue - revenueLastMonthValue) / revenueLastMonthValue) * 100)
    : 0;

  // Véhicules
  const totalVehicles = await prisma.vehicle.count();
  const availableVehicles = await prisma.vehicle.count({
    where: {
      status: "AVAILABLE",
    },
  });

  const vehiclesPercentage = totalVehicles > 0 
    ? Math.round((availableVehicles / totalVehicles) * 100)
    : 0;

  // Taux d'occupation (véhicules réservés)
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

  const occupancyRate = totalVehicles > 0
    ? Math.round((reservedVehicles / totalVehicles) * 100)
    : 0;

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

  const revenueTotalLast30Days = revenueChartData.reduce((sum, item) => sum + item.revenue, 0);
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
    ...(pendingBookings > 0 ? [{
      type: "reservation" as const,
      message: `${pendingBookings} réservation${pendingBookings > 1 ? "s" : ""} en attente de confirmation`,
      count: pendingBookings,
    }] : []),
    ...(maintenanceAlerts > 0 ? [{
      type: "maintenance" as const,
      message: `${maintenanceAlerts} véhicule${maintenanceAlerts > 1 ? "s" : ""} en maintenance`,
      count: maintenanceAlerts,
    }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-1">
            Bienvenue, {session.user.name} - Vue d&apos;ensemble de votre activité
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/bookings/new">
              <Calendar className="mr-2 h-4 w-4" />
              Nouvelle réservation
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/vehicles/add">
              <Car className="mr-2 h-4 w-4" />
              Ajouter un véhicule
            </Link>
          </Button>
        </div>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900">Alertes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-orange-800">{alert.message}</span>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                    {alert.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cartes de métriques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Réservations Aujourd&apos;hui */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Réservations Aujourd&apos;hui
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{bookingsToday}</div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              {bookingsChange >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">+{bookingsChange}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-red-600 font-medium">{bookingsChange}%</span>
                </>
              )}
              <span className="text-gray-500">vs hier</span>
            </div>
            <Button variant="ghost" className="mt-4 h-8 px-0 text-xs" asChild>
              <Link href="/admin/bookings?filter=today">
                Voir toutes <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Revenus Ce Mois */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Revenus Ce Mois
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              }).format(revenueThisMonthValue)}
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              {revenueChange >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">+{revenueChange}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-red-600 font-medium">{revenueChange}%</span>
                </>
              )}
              <span className="text-gray-500">vs mois dernier</span>
            </div>
            <Button variant="ghost" className="mt-4 h-8 px-0 text-xs" asChild>
              <Link href="/admin/statistics">
                Voir les statistiques <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Véhicules Disponibles */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Véhicules Disponibles
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Car className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {availableVehicles}/{totalVehicles}
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500">{vehiclesPercentage}% disponibles</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${vehiclesPercentage}%` }}
                />
              </div>
            </div>
            <Button variant="ghost" className="mt-4 h-8 px-0 text-xs" asChild>
              <Link href="/admin/vehicles?filter=available">
                Voir les véhicules <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Taux d&apos;occupation */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Taux d&apos;occupation
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{occupancyRate}%</div>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Réservés</span>
                <span className="font-medium">{reservedVehicles}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Maintenance</span>
                <span className="font-medium">{maintenanceVehicles}</span>
              </div>
            </div>
            <Button variant="ghost" className="mt-4 h-8 px-0 text-xs" asChild>
              <Link href="/admin/statistics">
                Voir les détails <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et Tableau */}
      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardRevenueChart
          data={revenueChartData}
          total={revenueTotalLast30Days}
          average={revenueAveragePerDay}
        />

        <DashboardFleetDistributionChart
          data={[
            { key: "available", label: "Disponible", value: availableVehicles },
            { key: "reserved", label: "Réservé", value: reservedVehicles },
            { key: "maintenance", label: "Maintenance", value: maintenanceVehicles },
          ]}
          totalVehicles={totalVehicles}
          occupancyRate={occupancyRate}
        />
      </div>

      {/* Réservations Récentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Réservations Récentes</CardTitle>
            <CardDescription>
              Dernières réservations à traiter
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/bookings">
              Voir toutes
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Référence
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Client
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Véhicule
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Dates
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Prix
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Statut
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">#{booking.id.slice(0, 8)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{booking.user.name}</div>
                          <div className="text-sm text-gray-500">{booking.user.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">
                            {booking.vehicle.brand} {booking.vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.vehicle.licensePlate}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div>
                            {new Date(booking.startDate).toLocaleDateString("fr-FR")}
                          </div>
                          <div className="text-gray-500">
                            {new Date(booking.endDate).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(Number(booking.totalPrice))}
                        </span>
                      </td>
                  <td className="py-3 px-4">
                    {(() => {
                      const status = computeDynamicStatus(booking);
                      const meta = STATUS_META[status];
                      return (
                        <Badge variant="outline" className={cn("font-medium", meta.badgeClass)}>
                          {meta.label}
                        </Badge>
                      );
                    })()}
                  </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/bookings/${booking.id}`}>
                            Voir
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune réservation récente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
