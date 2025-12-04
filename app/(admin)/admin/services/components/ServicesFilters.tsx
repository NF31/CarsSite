import { memo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardHeader } from "@/components/ui/card";
import type { ServicePricingType } from "@/lib/types/service-pricing-type";
import type { VehicleCategory } from "@/lib/types/vehicle-category";

const categoryLabels: Record<VehicleCategory, string> = {
  ECONOMY: "Économique",
  COMPACT: "Compacte",
  MID_SIZE: "Moyenne",
  FULL_SIZE: "Grande",
  SUV: "SUV",
  LUXURY: "Luxe",
  VAN: "Utilitaire",
};

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type PricingFilter = "ALL" | ServicePricingType;
type CategoryFilter = "ALL" | VehicleCategory;

interface ServicesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  pricingFilter: PricingFilter;
  onPricingChange: (value: PricingFilter) => void;
  categoryFilter: CategoryFilter;
  onCategoryChange: (value: CategoryFilter) => void;
  showInactive: boolean;
  onShowInactiveChange: (value: boolean) => void;
  onFilterChange: () => void;
}

export const ServicesFilters = memo(function ServicesFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  pricingFilter,
  onPricingChange,
  categoryFilter,
  onCategoryChange,
  showInactive,
  onShowInactiveChange,
  onFilterChange,
}: ServicesFiltersProps) {
  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un service (nom ou description)…"
              value={searchTerm}
              onChange={(event) => {
                onSearchChange(event.target.value);
                onFilterChange();
              }}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <Select
              value={statusFilter}
              onValueChange={(value: StatusFilter) => {
                onStatusChange(value);
                onFilterChange();
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="ACTIVE">Actifs</SelectItem>
                <SelectItem value="INACTIVE">Inactifs</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={pricingFilter}
              onValueChange={(value: PricingFilter) => {
                onPricingChange(value);
                onFilterChange();
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type de tarification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les types</SelectItem>
                <SelectItem value="PER_DAY">Par jour</SelectItem>
                <SelectItem value="FIXED">Montant fixe</SelectItem>
                <SelectItem value="PERCENTAGE">Pourcentage</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={(value: CategoryFilter) => {
                onCategoryChange(value);
                onFilterChange();
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Catégorie de véhicule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les catégories</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch
            id="toggle-inactive"
            checked={showInactive}
            onCheckedChange={(checked) => {
              onShowInactiveChange(checked);
              onFilterChange();
            }}
          />
          <Label htmlFor="toggle-inactive">Afficher les services inactifs</Label>
        </div>
      </CardHeader>
    </Card>
  );
});

