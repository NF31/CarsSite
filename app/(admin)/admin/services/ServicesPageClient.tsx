"use client";

import { useState } from "react";
import type { ServiceRecord, ServicesSummary } from "@/actions/admin/services";
import { VehiclesPagination } from "@/components/admin/vehicles/VehiclesPagination";
import { ServicesGridView } from "@/components/admin/services/ServicesGridView";
import { ServicesListView } from "@/components/admin/services/ServicesListView";
import { useServicesFilters } from "./hooks/useServicesFilters";
import { useServicesPagination } from "./hooks/useServicesPagination";
import { useURLParams } from "./hooks/useURLParams";
import {
  ServicesHeader,
  SuccessBanner,
  ErrorBanner,
  ServicesStatsCards,
  ServicesFilters,
  ViewModeControls,
  EmptyState,
} from "./components";

type ViewMode = "grid" | "list";

interface ServicesPageClientProps {
  services: ServiceRecord[];
  summary: ServicesSummary;
}

export function ServicesPageClient({ services, summary }: ServicesPageClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const {
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
  } = useServicesFilters({ services });

  const {
    page,
    totalPages,
    totalItems,
    startIndex,
    itemsPerPage,
    paginatedServices,
    hasNext,
    hasPrev,
    onPageChange,
    resetPage,
  } = useServicesPagination({
    filteredServices,
    itemsPerPage: 8,
  });

  const {
    showSuccess,
    successBanner,
    showError,
    errorBanner,
    handleCloseSuccess,
    handleCloseError,
  } = useURLParams();

  const handleFilterChange = () => {
    resetPage();
  };

  const handleResetAll = () => {
    handleResetFilters();
    resetPage();
  };

  return (
    <div className="space-y-8">
      {showSuccess && successBanner && (
        <SuccessBanner message={successBanner} onClose={handleCloseSuccess} />
      )}

      {showError && errorBanner && (
        <ErrorBanner message={errorBanner} onClose={handleCloseError} />
      )}

      <ServicesHeader onResetFilters={handleResetAll} />

      <ViewModeControls viewMode={viewMode} onViewModeChange={setViewMode} />

      <ServicesStatsCards summary={summary} />

      <ServicesFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        pricingFilter={pricingFilter}
        onPricingChange={setPricingFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        showInactive={showInactive}
        onShowInactiveChange={setShowInactive}
        onFilterChange={handleFilterChange}
      />

      {filteredServices.length === 0 ? (
        <EmptyState />
      ) : viewMode === "grid" ? (
        <ServicesGridView services={paginatedServices} />
      ) : (
        <ServicesListView services={paginatedServices} startIndex={startIndex} />
      )}

      {filteredServices.length > 0 && (
        <VehiclesPagination
          currentPage={page}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          onPageChange={onPageChange}
          startIndex={startIndex}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
        />
      )}
    </div>
  );
}
