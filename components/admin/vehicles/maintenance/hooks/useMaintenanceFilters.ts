import { useState, useEffect, useCallback } from "react";
import type { MaintenanceFiltersState } from "@/components/admin/vehicles/maintenance/MaintenanceFilters";

function getDefaultFilters(limit: number): MaintenanceFiltersState {
  return {
    status: "ACTIVE",
    type: "ALL",
    vehicleId: undefined,
    includeBlocked: false,
    search: undefined,
    startDate: undefined,
    endDate: undefined,
    sortBy: "startDate",
    sortOrder: "asc",
    page: 1,
    limit,
  };
}

interface UseMaintenanceFiltersProps {
  initialLimit: number;
}

export function useMaintenanceFilters({ initialLimit }: UseMaintenanceFiltersProps) {
  const [filters, setFilters] = useState<MaintenanceFiltersState>(() =>
    getDefaultFilters(initialLimit)
  );
  const [searchValue, setSearchValue] = useState<string>(filters.search ?? "");

  useEffect(() => {
    const handler = setTimeout(() => {
      const normalized = searchValue.trim() === "" ? undefined : searchValue.trim();
      setFilters((prev) => {
        if (prev.search === normalized && prev.page === 1) {
          return prev;
        }
        return {
          ...prev,
          search: normalized,
          page: 1,
        };
      });
    }, 400);

    return () => clearTimeout(handler);
  }, [searchValue]);

  const handleFiltersChange = useCallback((nextFilters: MaintenanceFiltersState) => {
    setFilters(nextFilters);
  }, []);

  const handleResetFilters = useCallback(() => {
    const defaultState = getDefaultFilters(filters.limit);
    setFilters(defaultState);
    setSearchValue("");
  }, [filters.limit]);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return {
    filters,
    searchValue,
    setSearchValue,
    setFilters: handleFiltersChange,
    handleResetFilters,
    handlePageChange,
  };
}

