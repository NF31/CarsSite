import { memo, type ReactNode } from "react";
import { CalendarRange, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { GetClientsFilters } from "@/actions/admin/clients";

interface ClientsFiltersProps {
  filters: GetClientsFilters;
  searchValue: string;
  defaultLimit: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: NonNullable<GetClientsFilters["status"]> | "all") => void;
  onReservationsChange: (value: NonNullable<GetClientsFilters["reservations"]> | "all") => void;
  onLimitChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onDateChange: (key: "registrationFrom" | "registrationTo", value: string) => void;
  children?: ReactNode;
}

const PER_PAGE_OPTIONS = [12, 18, 24, 36];

const formatDateForInput = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

export const ClientsFilters = memo(function ClientsFilters({
  filters,
  searchValue,
  defaultLimit,
  onSearchChange,
  onStatusChange,
  onReservationsChange,
  onLimitChange,
  onSortChange,
  onDateChange,
  children,
}: ClientsFiltersProps) {
  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client (nom, email, téléphone)…"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Select value={filters.status ?? "all"} onValueChange={onStatusChange}>
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

            <Select value={filters.reservations ?? "all"} onValueChange={onReservationsChange}>
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

            <Select value={String(filters.limit ?? defaultLimit)} onValueChange={onLimitChange}>
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
              onValueChange={onSortChange}
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
                onChange={(event) => onDateChange("registrationFrom", event.target.value)}
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
                onChange={(event) => onDateChange("registrationTo", event.target.value)}
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

      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
});

