import { memo } from "react";
import { AlertCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { InvoiceListItem } from "@/actions/admin/invoices/get-invoices";
import { INVOICE_STATUS_LABELS } from "../invoice-helpers";

type StatusFilter = "ALL" | InvoiceListItem["status"];

interface InvoicesFiltersProps {
  searchValue: string;
  statusFilter: StatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onReset: () => void;
}

export const InvoicesFilters = memo(function InvoicesFilters({
  searchValue,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onReset,
}: InvoicesFiltersProps) {
  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full items-center gap-3 md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une facture, un client, une réservation…"
                className="pl-9"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="DRAFT">{INVOICE_STATUS_LABELS.DRAFT}</SelectItem>
                <SelectItem value="SENT">{INVOICE_STATUS_LABELS.SENT}</SelectItem>
                <SelectItem value="PAID">{INVOICE_STATUS_LABELS.PAID}</SelectItem>
                <SelectItem value="OVERDUE">{INVOICE_STATUS_LABELS.OVERDUE}</SelectItem>
                <SelectItem value="CANCELLED">{INVOICE_STATUS_LABELS.CANCELLED}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={onReset}>
            Réinitialiser
          </Button>
        </div>
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          Utilisez la recherche pour filtrer par numéro de facture, client ou référence de réservation.
        </div>
      </CardHeader>
      <CardContent />
    </Card>
  );
});

