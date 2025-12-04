"use client";

import { Button } from "@/components/ui/button";

interface ClientsPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function ClientsPagination({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
}: ClientsPaginationProps) {
  if (totalItems === 0) {
    return null;
  }

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  return (
    <div className="flex flex-col items-center gap-4 border-t pt-4 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Affichage de <span className="font-medium text-gray-900">{startItem}</span> à{" "}
        <span className="font-medium text-gray-900">{endItem}</span> sur{" "}
        <span className="font-medium text-gray-900">{totalItems}</span> clients
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Précédent
        </Button>
        <div className="text-sm text-muted-foreground">
          Page <span className="font-medium text-gray-900">{page}</span> / {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}


