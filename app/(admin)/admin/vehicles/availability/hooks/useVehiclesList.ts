import { useState, useEffect, useTransition } from "react";
import { getVehiclesAction, type GetVehiclesFilters } from "@/actions/admin/vehicles";
import type { Vehicle } from "./useVehicleFromUrl";

export function useVehiclesList(initialFilters: GetVehiclesFilters) {
  const [filters, setFilters] = useState<GetVehiclesFilters>(initialFilters);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const result = await getVehiclesAction(filters);
        if (result.success && result.data) {
          setVehicles(result.data.vehicles);
          setPagination(result.data.pagination);
        }
      } catch (error) {
        console.error("Error loading vehicles:", error);
      } finally {
        setIsLoading(false);
      }
    });
  }, [filters]);

  const handleFiltersChange = (newFilters: GetVehiclesFilters) => {
    setFilters({ ...newFilters, page: 1 });
  };

  return {
    vehicles,
    pagination,
    filters,
    handleFiltersChange,
    isLoading,
    isPending,
  };
}

