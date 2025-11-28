import { memo } from "react";
import { History } from "lucide-react";

export const RefundsHeader = memo(function RefundsHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <History className="h-6 w-6 text-muted-foreground" />
          Historique des remboursements
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Liste de tous les remboursements effectués pour les réservations
        </p>
      </div>
    </div>
  );
});

