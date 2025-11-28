import { memo } from "react";
import { Receipt, Search } from "lucide-react";

interface EmptyStateProps {
  type: "no-invoices" | "no-results";
}

export const EmptyState = memo(function EmptyState({ type }: EmptyStateProps) {
  if (type === "no-invoices") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
        <Receipt className="h-10 w-10 text-slate-300" />
        <p className="text-base font-semibold text-gray-900">Aucune facture disponible</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Les factures générées apparaîtront ici. Créez une réservation facturable pour commencer.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
      <Search className="h-10 w-10 text-slate-300" />
      <p className="text-base font-semibold text-gray-900">Aucun résultat pour ces filtres</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Modifiez la recherche ou le statut sélectionné pour afficher les factures correspondantes.
      </p>
    </div>
  );
});

