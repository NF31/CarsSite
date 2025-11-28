"use client";

import { VehiclesFilters } from "@/components/admin/vehicles/VehiclesFilters";
import { useVehicleFromUrl, useVehiclesList } from "./hooks";
import {
  AvailabilityHeader,
  VehicleAvailabilityCard,
  LoadingState,
  EmptyState,
  VehicleAvailabilityView,
} from "./components";

interface AvailabilityPageClientProps {
  initialLocations: Array<{ id: string; name: string; city: string }>;
  initialBrands: string[];
}

export function AvailabilityPageClient({
  initialLocations,
  initialBrands,
}: AvailabilityPageClientProps) {
  const { selectedVehicle, setSelectedVehicle } = useVehicleFromUrl();
  const { vehicles, pagination, filters, handleFiltersChange, isLoading, isPending } =
    useVehiclesList({
      page: 1,
      limit: 20,
    });

  const handleVehicleSelect = (vehicle: Parameters<typeof setSelectedVehicle>[0]) => {
    setSelectedVehicle(vehicle);
  };

  const handleBackToList = () => {
    setSelectedVehicle(null);
  };

  if (selectedVehicle) {
    return (
      <VehicleAvailabilityView vehicle={selectedVehicle} onBack={handleBackToList} />
    );
  }

  return (
    <div className="space-y-6">
      <AvailabilityHeader totalVehicles={pagination.total} />

      <VehiclesFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        locations={initialLocations}
        brands={initialBrands}
      />

      {isLoading || isPending ? (
        <LoadingState />
      ) : vehicles.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {vehicles.map((vehicle) => (
              <VehicleAvailabilityCard
                key={vehicle.id}
                vehicle={vehicle}
                onSelect={handleVehicleSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

