"use client";

import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import type {
  ClientListItem,
  ClientStats,
} from "@/actions/admin/clients";
import { ClientsGridView } from "./ClientsGridView";
import { ClientsListView } from "./ClientsListView";
import { ClientsPagination } from "./ClientsPagination";
import {
  SuccessBanner,
  ErrorBanner,
  ClientsHeader,
  ClientsStatsCards,
  ClientsFilters,
  ClientsSkeleton,
} from "./list";
import { useClientsFilters, useURLParams, useClientsData } from "./hooks";

type ViewMode = "grid" | "list";

interface ClientsPageClientProps {
  initialData?: {
    clients: ClientListItem[];
    stats: ClientStats;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export function ClientsPageClient({ initialData }: ClientsPageClientProps) {
  const defaultLimit = initialData?.pagination.limit ?? 12;
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const {
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
  } = useClientsFilters({
    initialFilters: {
      page: initialData?.pagination.page ?? 1,
      limit: defaultLimit,
      status: undefined,
      reservations: undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    defaultLimit,
  });

  const { clients, stats, pagination, isLoading, errorMessage } = useClientsData({
    initialData,
    filters,
  });

  const {
    showSuccess,
    successBanner,
    showError,
    errorBanner,
    handleCloseSuccess,
    handleCloseError,
  } = useURLParams();

  const startIndex = useMemo(
    () => (pagination.page - 1) * pagination.limit,
    [pagination.page, pagination.limit]
  );

  const showSkeleton = isLoading && clients.length === 0;

  return (
    <div className="space-y-8">
      {showSuccess && successBanner && (
        <SuccessBanner message={successBanner} onClose={handleCloseSuccess} />
      )}

      {showError && errorBanner && (
        <ErrorBanner message={errorBanner} onClose={handleCloseError} />
      )}

      <ClientsHeader
        totalClients={stats.totalClients}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onResetFilters={handleResetFilters}
      />

      <ClientsStatsCards stats={stats} />

      <ClientsFilters
        filters={filters}
        searchValue={searchValue}
        defaultLimit={defaultLimit}
        onSearchChange={setSearchValue}
        onStatusChange={handleStatusChange}
        onReservationsChange={handleReservationsChange}
        onLimitChange={handleLimitChange}
        onSortChange={handleSortChange}
        onDateChange={handleDateChange}
      >
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        {showSkeleton ? (
          <ClientsSkeleton />
        ) : viewMode === "grid" ? (
          <ClientsGridView clients={clients} startIndex={startIndex} />
        ) : (
          <ClientsListView clients={clients} startIndex={startIndex} />
        )}

        <ClientsPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          limit={pagination.limit}
          onPageChange={handlePageChange}
        />
      </ClientsFilters>
    </div>
  );
}
