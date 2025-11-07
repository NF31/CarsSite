"use client";

import { useMemo } from "react";
import type { MaintenanceStatusFilter } from "@/actions/admin/vehicles/get-maintenance";
import type { MaintenanceType } from "@prisma/client";
import type { MaintenanceVehicleOption } from "@/actions/admin/vehicles/get-maintenance-vehicles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Filter, RefreshCcw } from "lucide-react";

export interface MaintenanceFiltersState {
  status: MaintenanceStatusFilter;
  type: MaintenanceType | "ALL";
  vehicleId?: string;
  includeBlocked: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy: "startDate" | "endDate" | "createdAt" | "cost";
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
}

interface MaintenanceFiltersProps {
  filters: MaintenanceFiltersState;
  searchValue: string;
  onFiltersChange: (filters: MaintenanceFiltersState) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
  vehicles: MaintenanceVehicleOption[];
  isLoading?: boolean;
}

const statusOptions: Array<{ value: MaintenanceStatusFilter; label: string }> = [
  { value: "ACTIVE", label: "Actives & à venir" },
  { value: "SCHEDULED", label: "Planifiées" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "UPCOMING", label: "À venir" },
  { value: "PAST", label: "Historique" },
  { value: "COMPLETED", label: "Terminées" },
  { value: "CANCELLED", label: "Annulées" },
  { value: "ALL", label: "Toutes les maintenances" },
];

const typeOptions: Array<{ value: MaintenanceType | "ALL"; label: string }> = [
  { value: "ALL", label: "Tous les types" },
  { value: "SERVICE", label: "Entretien" },
  { value: "REPAIR", label: "Réparation" },
  { value: "INSPECTION", label: "Inspection" },
  { value: "BLOCKED", label: "Blocages" },
];

const sortOptions: Array<{ value: MaintenanceFiltersState["sortBy"]; label: string }> = [
  { value: "startDate", label: "Date de début" },
  { value: "endDate", label: "Date de fin" },
  { value: "createdAt", label: "Date de création" },
  { value: "cost", label: "Coût" },
];

export function MaintenanceFilters({
  filters,
  searchValue,
  onFiltersChange,
  onSearchChange,
  onReset,
  vehicles,
  isLoading,
}: MaintenanceFiltersProps) {
  const vehicleOptions = useMemo(() => {
    return vehicles.map((vehicle) => ({
      value: vehicle.id,
      label: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
      status: vehicle.status,
      activeMaintenances: vehicle.activeMaintenances,
    }));
  }, [vehicles]);

  const handleStatusChange = (value: MaintenanceStatusFilter) => {
    onFiltersChange({
      ...filters,
      status: value,
      page: 1,
    });
  };

  const handleTypeChange = (value: MaintenanceType | "ALL") => {
    onFiltersChange({
      ...filters,
      type: value,
      page: 1,
    });
  };

  const handleVehicleChange = (value: string) => {
    onFiltersChange({
      ...filters,
      vehicleId: value === "all" ? undefined : value,
      page: 1,
    });
  };

  const handleDateChange = (key: "startDate" | "endDate", value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
      page: 1,
    });
  };

  const handleSortByChange = (value: MaintenanceFiltersState["sortBy"]) => {
    onFiltersChange({
      ...filters,
      sortBy: value,
      page: 1,
    });
  };

  const handleSortOrderChange = (value: MaintenanceFiltersState["sortOrder"]) => {
    onFiltersChange({
      ...filters,
      sortOrder: value,
      page: 1,
    });
  };

  return (
    <Card className="shadow-sm border border-gray-200 w-full">
      <CardContent className="space-y-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2 text-gray-700">
            <Filter className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-sm md:text-base">Filtres</p>
              <p className="text-xs text-muted-foreground">
                Affinez la liste des maintenances selon vos besoins
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <RefreshCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="maintenance-status">Statut</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleStatusChange(value as MaintenanceStatusFilter)}
              disabled={isLoading}
            >
              <SelectTrigger id="maintenance-status">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="maintenance-type">Type</Label>
            <Select
              value={filters.type}
              onValueChange={(value) => handleTypeChange(value as MaintenanceType | "ALL")}
              disabled={isLoading}
            >
              <SelectTrigger id="maintenance-type">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="maintenance-vehicle">Véhicule</Label>
            <Select
              value={filters.vehicleId ?? "all"}
              onValueChange={handleVehicleChange}
              disabled={isLoading || vehicleOptions.length === 0}
            >
              <SelectTrigger id="maintenance-vehicle">
                <SelectValue placeholder="Tous les véhicules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les véhicules</SelectItem>
                {vehicleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                    {option.activeMaintenances > 0 ? ` • ${option.activeMaintenances} actives` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="maintenance-search">Recherche</Label>
            <Input
              id="maintenance-search"
              placeholder="Rechercher (modèle, plaque, description...)"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="maintenance-start-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Date de début (≥)
            </Label>
            <Input
              id="maintenance-start-date"
              type="date"
              value={filters.startDate ?? ""}
              onChange={(event) => handleDateChange("startDate", event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="maintenance-end-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Date de fin (≤)
            </Label>
            <Input
              id="maintenance-end-date"
              type="date"
              value={filters.endDate ?? ""}
              onChange={(event) => handleDateChange("endDate", event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="maintenance-sort-by">Trier par</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => handleSortByChange(value as MaintenanceFiltersState["sortBy"])}
              disabled={isLoading}
            >
              <SelectTrigger id="maintenance-sort-by">
                <SelectValue placeholder="Critère" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

  <div className="space-y-1.5">
            <Label htmlFor="maintenance-sort-order">Ordre</Label>
            <Select
              value={filters.sortOrder}
              onValueChange={(value) =>
                handleSortOrderChange(value as MaintenanceFiltersState["sortOrder"])
              }
              disabled={isLoading}
            >
              <SelectTrigger id="maintenance-sort-order">
                <SelectValue placeholder="Ordre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Croissant</SelectItem>
                <SelectItem value="desc">Décroissant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-4">
          <div className="flex items-center gap-2">
            <Switch
              id="include-blocked"
              checked={filters.includeBlocked}
              onCheckedChange={(checked) =>
                onFiltersChange({
                  ...filters,
                  includeBlocked: checked,
                  page: 1,
                })
              }
              disabled={isLoading}
            />
            <Label htmlFor="include-blocked" className="text-sm">
              Inclure les blocages
            </Label>
          </div>

          <div className="text-xs text-muted-foreground">
            {filters.startDate || filters.endDate
              ? `Plage appliquée : ${filters.startDate ?? "∞"} → ${filters.endDate ?? "∞"}`
              : "Aucune limite de dates appliquée"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

