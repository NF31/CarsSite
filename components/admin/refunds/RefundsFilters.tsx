import { memo } from "react";
import { Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RefundsFiltersProps {
  searchQuery: string;
  statusFilter: string;
  reasonFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onReasonChange: (value: string) => void;
}

export const RefundsFilters = memo(function RefundsFilters({
  searchQuery,
  statusFilter,
  reasonFilter,
  onSearchChange,
  onStatusChange,
  onReasonChange,
}: RefundsFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          Filtres
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence, client, véhicule..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="COMPLETED">Complété</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="FAILED">Échoué</SelectItem>
              <SelectItem value="CANCELLED">Annulé</SelectItem>
            </SelectContent>
          </Select>
          <Select value={reasonFilter} onValueChange={onReasonChange}>
            <SelectTrigger>
              <SelectValue placeholder="Raison" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les raisons</SelectItem>
              <SelectItem value="cancellation">Annulation</SelectItem>
              <SelectItem value="booking_modification">Modification de dates</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
});

