"use client";

import { useEffect, useMemo, useState } from "react";
import type { ServiceRecord, ServicesSummary } from "@/actions/admin/services/get-services";
import type { ServicePricingType, VehicleCategory } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Gift, Filter, RefreshCcw } from "lucide-react";
import { VehiclesPagination } from "@/components/admin/vehicles/VehiclesPagination";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const pricingTypeLabels: Record<ServicePricingType, string> = {
  PER_DAY: "Par jour",
  FIXED: "Montant fixe",
  PERCENTAGE: "Pourcentage",
};

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

  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, pricingFilter, categoryFilter, showInactive]);

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

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredServices.length / ITEMS_PER_PAGE));
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [filteredServices, page]);

  const totalItems = filteredServices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedServices = filteredServices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setPricingFilter("ALL");
    setCategoryFilter("ALL");
    setShowInactive(true);
  };

  const renderPrice = (service: ServiceRecord) => {
    switch (service.pricingType) {
      case "PER_DAY":
        return `${currencyFormatter.format(service.price)} / jour`;
      case "FIXED":
        return `${currencyFormatter.format(service.price)} (fixe)`;
      case "PERCENTAGE":
        return `${service.price}% du montant de la réservation`;
      default:
        return currencyFormatter.format(service.price);
    }
  };

  const renderCategories = (categories: VehicleCategory[]) => {
    if (!categories || categories.length === 0) {
      return <Badge variant="outline">Toutes catégories</Badge>;
    }
    return categories.map((category) => (
      <Badge key={category} variant="secondary">
        {categoryLabels[category]}
      </Badge>
    ));
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services additionnels</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consultez les services proposés lors des réservations et leur disponibilité par
            catégorie.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleResetFilters}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
          <Button>
            <Gift className="mr-2 h-4 w-4" />
            Nouveau service
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Services actifs
            </CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prix moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {summary.averagePrice !== null
                ? currencyFormatter.format(summary.averagePrice)
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
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Filter className="h-4 w-4" />
            <span>Filtres</span>
          </div>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un service (nom ou description)…"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
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
                onValueChange={(value: PricingFilter) => setPricingFilter(value)}
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
                onValueChange={(value: CategoryFilter) => setCategoryFilter(value)}
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
              onCheckedChange={(checked) => setShowInactive(checked)}
            />
            <Label htmlFor="toggle-inactive">Afficher les services inactifs</Label>
          </div>
        </CardHeader>
      </Card>

      <section className="space-y-4">
        {filteredServices.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="px-6 py-12 text-center">
              <p className="text-lg font-medium text-gray-900">Aucun service trouvé</p>
              <p className="text-sm text-muted-foreground mt-2">
                Ajustez vos filtres ou créez un nouveau service pour enrichir votre catalogue.
              </p>
            </CardContent>
          </Card>
        ) : (
          paginatedServices.map((service) => (
            <Card key={service.id} className={cn("border shadow-sm", !service.active && "opacity-80")}>
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        {service.name}
                      </CardTitle>
                      <Badge variant={service.active ? "default" : "outline"} className="text-xs">
                        {service.active ? "Actif" : "Inactif"}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {pricingTypeLabels[service.pricingType]}
                      </Badge>
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    )}
                  </div>
                  <div className="text-right min-w-[160px]">
                    <p className="text-lg font-semibold text-primary">{renderPrice(service)}</p>
                    <p className="text-xs text-muted-foreground">
                      Mise à jour {format(new Date(service.updatedAt), "dd MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {renderCategories(service.availableForCategories)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                  <Button variant={service.active ? "ghost" : "outline"} size="sm">
                    {service.active ? "Désactiver" : "Activer"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      {filteredServices.length > 0 && (
        <VehiclesPagination
          currentPage={page}
          totalPages={totalPages}
          hasNext={page < totalPages}
          hasPrev={page > 1}
          onPageChange={setPage}
          startIndex={startIndex}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={totalItems}
        />
      )}
    </div>
  );
}

