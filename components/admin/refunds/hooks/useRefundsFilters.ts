import { useState, useMemo, useCallback } from "react";
import type { RefundListItem } from "@/actions/admin/refunds/get-all-refunds";

interface UseRefundsFiltersProps {
  refunds: RefundListItem[];
}

export function useRefundsFilters({ refunds }: UseRefundsFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");

  const filteredRefunds = useMemo(() => {
    return refunds.filter((refund) => {
      // Filtre de recherche
      const matchesSearch =
        searchQuery === "" ||
        refund.bookingReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        refund.booking?.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        refund.booking?.vehicle?.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        refund.transactionId?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtre de statut
      const matchesStatus = statusFilter === "all" || refund.status === statusFilter;

      // Filtre de raison
      const matchesReason = reasonFilter === "all" || refund.reason === reasonFilter;

      return matchesSearch && matchesStatus && matchesReason;
    });
  }, [refunds, searchQuery, statusFilter, reasonFilter]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setReasonFilter("all");
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    reasonFilter,
    setReasonFilter,
    filteredRefunds,
    handleResetFilters,
  };
}

