import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { getStatisticsData } from "@/actions/admin/statistics";
import { StatisticsHeader, StatisticsCards, OperationalTracking } from "./components";

// Lazy load StatisticsCharts (contient plusieurs graphiques Recharts lourds)
const StatisticsCharts = dynamic(
  () => import("@/components/admin/statistics/StatisticsCharts").then((mod) => ({ default: mod.StatisticsCharts })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Chargement des graphiques...</p>
        </div>
      </div>
    ),
  }
);

export default async function AdminStatisticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const data = await getStatisticsData();

  const revenueLastMonth = data.monthlyData[data.monthlyData.length - 1]?.revenue ?? 0;
  const bookingsLastMonth = data.monthlyData[data.monthlyData.length - 1]?.bookings ?? 0;

  return (
    <div className="space-y-6">
      <StatisticsHeader />

      <StatisticsCards
        totalRevenue={data.totalRevenue}
        revenueLastMonth={revenueLastMonth}
        revenueGrowth={data.revenueGrowth}
        totalBookings={data.totalBookings}
        bookingsLastMonth={bookingsLastMonth}
        bookingsGrowth={data.bookingsGrowth}
        activeClients={data.activeClients}
        averageBookingValue={data.averageBookingValue}
        occupancyRate={data.occupancyRate}
        occupiedVehicles={data.occupiedVehicles}
        totalVehicles={data.totalVehicles}
        availabilityRate={data.availabilityRate}
      />

      <StatisticsCharts
        monthlyData={data.monthlyData}
        statusData={data.statusData}
        totalBookings={data.totalBookings}
        categoryData={data.categoryData}
        topVehiclesData={data.topVehiclesData}
        weekdayData={data.weekdayData}
      />

      <OperationalTracking
        pendingInvoices={data.pendingInvoices}
        maintenanceVehicles={data.maintenanceVehicles}
        availableVehicles={data.availableVehicles}
        reservedVehicles={data.reservedVehicles}
        maintenanceCount={data.maintenanceCount}
        maintenanceCost={data.maintenanceCost}
        maintenanceCompleted={data.maintenanceCompleted}
        maintenanceUpcoming={data.maintenanceUpcoming}
        servicesCount={data.servicesCount}
        topServiceLabel={data.topServiceLabel}
        topServiceCount={data.topServiceCount}
      />
    </div>
  );
}

