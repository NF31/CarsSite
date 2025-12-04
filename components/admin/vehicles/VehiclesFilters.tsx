"use client";

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
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import type { VehicleCategory } from "@prisma/client";
import type { VehicleStatus } from "@/lib/types/vehicle-status";

interface VehiclesFiltersProps {
  filters: {
    status?: VehicleStatus;
    category?: VehicleCategory;
    brand?: string;
    locationId?: string;
    search?: string;
  };
  onFiltersChange: (filters: {
    status?: VehicleStatus;
    category?: VehicleCategory;
    brand?: string;
    locationId?: string;
    search?: string;
  }) => void;
  locations?: Array<{ id: string; name: string; city: string }>;
  brands?: string[];
}

const statusOptions: { value: VehicleStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Disponible" },
  { value: "RESERVED", label: "Réservé" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "UNAVAILABLE", label: "Indisponible" },
];

const categoryOptions: { value: VehicleCategory; label: string }[] = [
  { value: "ECONOMY", label: "Économique" },
  { value: "COMPACT", label: "Compact" },
  { value: "MID_SIZE", label: "Moyenne" },
  { value: "FULL_SIZE", label: "Grande" },
  { value: "SUV", label: "SUV" },
  { value: "LUXURY", label: "Luxe" },
  { value: "VAN", label: "Utilitaire" },
];

export function VehiclesFilters({
  filters,
  onFiltersChange,
  locations = [],
  brands = [],
}: VehiclesFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");

  useEffect(() => {
    // Debounce pour la recherche
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue || undefined });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleFilterChange = (key: string, value: string) => {
    // Si la valeur est "all", on la traite comme undefined (pas de filtre)
    const filterValue = value === "all" ? undefined : value;
    onFiltersChange({
      ...filters,
      [key]: filterValue,
    });
  };

  const clearFilters = () => {
    setSearchValue("");
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== "");

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
        {/* Recherche */}
        <div className="space-y-2">
          <Label htmlFor="search">Recherche</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Modèle, plaque..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Statut */}
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

        {/* Catégorie */}
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <Select
            value={filters.category || "all"}
            onValueChange={(value) => handleFilterChange("category", value)}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Localisation */}
        <div className="space-y-2">
          <Label htmlFor="location">Localisation</Label>
          <Select
            value={filters.locationId || "all"}
            onValueChange={(value) => handleFilterChange("locationId", value)}
          >
            <SelectTrigger id="location">
              <SelectValue placeholder="Toutes les localisations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les localisations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name} - {location.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Marque (si disponible) */}
      {brands.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="brand">Marque</Label>
          <Select
            value={filters.brand || "all"}
            onValueChange={(value) => handleFilterChange("brand", value)}
          >
            <SelectTrigger id="brand">
              <SelectValue placeholder="Toutes les marques" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les marques</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

