import { useState, useMemo, useEffect } from "react";
import type { ServiceRecord } from "@/actions/admin/services";

interface UseServicesPaginationProps {
  filteredServices: ServiceRecord[];
  itemsPerPage?: number;
}

export function useServicesPagination({
  filteredServices,
  itemsPerPage = 8,
}: UseServicesPaginationProps) {
  const [page, setPage] = useState(1);

  const totalItems = filteredServices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const clampedPage = Math.min(page, totalPages);
  const startIndex = (clampedPage - 1) * itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, startIndex + itemsPerPage);

  // Réinitialiser la page si elle dépasse le nombre total de pages
  useEffect(() => {
    if (clampedPage !== page) {
      setPage(clampedPage);
    }
  }, [clampedPage, page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return {
    page: clampedPage,
    totalPages,
    totalItems,
    startIndex,
    itemsPerPage,
    paginatedServices,
    hasNext: clampedPage < totalPages,
    hasPrev: clampedPage > 1,
    onPageChange: handlePageChange,
    resetPage: () => setPage(1),
  };
}

