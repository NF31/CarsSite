import { useState, useCallback, useRef, useEffect, useTransition } from "react";
import { getMaintenanceDashboardAction } from "@/actions/admin/vehicles/get-maintenance";
import type {
  GetMaintenanceDashboardResult,
  MaintenanceSummary,
} from "@/actions/admin/vehicles/get-maintenance";
import type { MaintenanceFiltersState } from "@/components/admin/vehicles/maintenance/MaintenanceFilters";

interface UseMaintenanceDataProps {
  initialData: GetMaintenanceDashboardResult["data"] | null;
  initialError?: string;
}

export function useMaintenanceData({ initialData, initialError }: UseMaintenanceDataProps) {
  const [data, setData] = useState<GetMaintenanceDashboardResult["data"] | null>(
    initialData ?? null
  );
  const [summary, setSummary] = useState<MaintenanceSummary | null>(
    initialData?.summary ?? null
  );
  const [error, setError] = useState<string | undefined>(initialError);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [isPending, startTransition] = useTransition();
  const firstLoadRef = useRef<boolean>(true);

  const fetchData = useCallback(
    (filters: MaintenanceFiltersState, skipLoadingState = false) => {
      if (!skipLoadingState) {
        setIsLoading(true);
      }
      startTransition(async () => {
        try {
          const result = await getMaintenanceDashboardAction({
            status: filters.status,
            type: filters.type,
            vehicleId: filters.vehicleId,
            includeBlocked: filters.includeBlocked,
            search: filters.search,
            startDate: filters.startDate,
            endDate: filters.endDate,
            page: filters.page,
            limit: filters.limit,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
          });

          if (result.success && result.data) {
            setData(result.data);
            setSummary(result.data.summary);
            setError(undefined);
          } else {
            setData(null);
            setSummary(null);
            setError(result.error ?? "Erreur lors du chargement des maintenances");
          }
        } catch (err) {
          console.error(err);
          setData(null);
          setSummary(null);
          setError("Erreur inattendue lors du chargement");
        } finally {
          setIsLoading(false);
        }
      });
    },
    [startTransition]
  );

  // Note: fetchData will be called by the component when filters change

  return {
    data,
    summary,
    error,
    isLoading,
    isPending,
    fetchData,
  };
}

