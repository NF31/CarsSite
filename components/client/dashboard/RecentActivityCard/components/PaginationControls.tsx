import { Button } from "@/components/ui/button";
import { memo } from "react";
import type { ClientRecentBookingsPagination } from "@/actions/client/bookings/get-recent";

interface PaginationControlsProps {
  pagination: ClientRecentBookingsPagination;
  isPending: boolean;
  onPageChange: (page: number) => void;
}

export const PaginationControls = memo(function PaginationControls({
  pagination,
  isPending,
  onPageChange,
}: PaginationControlsProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const hasPrevious = pagination.hasPrev;
  const hasNext = pagination.hasNext;

  return (
    <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Affichage {(pagination.page - 1) * pagination.limit + 1}–
        {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} • Page{" "}
        {pagination.page} sur {pagination.totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!hasPrevious || isPending}
        >
          {isPending && hasPrevious ? "Chargement..." : "Précédent"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!hasNext || isPending}
        >
          {isPending && hasNext ? "Chargement..." : "Suivant"}
        </Button>
      </div>
    </div>
  );
});

