"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CalendarRange,
  Filter,
  Grid3x3,
  List,
  RefreshCcw,
  Search,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getClientsAction,
  type ClientListItem,
  type ClientStats,
  type GetClientsFilters,
} from "@/actions/admin/clients";
import { ClientsGridView } from "./ClientsGridView";
import { ClientsListView } from "./ClientsListView";
import { ClientsPagination } from "./ClientsPagination";

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

const DEFAULT_STATS: ClientStats = {
  totalClients: 0,
  activeClients: 0,
  inactiveClients: 0,
  lockedClients: 0,
  returningClients: 0,
  newClientsLast30Days: 0,
};

const PER_PAGE_OPTIONS = [12, 18, 24, 36];

const formatDateForInput = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

export function ClientsPageClient({ initialData }: ClientsPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultLimit = initialData?.pagination.limit ?? 12;
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filters, setFilters] = useState<GetClientsFilters>({
    page: initialData?.pagination.page ?? 1,
    limit: defaultLimit,
    status: undefined,
    reservations: undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [searchValue, setSearchValue] = useState(filters.search ?? "");
  const [clients, setClients] = useState<ClientListItem[]>(initialData?.clients ?? []);
  const [stats, setStats] = useState<ClientStats>(initialData?.stats ?? DEFAULT_STATS);
  const [pagination, setPagination] = useState(
    initialData?.pagination ?? {
      total: 0,
      page: 1,
      limit: filters.limit ?? 12,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    }
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchValue.trim();
      const nextSearch = trimmed.length > 0 ? trimmed : undefined;

      setFilters((prev) => {
        if (prev.search === nextSearch) {
          return prev;
        }
        return {
          ...prev,
          search: nextSearch,
          page: 1,
        };
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await getClientsAction(filters);
        if (!isMounted) {
          return;
        }
        if (result.success && result.data) {
          setClients(result.data.clients);
          setStats(result.data.stats);
          setPagination(result.data.pagination);
          setErrorMessage(null);
        } else {
          setErrorMessage(result.error ?? "Impossible de charger les clients.");
        }
      } catch (error) {
        console.error("Error loading clients:", error);
        if (isMounted) {
          setErrorMessage("Une erreur est survenue lors du chargement des clients.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const successParam = searchParams.get("success");
  const errorParam = searchParams.get("error");
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    if (!successParam) {
      return;
    }

    const messages: Record<string, string> = {
      "client-updated": "Client mis à jour avec succès.",
    };

    const message = messages[successParam];

    if (!message) {
      return;
    }

    setSuccessBanner(message);
    setShowSuccess(true);

    const newSearchParams = new URLSearchParams(searchParamsString);
    newSearchParams.delete("success");
    const newUrl = newSearchParams.toString()
      ? `${window.location.pathname}?${newSearchParams.toString()}`
      : window.location.pathname;
    router.replace(newUrl);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", newUrl);
    }

    const timeout = window.setTimeout(() => {
      setShowSuccess(false);
      setSuccessBanner(null);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [successParam, router, searchParamsString]);

  useEffect(() => {
    if (!errorParam) {
      return;
    }

    const messages: Record<string, string> = {
      "client-invalid": "Client introuvable ou invalide.",
      "client-unavailable": "Impossible d’afficher ce client.",
      "client-update-error": "Impossible de mettre à jour ce client.",
    };

    const message = messages[errorParam];

    if (!message) {
      return;
    }

    setErrorBanner(message);
    setShowError(true);

    const newSearchParams = new URLSearchParams(searchParamsString);
    newSearchParams.delete("error");
    newSearchParams.delete("id");
    const newUrl = newSearchParams.toString()
      ? `${window.location.pathname}?${newSearchParams.toString()}`
      : window.location.pathname;
    router.replace(newUrl);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", newUrl);
    }
  }, [errorParam, router, searchParamsString]);

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setSuccessBanner(null);
  };

  const handleCloseError = () => {
    setShowError(false);
    setErrorBanner(null);
  };

  const handleStatusChange = (value: NonNullable<GetClientsFilters["status"]> | "all") => {
    setFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : value,
      page: 1,
    }));
  };

  const handleReservationsChange = (
    value: NonNullable<GetClientsFilters["reservations"]> | "all"
  ) => {
    setFilters((prev) => ({
      ...prev,
      reservations: value === "all" ? undefined : value,
      page: 1,
    }));
  };

  const handleLimitChange = (value: string) => {
    const numeric = Number(value);
    setFilters((prev) => ({
      ...prev,
      limit: Number.isNaN(numeric) ? prev.limit : numeric,
      page: 1,
    }));
  };

  const handleDateChange = (key: "registrationFrom" | "registrationTo", value: string) => {
    const parsed = value ? new Date(value) : null;
    setFilters((prev) => ({
      ...prev,
      [key]: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : undefined,
      page: 1,
    }));
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(":");
    setFilters((prev) => ({
      ...prev,
      sortBy: (sortBy as GetClientsFilters["sortBy"]) ?? "createdAt",
      sortOrder: (sortOrder as GetClientsFilters["sortOrder"]) ?? "desc",
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFilters = () => {
    setSearchValue("");
    setFilters((prev) => ({
      ...prev,
      search: undefined,
      status: undefined,
      reservations: undefined,
      registrationFrom: undefined,
      registrationTo: undefined,
      limit: defaultLimit,
      page: 1,
    }));
  };

  const startIndex = useMemo(
    () => (pagination.page - 1) * pagination.limit,
    [pagination.page, pagination.limit]
  );

  const showSkeleton = isLoading && clients.length === 0;

  return (
    <div className="space-y-8">
      {showSuccess && successBanner && (
        <Card className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <CardContent className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-sm font-medium">{successBanner}</p>
            </div>
            <button
              type="button"
              onClick={handleCloseSuccess}
              className="text-xs font-medium uppercase tracking-wide hover:underline"
            >
              Fermer
            </button>
          </CardContent>
        </Card>
      )}

      {showError && errorBanner && (
        <Card className="border-red-200 bg-red-50 text-red-800">
          <CardContent className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm font-medium">{errorBanner}</p>
            </div>
            <button
              type="button"
              onClick={handleCloseError}
              className="text-xs font-medium uppercase tracking-wide hover:underline"
            >
              Fermer
            </button>
          </CardContent>
        </Card>
      )}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Suivez et segmentez vos clients ({stats.totalClients} comptes enregistrés).
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-1 rounded-md border bg-white p-1 shadow-sm">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="sr-only">Vue grille</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
              <span className="sr-only">Vue liste</span>
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
          <Button variant="default" size="sm" disabled>
            <UserPlus className="mr-2 h-4 w-4" />
            Nouveau client (bientôt)
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clients enregistrés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalClients}</div>
            <p className="mt-1 text-xs text-muted-foreground">Comptes cumulés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clients actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{stats.activeClients}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.totalClients > 0
                ? `${Math.round((stats.activeClients / stats.totalClients) * 100)}% du portefeuille`
                : "Pas encore d’activité"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clients fidèles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{stats.returningClients}</div>
            <p className="mt-1 text-xs text-muted-foreground">Au moins 2 réservations confirmées</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nouveaux (30 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.newClientsLast30Days}</div>
            <p className="mt-1 text-xs text-muted-foreground">Prospects convertis récemment</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client (nom, email, téléphone)…"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Select
                value={filters.status ?? "all"}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Statut du compte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                  <SelectItem value="locked">Verrouillés</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.reservations ?? "all"}
                onValueChange={handleReservationsChange}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Réservations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les réservations</SelectItem>
                  <SelectItem value="with">Avec réservations</SelectItem>
                  <SelectItem value="without">Sans réservation</SelectItem>
                  <SelectItem value="returning">Clients fidèles</SelectItem>
                  <SelectItem value="vip">Premium (5+)</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={String(filters.limit ?? defaultLimit)}
                onValueChange={handleLimitChange}
              >
                <SelectTrigger className="w-44">
                  <SelectValue>{`${filters.limit ?? defaultLimit} clients`}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PER_PAGE_OPTIONS.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value} clients
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={`${filters.sortBy ?? "createdAt"}:${filters.sortOrder ?? "desc"}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt:desc">Plus récents</SelectItem>
                  <SelectItem value="createdAt:asc">Plus anciens</SelectItem>
                  <SelectItem value="bookingsCount:desc">Réservations décroissantes</SelectItem>
                  <SelectItem value="bookingsCount:asc">Réservations croissantes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="client-registered-from"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Inscription le
              </label>
              <div className="relative">
                <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client-registered-from"
                  type="date"
                  value={formatDateForInput(filters.registrationFrom)}
                  onChange={(event) => handleDateChange("registrationFrom", event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="client-registered-to"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Inscription avant le
              </label>
              <div className="relative">
                <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client-registered-to"
                  type="date"
                  value={formatDateForInput(filters.registrationTo)}
                  onChange={(event) => handleDateChange("registrationTo", event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-4 w-4" />
            Ajustez les filtres pour cibler des clients précis (statut, fidélité, période).
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{errorMessage}</span>
            </div>
          )}

          {showSkeleton ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="animate-pulse border border-slate-100">
                  <CardContent className="space-y-4 p-6">
                    <div className="h-6 w-1/2 rounded bg-slate-200" />
                    <div className="space-y-2">
                      <div className="h-4 rounded bg-slate-100" />
                      <div className="h-4 rounded bg-slate-100" />
                      <div className="h-4 rounded bg-slate-100" />
                    </div>
                    <div className="h-20 rounded bg-slate-100" />
                  </CardContent>
                </Card>
              ))}
            </div>
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
        </CardContent>
      </Card>
    </div>
  );
}


