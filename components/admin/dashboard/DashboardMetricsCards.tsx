import { memo } from "react";
import { Calendar, DollarSign, Car, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import type { DashboardData } from "@/actions/admin/dashboard";

interface DashboardMetricsCardsProps {
  data: Pick<
    DashboardData,
    | "bookingsToday"
    | "bookingsChange"
    | "revenueThisMonth"
    | "revenueChange"
    | "totalVehicles"
    | "availableVehicles"
    | "vehiclesPercentage"
    | "reservedVehicles"
    | "maintenanceVehicles"
    | "occupancyRate"
  >;
}

export const DashboardMetricsCards = memo(function DashboardMetricsCards({
  data,
}: DashboardMetricsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Réservations Aujourd'hui */}
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
          <div className="text-3xl font-bold text-gray-900">{data.bookingsToday}</div>
          <div className="flex items-center gap-1 mt-2 text-sm">
            {data.bookingsChange >= 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">+{data.bookingsChange}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-red-600 font-medium">{data.bookingsChange}%</span>
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
          <CardTitle className="text-sm font-medium text-gray-600">Revenus Ce Mois</CardTitle>
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
            }).format(data.revenueThisMonth)}
          </div>
          <div className="flex items-center gap-1 mt-2 text-sm">
            {data.revenueChange >= 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">+{data.revenueChange}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-red-600 font-medium">{data.revenueChange}%</span>
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
            {data.availableVehicles}/{data.totalVehicles}
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">{data.vehiclesPercentage}% disponibles</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${data.vehiclesPercentage}%` }}
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

      {/* Taux d'occupation */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Taux d&apos;occupation</CardTitle>
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{data.occupancyRate}%</div>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Réservés</span>
              <span className="font-medium">{data.reservedVehicles}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Maintenance</span>
              <span className="font-medium">{data.maintenanceVehicles}</span>
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
  );
});

