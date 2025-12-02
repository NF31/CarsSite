import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ClientRecentBookingsPagination } from "@/actions/client/bookings/get-recent";
import { parsePageFromSearch } from "../utils";

interface UsePaginationSyncReturn {
  currentPageInQuery: number;
  handlePageChange: (page: number) => void;
}

/**
 * Hook pour synchroniser la pagination avec les paramètres d'URL
 */
export function usePaginationSync(
  pagination: ClientRecentBookingsPagination,
  fetchPage: (page: number) => void
): UsePaginationSyncReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPageInQuery = parsePageFromSearch(searchParams.get("recentPage"));

  useEffect(() => {
    if (currentPageInQuery !== pagination.page) {
      fetchPage(currentPageInQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageInQuery]);

  const handlePageChange = (page: number) => {
    if (page === pagination.page || page < 1) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("recentPage");
    } else {
      params.set("recentPage", page.toString());
    }

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(`/dashboard${newUrl}`, { scroll: false });
    fetchPage(page);
  };

  return {
    currentPageInQuery,
    handlePageChange,
  };
}

