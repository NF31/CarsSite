import { useState, useMemo, useCallback } from "react";
import type { InvoiceListItem } from "@/actions/admin/invoices/get-invoices";

type StatusFilter = "ALL" | InvoiceListItem["status"];

interface UseInvoicesFiltersProps {
  invoices: InvoiceListItem[];
  itemsPerPage?: number;
}

export function useInvoicesFilters({
  invoices,
  itemsPerPage: defaultItemsPerPage = 10,
}: UseInvoicesFiltersProps) {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        invoice.invoiceNumber.toLowerCase().includes(normalizedSearch) ||
        invoice.user.name.toLowerCase().includes(normalizedSearch) ||
        invoice.user.email.toLowerCase().includes(normalizedSearch) ||
        invoice.booking.reference.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === "ALL" || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchValue, statusFilter]);

  const totalItems = filteredInvoices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const clampedPage = Math.min(page, totalPages);
  const startIndex = (clampedPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  const handleItemsPerPageChange = useCallback((value: string) => {
    const numeric = Number(value);
    setItemsPerPage(Number.isNaN(numeric) ? defaultItemsPerPage : numeric);
    setPage(1);
  }, [defaultItemsPerPage]);

  const handleResetFilters = useCallback(() => {
    setSearchValue("");
    setStatusFilter("ALL");
    setPage(1);
  }, []);

  return {
    searchValue,
    setSearchValue,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    itemsPerPage,
    setItemsPerPage: handleItemsPerPageChange,
    filteredInvoices,
    paginatedInvoices,
    totalItems,
    totalPages,
    clampedPage,
    handleResetFilters,
  };
}

