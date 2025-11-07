"use client";

import { useMemo, useState } from "react";
import type { ServiceRecord, ServicesSummary } from "@/actions/admin/services";
import type { ServicePricingType, VehicleCategory } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Gift, Filter, RefreshCcw, Grid3x3, List } from "lucide-react";
import { VehiclesPagination } from "@/components/admin/vehicles/VehiclesPagination";
import { ServicesGridView } from "@/components/admin/services/ServicesGridView";
import { ServicesListView } from "@/components/admin/services/ServicesListView";

const categoryLabels: Record<VehicleCategory, string> = {
  ECONOMY: "Économique",
  COMPACT: "Compacte",
  MID_SIZE: "Moyenne",
  FULL_SIZE: "Grande",
  SUV: "SUV",
  LUXURY: "Luxe",
  VAN: "Utilitaire",
};

const summaryPriceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type PricingFilter = "ALL" | ServicePricingType;
type CategoryFilter = "ALL" | VehicleCategory;
type ViewMode = "grid" | "list";

interface ServicesPageClientProps {
  services: ServiceRecord[];
  summary: ServicesSummary;
}

export function ServicesPageClient({ services, summary }: ServicesPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [pricingFilter, setPricingFilter] = useState<PricingFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [showInactive, setShowInactive] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const ITEMS_PER_PAGE = 8;

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

  const totalItems = filteredServices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const clampedPage = Math.min(page, totalPages);
  const startIndex = (clampedPage - 1) * ITEMS_PER_PAGE;
  const paginatedServices = filteredServices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setPricingFilter("ALL");
    setCategoryFilter("ALL");
    setShowInactive(true);
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Services additionnels</h1>
          <p className="text-sm text-muted-foreground">
            Consultez les services proposés lors des réservations et leur disponibilité par
            catégorie.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleResetFilters}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
          <Button asChild>
            <Link href="/admin/services/add" className="inline-flex items-center">
              <Gift className="mr-2 h-4 w-4" />
              Nouveau service
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filtres</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            aria-label="Vue grille"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            aria-label="Vue liste"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Services actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{summary.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.total > 0
                ? `${Math.round((summary.active / summary.total) * 100)}% du catalogue`
                : "Aucun service actif"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Services inactifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{summary.inactive}</div>
            <p className="text-xs text-muted-foreground mt-1">
              En attente de réactivation ou d’archivage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prix moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {summary.averagePrice !== null
                ? summaryPriceFormatter.format(summary.averagePrice)
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Calculé sur l’ensemble des services actifs et inactifs
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un service (nom ou description)…"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
              <Select
                value={statusFilter}
                onValueChange={(value: StatusFilter) => {
                  setStatusFilter(value);
                  setPage(1);
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
                  setPricingFilter(value);
                  setPage(1);
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
                  setCategoryFilter(value);
                  setPage(1);
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
                setShowInactive(checked);
                setPage(1);
              }}
            />
            <Label htmlFor="toggle-inactive">Afficher les services inactifs</Label>
          </div>
        </CardHeader>
      </Card>

      {filteredServices.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="px-6 py-12 text-center">
            <p className="text-lg font-medium text-gray-900">Aucun service trouvé</p>
            <p className="text-sm text-muted-foreground mt-2">
              Ajustez vos filtres ou créez un nouveau service pour enrichir votre catalogue.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <ServicesGridView services={paginatedServices} />
      ) : (
        <ServicesListView services={paginatedServices} startIndex={startIndex} />
      )}

      {filteredServices.length > 0 && (
        <VehiclesPagination
          currentPage={clampedPage}
          totalPages={totalPages}
          hasNext={clampedPage < totalPages}
          hasPrev={clampedPage > 1}
          onPageChange={setPage}
          startIndex={startIndex}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={totalItems}
        />
      )}
    </div>
  );
}

