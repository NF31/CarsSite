function computeDynamicStatus(booking: { status: BookingStatus; startDate: Date | string; endDate: Date | string }) {
  if (booking.status === BookingStatus.CANCELLED) {
    return BookingStatus.CANCELLED;
  }

  const now = new Date();
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);

  if (endDate <= now) {
    return BookingStatus.COMPLETED;
  }

  if (startDate <= now && now < endDate) {
    return BookingStatus.IN_PROGRESS;
  }

  return booking.status;
}
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatisticsCharts } from "@/components/admin/statistics/StatisticsCharts";
import { BookingStatus, VehicleCategory } from "@prisma/client";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
});

const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "short",
});

const statusLabels: Record<
  BookingStatus,
  { label: string; description: string; badgeVariant: "default" | "secondary" | "outline" }
> = {
  PENDING: { label: "En attente", description: "Réservations à confirmer", badgeVariant: "secondary" },
  CONFIRMED: { label: "Confirmées", description: "Réservations validées", badgeVariant: "default" },
  IN_PROGRESS: { label: "En cours", description: "Véhicules en utilisation", badgeVariant: "default" },
  COMPLETED: { label: "Terminées", description: "Réservations clôturées", badgeVariant: "outline" },
  CANCELLED: { label: "Annulées", description: "Réservations annulées", badgeVariant: "outline" },
};

type CategoryKey = VehicleCategory | "UNKNOWN";

const vehicleCategoryLabels: Record<CategoryKey, string> = {
  ECONOMY: "Économique",
  COMPACT: "Compacte",
  MID_SIZE: "Intermédiaire",
  FULL_SIZE: "Grande",
  SUV: "SUV",
  LUXURY: "Luxe",
  VAN: "Utilitaire",
  UNKNOWN: "Non renseigné",
};

export default async function AdminStatisticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

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

  const revenueStatuses: BookingStatus[] = ["CONFIRMED", "IN_PROGRESS", "COMPLETED"];

  const statusCountMap = new Map<BookingStatus, number>();
  (Object.keys(statusLabels) as BookingStatus[]).forEach((status) => statusCountMap.set(status, 0));

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

  const statusData = (Object.keys(statusLabels) as BookingStatus[]).map((status) => ({
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

  const weekdayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
        <p className="text-gray-600">
          Visualisez l&apos;activité des 12 derniers mois et surveillez les indicateurs clés.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenus (12 derniers mois)</CardDescription>
            <CardTitle className="text-2xl">{currencyFormatter.format(totalRevenue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {revenueLastMonth > 0 ? (
              <span>
                {currencyFormatter.format(revenueLastMonth)} sur le dernier mois (
                {revenueGrowth >= 0 ? "+" : ""}
                {revenueGrowth.toFixed(1)}%)
              </span>
            ) : (
              <span>Aucun revenu enregistré le mois dernier.</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Réservations (12 derniers mois)</CardDescription>
            <CardTitle className="text-2xl">{totalBookings.toLocaleString("fr-FR")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {bookingsLastMonth > 0 ? (
              <span>
                {bookingsLastMonth.toLocaleString("fr-FR")} le mois dernier (
                {bookingsGrowth >= 0 ? "+" : ""}
                {bookingsGrowth.toFixed(1)}%)
              </span>
            ) : (
              <span>Aucune réservation le mois dernier.</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clients actifs</CardDescription>
            <CardTitle className="text-2xl">{activeClients.toLocaleString("fr-FR")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Valeur moyenne d&apos;une réservation :{" "}
            {currencyFormatter.format(averageBookingValue || 0)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taux d&apos;occupation</CardDescription>
            <CardTitle className="text-2xl">{percentFormatter.format(occupancyRate / 100)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {occupiedVehicles.toLocaleString("fr-FR")} véhicules occupés /{" "}
            {totalVehicles.toLocaleString("fr-FR")} au total. Disponibilité :{" "}
            {percentFormatter.format(availabilityRate / 100)}
          </CardContent>
        </Card>
      </div>

      <StatisticsCharts
        monthlyData={monthlyData}
        statusData={statusData}
        totalBookings={totalBookings}
        categoryData={categoryData}
        topVehiclesData={topVehiclesData}
        weekdayData={weekdayData}
      />

      <Card>
        <CardHeader>
          <CardTitle>Suivi opérationnel</CardTitle>
          <CardDescription>Mettez en place vos actions prioritaires.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border/50 bg-muted/10 px-4 py-3">
            <p className="font-medium text-foreground">
              {pendingInvoices.toLocaleString("fr-FR")} facture
              {pendingInvoices > 1 ? "s" : ""} à régulariser
            </p>
            <p>
              Relancez les clients concernés ou marquez les factures comme payées pour assainir votre
              trésorerie.
            </p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/10 px-4 py-3">
            <p className="font-medium text-foreground">
              {maintenanceVehicles.toLocaleString("fr-FR")} véhicule
              {maintenanceVehicles > 1 ? "s" : ""} en maintenance
            </p>
            <p>Planifiez une remise en circulation pour maintenir un bon niveau de disponibilité.</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/10 px-4 py-3">
            <p className="font-medium text-foreground">
              {availableVehicles.toLocaleString("fr-FR")} véhicule
              {availableVehicles > 1 ? "s disponibles" : " disponible"}
            </p>
            <p>
              Optimisez le taux d&apos;occupation en orientant les clients vers les modèles actuellement
              libres.
            </p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/10 px-4 py-3">
            <p className="font-medium text-foreground">
              {reservedVehicles.toLocaleString("fr-FR")} réservation
              {reservedVehicles > 1 ? "s en cours" : " en cours"}
            </p>
            <p>Vérifiez les départs imminents pour anticiper les états des lieux de sortie.</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/10 px-4 py-3">
            <p className="font-medium text-foreground">
              {maintenanceCount.toLocaleString("fr-FR")} intervention maintenance
            </p>
            <p>
              Coût cumulé :{" "}
              {currencyFormatter.format(maintenanceCost || 0)} •{" "}
              {maintenanceCompleted.toLocaleString("fr-FR")} clôturées ·{" "}
              {maintenanceUpcoming.toLocaleString("fr-FR")} à venir
            </p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/10 px-4 py-3">
            <p className="font-medium text-foreground">
              {servicesCount.toLocaleString("fr-FR")} option
              {servicesCount > 1 ? "s additionnelles vendues" : " additionnelle vendue"}
            </p>
            <p>
              {topServiceLabel
                ? `Service le plus populaire : ${topServiceLabel} (${topServiceCount.toLocaleString(
                    "fr-FR",
                  )})`
                : "Aucun service supplémentaire vendu sur cette période."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

