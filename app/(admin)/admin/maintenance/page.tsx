import {
  getMaintenanceDashboardAction,
  type GetMaintenanceDashboardResult,
} from "@/actions/admin/vehicles/get-maintenance";
import {
  getMaintenanceVehicleOptionsAction,
  type MaintenanceVehicleOption,
} from "@/actions/admin/vehicles/get-maintenance-vehicles";
import { MaintenancePageClient } from "@/app/(admin)/admin/vehicles/maintenance/MaintenancePageClient";

export const dynamic = 'force-dynamic';

interface InitialDataProps {
  data: GetMaintenanceDashboardResult["data"] | null;
  error?: string;
  vehicles: MaintenanceVehicleOption[];
  vehiclesError?: string;
}

export default async function AdminMaintenancePage() {
  const [maintenanceResult, vehiclesResult] = await Promise.all([
    getMaintenanceDashboardAction(),
    getMaintenanceVehicleOptionsAction(),
  ]);

  const initialData: InitialDataProps = {
    data: maintenanceResult.success ? maintenanceResult.data ?? null : null,
    error: maintenanceResult.success
      ? undefined
      : maintenanceResult.error ?? "Erreur lors du chargement des maintenances",
    vehicles: vehiclesResult.success ? vehiclesResult.data ?? [] : [],
    vehiclesError: vehiclesResult.success
      ? undefined
      : vehiclesResult.error ?? "Erreur lors du chargement des véhicules",
  };

  return (
    <MaintenancePageClient
      initialData={initialData.data}
      initialError={initialData.error}
      initialVehicles={initialData.vehicles}
      vehiclesError={initialData.vehiclesError}
    />
  );
}



