"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  GetMaintenanceDashboardResult,
  MaintenanceRecord,
} from "@/actions/admin/vehicles/get-maintenance";
import type { MaintenanceVehicleOption } from "@/actions/admin/vehicles/get-maintenance-vehicles";
import { MaintenanceFilters } from "@/components/admin/vehicles/maintenance/MaintenanceFilters";
import { MaintenanceSummaryCards } from "@/components/admin/vehicles/maintenance/MaintenanceSummaryCards";
import {
  MaintenanceTable,
  MaintenanceCancelDialog,
} from "@/components/admin/vehicles/maintenance/MaintenanceTable";
import { ScheduleMaintenanceDialog } from "@/components/admin/vehicles/maintenance/ScheduleMaintenanceDialog";
import { VehiclesPagination } from "@/components/admin/vehicles/VehiclesPagination";
import { Card } from "@/components/ui/card";
import { MaintenanceStatus } from "@/lib/types/maintenance-status";
import {
  MaintenanceHeader,
  FeedbackBanner,
  ErrorBanner,
  MaintenanceDetailsDialog,
} from "@/components/admin/vehicles/maintenance";
import {
  useMaintenanceData,
  useMaintenanceFilters,
  useMaintenanceActions,
} from "@/components/admin/vehicles/maintenance/hooks";

interface MaintenancePageClientProps {
  initialData: GetMaintenanceDashboardResult["data"] | null;
  initialError?: string;
  initialVehicles: MaintenanceVehicleOption[];
  vehiclesError?: string;
}

export function MaintenancePageClient({
  initialData,
  initialError,
  initialVehicles,
  vehiclesError: initialVehiclesError,
}: MaintenancePageClientProps) {
  const initialLimit = initialData?.pagination.limit ?? 10;
  const firstLoadRef = useRef<boolean>(true);

  const { filters, searchValue, setSearchValue, setFilters: handleFiltersChange, handleResetFilters, handlePageChange } =
    useMaintenanceFilters({ initialLimit });

  const { data, summary, error, isLoading, isPending, fetchData } = useMaintenanceData({
    initialData,
    initialError,
  });

  const {
    feedback,
    actionLoadingId,
    isPending: actionPending,
    vehicles,
    vehiclesError,
    refreshVehicles,
    handleStatusChange: handleStatusChangeAction,
    clearFeedback,
    setVehicles,
    setVehiclesError,
  } = useMaintenanceActions({
    onStatusChangeSuccess: () => fetchData(filters),
  });

  // Initialize vehicles
  useEffect(() => {
    setVehicles(initialVehicles);
    setVehiclesError(initialVehiclesError);
  }, [initialVehicles, initialVehiclesError, setVehicles, setVehiclesError]);

  // First load
  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      if (!initialData) {
        fetchData(filters, true);
      }
      return;
    }
    fetchData(filters);
  }, [filters, fetchData, initialData]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceRecord | null>(null);
  const [cancelDialogMaintenance, setCancelDialogMaintenance] = useState<MaintenanceRecord | null>(null);

  const handleCreate = useCallback(() => {
    setDialogMode("create");
    setEditingMaintenance(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((maintenance: MaintenanceRecord) => {
    setDialogMode("edit");
    setEditingMaintenance(maintenance);
    setDialogOpen(true);
  }, []);

  const handleDialogSuccess = useCallback(
    async () => {
      clearFeedback();
      await refreshVehicles();
      handleFiltersChange({
        ...filters,
        page: 1,
      });
    },
    [clearFeedback, refreshVehicles, handleFiltersChange, filters]
  );

  const handleStatusChange = useCallback(
    (maintenance: MaintenanceRecord, status: MaintenanceStatus) => {
      if (status === MaintenanceStatus.CANCELLED) {
        setCancelDialogMaintenance(maintenance);
      } else {
        handleStatusChangeAction(maintenance, status);
      }
    },
    [handleStatusChangeAction]
  );

  const handleViewDetails = useCallback((maintenance: MaintenanceRecord) => {
    setSelectedMaintenance(maintenance);
    setDetailsOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    refreshVehicles();
    fetchData(filters);
  }, [refreshVehicles, fetchData, filters]);

  const pagination = data?.pagination ?? {
    total: 0,
    page: filters.page,
    limit: filters.limit,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  const maintenances = data?.maintenances ?? [];
  const summaryData = summary ?? data?.summary ?? null;

  return (
    <div className="space-y-6 w-full">
      <MaintenanceHeader
        vehiclesError={vehiclesError}
        isPending={isPending || actionPending}
        hasVehicles={vehicles.length > 0}
        onRefresh={handleRefresh}
        onCreate={handleCreate}
      />

      {vehicles.length === 0 && (
        <Card className="p-4 border border-amber-200 bg-amber-50 text-amber-800">
          <p className="text-sm">
            Aucun véhicule disponible pour la maintenance. Ajoutez des véhicules ou vérifiez vos filtres.
          </p>
        </Card>
      )}

      <MaintenanceSummaryCards summary={summaryData} isLoading={isLoading && maintenances.length === 0} />

      <MaintenanceFilters
        filters={filters}
        searchValue={searchValue}
        onFiltersChange={handleFiltersChange}
        onSearchChange={setSearchValue}
        onReset={handleResetFilters}
        vehicles={vehicles}
        isLoading={isLoading || isPending}
      />

      {feedback && (
        <FeedbackBanner type={feedback.type} message={feedback.message} onClose={clearFeedback} />
      )}

      {error && <ErrorBanner message={error} />}

      <MaintenanceTable
        maintenances={maintenances}
        onEdit={handleEdit}
        onStatusChange={handleStatusChange}
        onViewDetails={handleViewDetails}
        onRequestCancel={(maintenance) => setCancelDialogMaintenance(maintenance)}
        isLoading={isLoading && maintenances.length === 0}
        actionLoadingId={actionLoadingId}
      />

      {maintenances.length > 0 && (
        <VehiclesPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          onPageChange={handlePageChange}
          startIndex={(pagination.page - 1) * pagination.limit}
          itemsPerPage={pagination.limit}
          totalItems={pagination.total}
        />
      )}

      <ScheduleMaintenanceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        vehicles={vehicles}
        maintenance={editingMaintenance}
        onSuccess={handleDialogSuccess}
      />

      <MaintenanceCancelDialog
        maintenance={cancelDialogMaintenance}
        onDismiss={() => setCancelDialogMaintenance(null)}
        onConfirm={() => {
          if (cancelDialogMaintenance) {
            handleStatusChangeAction(cancelDialogMaintenance, MaintenanceStatus.CANCELLED);
          }
          setCancelDialogMaintenance(null);
        }}
      />

      <MaintenanceDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        maintenance={selectedMaintenance}
      />
    </div>
  );
}
