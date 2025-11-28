import { memo } from "react";
import { DollarSign } from "lucide-react";

interface EmptyStateProps {
  hasRefunds: boolean;
}

export const EmptyState = memo(function EmptyState({ hasRefunds }: EmptyStateProps) {
  return (
    <div className="py-12 text-center">
      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
      <p className="text-sm font-medium text-gray-600">Aucun remboursement trouvé</p>
      <p className="text-xs text-gray-500 mt-1">
        {hasRefunds
          ? "Aucun remboursement ne correspond aux filtres sélectionnés."
          : "Aucun remboursement n'a encore été effectué."}
      </p>
    </div>
  );
});

