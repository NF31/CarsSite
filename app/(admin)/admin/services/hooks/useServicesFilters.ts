import { useState, useMemo, useCallback } from "react";
import type { ServiceRecord } from "@/actions/admin/services";
import type { ServicePricingType } from "@/lib/types/service-pricing-type";
import type { VehicleCategory } from "@prisma/client";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type PricingFilter = "ALL" | ServicePricingType;
type CategoryFilter = "ALL" | VehicleCategory;

interface UseServicesFiltersProps {
  services: ServiceRecord[];
}

export function useServicesFilters({ services }: UseServicesFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [pricingFilter, setPricingFilter] = useState<PricingFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [showInactive, setShowInactive] = useState(true);

  const filteredServices = useMemo(() => {
    return services
      .filter((service) => {
        const matchesSearch =
          searchTerm.trim().length === 0 ||
          service.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
          (service.description ?? "").toLowerCase().includes(searchTerm.trim().toLowerCase());

        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" && service.active) ||
          (statusFilter === "INACTIVE" && !service.active);

        const matchesPricing =
          pricingFilter === "ALL" || service.pricingType === pricingFilter;

        const matchesCategory =
          categoryFilter === "ALL" ||
          (service.availableForCategories ?? []).includes(categoryFilter);

        const matchesInactiveToggle = showInactive || service.active;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPricing &&
          matchesCategory &&
          matchesInactiveToggle
        );
      })
      .sort((a, b) => {
        if (a.active !== b.active) {
          return a.active ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  }, [services, searchTerm, statusFilter, pricingFilter, categoryFilter, showInactive]);

  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setPricingFilter("ALL");
    setCategoryFilter("ALL");
    setShowInactive(true);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    pricingFilter,
    setPricingFilter,
    categoryFilter,
    setCategoryFilter,
    showInactive,
    setShowInactive,
    filteredServices,
    handleResetFilters,
  };
}

