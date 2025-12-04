import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { getDashboardDataAction } from "@/actions/admin/dashboard";
import {
  DashboardHeader,
  DashboardAlerts,
  DashboardMetricsCards,
  RecentBookingsTable,
} from "@/components/admin/dashboard";

// Lazy load les graphiques Recharts (bibliothèque lourde)
const DashboardRevenueChart = dynamic(
  () => import("@/components/admin/dashboard/DashboardRevenueChart").then((mod) => ({ default: mod.DashboardRevenueChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Chargement du graphique...</p>
        </div>
      </div>
    ),
  }
);

const DashboardFleetDistributionChart = dynamic(
  () => import("@/components/admin/dashboard/DashboardFleetDistributionChart").then((mod) => ({ default: mod.DashboardFleetDistributionChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Chargement du graphique...</p>
        </div>
      </div>
    ),
  }
);

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Rediriger les non-admins vers leur dashboard
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const result = await getDashboardDataAction();

  if (!result.success || !result.data) {
    return (
      <div className="space-y-6">
        <DashboardHeader userName={session.user.name} />
        <div className="text-center py-12 text-gray-500">
          Impossible de charger les données du tableau de bord. Veuillez réessayer plus tard.
        </div>
      </div>
    );
  }

  const { data } = result;

  return (
    <div className="space-y-6">
      <DashboardHeader userName={session.user.name} />

      <DashboardAlerts alerts={data.alerts} />

      <DashboardMetricsCards
        data={{
          bookingsToday: data.bookingsToday,
          bookingsChange: data.bookingsChange,
          revenueThisMonth: data.revenueThisMonth,
          revenueChange: data.revenueChange,
          totalVehicles: data.totalVehicles,
          availableVehicles: data.availableVehicles,
          vehiclesPercentage: data.vehiclesPercentage,
          reservedVehicles: data.reservedVehicles,
          maintenanceVehicles: data.maintenanceVehicles,
          occupancyRate: data.occupancyRate,
        }}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardRevenueChart
          data={data.revenueChartData}
          total={data.revenueTotalLast30Days}
          average={data.revenueAveragePerDay}
        />

        <DashboardFleetDistributionChart
          data={[
            { key: "available", label: "Disponible", value: data.availableVehicles },
            { key: "reserved", label: "Réservé", value: data.reservedVehicles },
            { key: "maintenance", label: "Maintenance", value: data.maintenanceVehicles },
          ]}
          totalVehicles={data.totalVehicles}
          occupancyRate={data.occupancyRate}
        />
      </div>

      <RecentBookingsTable bookings={data.recentBookings} />
    </div>
  );
}
