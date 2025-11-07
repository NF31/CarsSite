"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type {
  GetMaintenanceDashboardResult,
  MaintenanceRecord,
  MaintenanceSummary,
  MaintenanceStatusFilter,
} from "@/actions/admin/vehicles/get-maintenance";
import {
  getMaintenanceDashboardAction,
} from "@/actions/admin/vehicles/get-maintenance";
import { updateMaintenanceAction } from "@/actions/admin/vehicles/update-maintenance";
import type { MaintenanceVehicleOption } from "@/actions/admin/vehicles/get-maintenance-vehicles";
import { getMaintenanceVehicleOptionsAction } from "@/actions/admin/vehicles/get-maintenance-vehicles";
import { MaintenanceFilters, type MaintenanceFiltersState } from "@/components/admin/vehicles/maintenance/MaintenanceFilters";
import { MaintenanceSummaryCards } from "@/components/admin/vehicles/maintenance/MaintenanceSummaryCards";
import { MaintenanceTable } from "@/components/admin/vehicles/maintenance/MaintenanceTable";
import { ScheduleMaintenanceDialog } from "@/components/admin/vehicles/maintenance/ScheduleMaintenanceDialog";
import { VehiclesPagination } from "@/components/admin/vehicles/VehiclesPagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CalendarDays, CheckCircle2, Plus, RefreshCcw } from "lucide-react";
import { MaintenanceStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
const statusLabels: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.SCHEDULED]: "Planifiée",
  [MaintenanceStatus.IN_PROGRESS]: "En cours",
  [MaintenanceStatus.COMPLETED]: "Terminée",
  [MaintenanceStatus.CANCELLED]: "Annulée",
};

interface MaintenancePageClientProps {
  initialData: GetMaintenanceDashboardResult["data"] | null;
  initialError?: string;
  initialVehicles: MaintenanceVehicleOption[];
  vehiclesError?: string;
}

type FeedbackState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

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

export function MaintenancePageClient({
  initialData,
  initialError,
  initialVehicles,
  vehiclesError: initialVehiclesError,
}: MaintenancePageClientProps) {
  const hasInitialResults =
    Boolean(initialData?.maintenances?.length) &&
    Boolean((initialData?.pagination?.total ?? 0) > (initialData?.pagination?.limit ?? 10));
  const initialLimit = initialData?.pagination.limit ?? 10;
  const [filters, setFilters] = useState<MaintenanceFiltersState>(() =>
    getDefaultFilters(initialLimit)
  );
  const [searchValue, setSearchValue] = useState<string>(filters.search ?? "");
  const [data, setData] = useState<GetMaintenanceDashboardResult["data"] | null>(
    initialData ?? null
  );
  const [summary, setSummary] = useState<MaintenanceSummary | null>(
    initialData?.summary ?? null
  );
  const [error, setError] = useState<string | undefined>(initialError);
  const [vehicles, setVehicles] = useState<MaintenanceVehicleOption[]>(initialVehicles);
  const [vehiclesError, setVehiclesError] = useState<string | undefined>(
    initialVehiclesError
  );
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceRecord | null>(null);
  const firstLoadRef = useRef<boolean>(true);

  const fetchData = useCallback(
    (state: MaintenanceFiltersState, skipLoadingState = false) => {
      if (!skipLoadingState) {
        setIsLoading(true);
      }
      startTransition(async () => {
        try {
          const result = await getMaintenanceDashboardAction({
            status: state.status,
            type: state.type,
            vehicleId: state.vehicleId,
            includeBlocked: state.includeBlocked,
            search: state.search,
            startDate: state.startDate,
            endDate: state.endDate,
            page: state.page,
            limit: state.limit,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
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

  const refreshVehicles = useCallback(async () => {
    try {
      const result = await getMaintenanceVehicleOptionsAction();
      if (result.success && result.data) {
        setVehicles(result.data);
        setVehiclesError(undefined);
      } else {
        setVehiclesError(result.error ?? "Erreur lors du chargement des véhicules");
      }
    } catch (err) {
      console.error(err);
      setVehiclesError("Erreur inattendue lors du chargement des véhicules");
    }
  }, []);

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

  const handleFiltersChange = useCallback(
    (nextFilters: MaintenanceFiltersState) => {
      setFilters(nextFilters);
    },
    []
  );

  const handleResetFilters = useCallback(() => {
    const defaultState = getDefaultFilters(filters.limit);
    setFilters(defaultState);
    setSearchValue("");
  }, [filters.limit]);

  const handlePageChange = useCallback(
    (page: number) => {
      setFilters((prev) => ({
        ...prev,
        page,
      }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    []
  );

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
    async (maintenance: MaintenanceRecord) => {
      setFeedback({
        type: "success",
        message:
          dialogMode === "create"
            ? "Maintenance planifiée avec succès."
            : "Maintenance mise à jour avec succès.",
      });
      await refreshVehicles();
      setFilters((prev) => ({
        ...prev,
        page: 1,
      }));
    },
    [dialogMode, refreshVehicles]
  );

  const handleStatusChange = useCallback(
    (maintenance: MaintenanceRecord, status: MaintenanceStatus) => {
      setActionLoadingId(maintenance.id);
      startTransition(async () => {
        try {
          const result = await updateMaintenanceAction({
            id: maintenance.id,
            status,
          });

          if (result.success && result.data) {
            setFeedback({
              type: "success",
              message: `Maintenance ${status === MaintenanceStatus.CANCELLED ? "annulée" : status === MaintenanceStatus.COMPLETED ? "terminée" : "mise à jour"} avec succès.`,
            });
            await refreshVehicles();
            fetchData(filters);
          } else {
            setFeedback({
              type: "error",
              message: result.error ?? "Erreur lors de la mise à jour du statut",
            });
          }
        } catch (err) {
          console.error(err);
          setFeedback({
            type: "error",
            message: "Erreur inattendue lors de la mise à jour du statut",
          });
        } finally {
          setActionLoadingId(null);
        }
      });
    },
    [filters, fetchData, refreshVehicles, startTransition]
  );

  const handleViewDetails = useCallback((maintenance: MaintenanceRecord) => {
    setSelectedMaintenance(maintenance);
    setDetailsOpen(true);
  }, []);

  const clearFeedback = useCallback(() => setFeedback(null), []);

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance des véhicules</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Planifiez, suivez et clôturez les interventions de maintenance de votre flotte.
          </p>
          {vehiclesError && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {vehiclesError}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              refreshVehicles();
              fetchData(filters);
            }}
          >
            <RefreshCcw className={cn("h-4 w-4 mr-2", isPending && "animate-spin")} />
            Rafraîchir
          </Button>
          <Button type="button" onClick={handleCreate} disabled={vehicles.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Planifier une maintenance
          </Button>
        </div>
      </div>

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
        <Card
          className={cn(
            "p-4 border",
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              <p className="text-sm font-medium">{feedback.message}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFeedback}>
              Fermer
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-4 border border-red-200 bg-red-50 text-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </Card>
      )}

      <MaintenanceTable
        maintenances={maintenances}
        onEdit={handleEdit}
        onStatusChange={handleStatusChange}
        onViewDetails={handleViewDetails}
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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-xl">
          {selectedMaintenance && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">
                  Détails de la maintenance
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {selectedMaintenance.vehicle.brand} {selectedMaintenance.vehicle.model}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{selectedMaintenance.vehicle.licensePlate}</Badge>
                    <Badge variant="outline">
                      Statut : {statusLabels[selectedMaintenance.status]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Horaires</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(selectedMaintenance.startDate), "dd MMM yyyy HH:mm", {
                      locale: fr,
                    })}{" "}
                    →{" "}
                    {format(new Date(selectedMaintenance.endDate), "dd MMM yyyy HH:mm", {
                      locale: fr,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Description</p>
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {selectedMaintenance.description ?? "Aucune description"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Notes internes</p>
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {selectedMaintenance.notes ?? "Pas de notes"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  Créé le{" "}
                  {format(new Date(selectedMaintenance.createdAt), "dd MMM yyyy HH:mm", {
                    locale: fr,
                  })}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

