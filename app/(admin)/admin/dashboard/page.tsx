import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardDataAction } from "@/actions/admin/dashboard";
import {
  DashboardHeader,
  DashboardAlerts,
  DashboardMetricsCards,
  RecentBookingsTable,
} from "@/components/admin/dashboard";
import { DashboardRevenueChart } from "@/components/admin/dashboard/DashboardRevenueChart";
import { DashboardFleetDistributionChart } from "@/components/admin/dashboard/DashboardFleetDistributionChart";

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
