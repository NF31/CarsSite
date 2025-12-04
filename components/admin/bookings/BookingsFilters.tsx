"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, CalendarRange } from "lucide-react";
import type { BookingStatus } from "@/lib/types/booking-status";

interface BookingsFiltersProps {
  filters: {
    status?: BookingStatus;
    pickupLocationId?: string;
    returnLocationId?: string;
    search?: string;
    startDateFrom?: string;
    startDateTo?: string;
  };
  onFiltersChange: (filters: {
    status?: BookingStatus;
    pickupLocationId?: string;
    returnLocationId?: string;
    search?: string;
    startDateFrom?: string;
    startDateTo?: string;
  }) => void;
  locations?: Array<{ id: string; name: string; city: string }>;
}

const statusOptions: { value: BookingStatus; label: string }[] = [
  { value: "PENDING", label: "En attente" },
  { value: "CONFIRMED", label: "Confirmée" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "COMPLETED", label: "Terminée" },
  { value: "CANCELLED", label: "Annulée" },
];

export function BookingsFilters({
  filters,
  onFiltersChange,
  locations = [],
}: BookingsFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue || undefined });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleFilterChange = (key: keyof BookingsFiltersProps["filters"], value: string) => {
    const filterValue = value === "all" ? undefined : value;
    onFiltersChange({
      ...filters,
      [key]: filterValue,
    });
  };

  const handleDateChange = (key: "startDateFrom" | "startDateTo", value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value ? new Date(value).toISOString() : undefined,
    });
  };

  const clearFilters = () => {
    setSearchValue("");
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== undefined && value !== "");

  const formatDateForInput = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Filtres</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
            <X className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="search">Recherche</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Référence, client, véhicule..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pickupLocation">Retrait</Label>
          <Select
            value={filters.pickupLocationId || "all"}
            onValueChange={(value) => handleFilterChange("pickupLocationId", value)}
          >
            <SelectTrigger id="pickupLocation">
              <SelectValue placeholder="Tous les points de retrait" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les points de retrait</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name} • {location.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="returnLocation">Retour</Label>
          <Select
            value={filters.returnLocationId || "all"}
            onValueChange={(value) => handleFilterChange("returnLocationId", value)}
          >
            <SelectTrigger id="returnLocation">
              <SelectValue placeholder="Tous les points de retour" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les points de retour</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name} • {location.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDateFrom">Début à partir du</Label>
          <div className="relative">
            <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="startDateFrom"
              type="date"
              value={formatDateForInput(filters.startDateFrom)}
              onChange={(event) => handleDateChange("startDateFrom", event.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDateTo">Début avant le</Label>
          <div className="relative">
            <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="startDateTo"
              type="date"
              value={formatDateForInput(filters.startDateTo)}
              onChange={(event) => handleDateChange("startDateTo", event.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}


