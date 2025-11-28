import { useState, useEffect, useCallback } from "react";
import type { GetClientsFilters } from "@/actions/admin/clients";

interface UseClientsFiltersProps {
  initialFilters?: GetClientsFilters;
  defaultLimit?: number;
}

export function useClientsFilters({
  initialFilters,
  defaultLimit = 12,
}: UseClientsFiltersProps) {
  const [filters, setFilters] = useState<GetClientsFilters>({
    page: initialFilters?.page ?? 1,
    limit: initialFilters?.limit ?? defaultLimit,
    status: initialFilters?.status,
    reservations: initialFilters?.reservations,
    sortBy: initialFilters?.sortBy ?? "createdAt",
    sortOrder: initialFilters?.sortOrder ?? "desc",
    search: initialFilters?.search,
    registrationFrom: initialFilters?.registrationFrom,
    registrationTo: initialFilters?.registrationTo,
  });
  const [searchValue, setSearchValue] = useState(filters.search ?? "");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchValue.trim();
      const nextSearch = trimmed.length > 0 ? trimmed : undefined;

      setFilters((prev) => {
        if (prev.search === nextSearch) {
          return prev;
        }
        return {
          ...prev,
          search: nextSearch,
          page: 1,
        };
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchValue]);

  const handleStatusChange = useCallback(
    (value: NonNullable<GetClientsFilters["status"]> | "all") => {
      setFilters((prev) => ({
        ...prev,
        status: value === "all" ? undefined : value,
        page: 1,
      }));
    },
    []
  );

  const handleReservationsChange = useCallback(
    (value: NonNullable<GetClientsFilters["reservations"]> | "all") => {
      setFilters((prev) => ({
        ...prev,
        reservations: value === "all" ? undefined : value,
        page: 1,
      }));
    },
    []
  );

  const handleLimitChange = useCallback((value: string) => {
    const numeric = Number(value);
    setFilters((prev) => ({
      ...prev,
      limit: Number.isNaN(numeric) ? prev.limit : numeric,
      page: 1,
    }));
  }, []);

  const handleDateChange = useCallback(
    (key: "registrationFrom" | "registrationTo", value: string) => {
      const parsed = value ? new Date(value) : null;
      setFilters((prev) => ({
        ...prev,
        [key]: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : undefined,
        page: 1,
      }));
    },
    []
  );

  const handleSortChange = useCallback((value: string) => {
    const [sortBy, sortOrder] = value.split(":");
    setFilters((prev) => ({
      ...prev,
      sortBy: (sortBy as GetClientsFilters["sortBy"]) ?? "createdAt",
      sortOrder: (sortOrder as GetClientsFilters["sortOrder"]) ?? "desc",
      page: 1,
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchValue("");
    setFilters((prev) => ({
      ...prev,
      search: undefined,
      status: undefined,
      reservations: undefined,
      registrationFrom: undefined,
      registrationTo: undefined,
      limit: defaultLimit,
      page: 1,
    }));
  }, [defaultLimit]);

  return {
    filters,
    searchValue,
    setSearchValue,
    handleStatusChange,
    handleReservationsChange,
    handleLimitChange,
    handleDateChange,
    handleSortChange,
    handlePageChange,
    handleResetFilters,
  };
}

