import { memo } from "react";
import { Filter, X } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SearchFilters as SearchFiltersType } from "@/actions/admin/search";

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  onReset: () => void;
}

const bookingStatusLabels: Record<string, string> = {
  all: "Tous les statuts",
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

const vehicleStatusLabels: Record<string, string> = {
  all: "Tous les statuts",
  AVAILABLE: "Disponible",
  RESERVED: "Réservé",
  MAINTENANCE: "En maintenance",
  UNAVAILABLE: "Indisponible",
};

export const SearchFilters = memo(function SearchFilters({
  filters,
  onFiltersChange,
  onReset,
}: SearchFiltersProps) {
  const hasActiveFilters =
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    (filters.bookingStatus && filters.bookingStatus !== "all") ||
    (filters.vehicleStatus && filters.vehicleStatus !== "all");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            Filtres de recherche
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="minPrice">Prix minimum (€)</Label>
            <Input
              id="minPrice"
              type="number"
              placeholder="0"
              min="0"
              step="0.01"
              value={filters.minPrice ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                onFiltersChange({
                  ...filters,
                  minPrice: value === "" ? undefined : parseFloat(value),
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxPrice">Prix maximum (€)</Label>
            <Input
              id="maxPrice"
              type="number"
              placeholder="10000"
              min="0"
              step="0.01"
              value={filters.maxPrice ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                onFiltersChange({
                  ...filters,
                  maxPrice: value === "" ? undefined : parseFloat(value),
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookingStatus">Statut réservation</Label>
            <Select
              value={filters.bookingStatus ?? "all"}
              onValueChange={(value) => {
                onFiltersChange({
                  ...filters,
                  bookingStatus: value === "all" ? undefined : value,
                });
              }}
            >
              <SelectTrigger id="bookingStatus">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(bookingStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicleStatus">Statut véhicule</Label>
            <Select
              value={filters.vehicleStatus ?? "all"}
              onValueChange={(value) => {
                onFiltersChange({
                  ...filters,
                  vehicleStatus: value === "all" ? undefined : value,
                });
              }}
            >
              <SelectTrigger id="vehicleStatus">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(vehicleStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

