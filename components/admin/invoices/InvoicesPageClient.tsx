"use client";

import { useState } from "react";
import type {
  InvoiceClientItem,
  InvoiceListItem,
  InvoicesSummary,
} from "@/actions/admin/invoices/get-invoices";
import { InvoicesGridView } from "./InvoicesGridView";
import { InvoicesListView } from "./InvoicesListView";
import { InvoicesPagination } from "./InvoicesPagination";
import {
  InvoicesHeader,
  SuccessBanner,
  ErrorBanner,
  InvoicesStatsCards,
  InvoicesFilters,
  ClientBookingsSection,
  InvoicesViewControls,
  EmptyState,
} from "./list";
import { useInvoicesFilters, useInvoicesActions, useClientBookingsFilter } from "./hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ViewMode = "grid" | "list";

interface InvoicesPageClientProps {
  invoices: InvoiceListItem[];
  summary: InvoicesSummary;
  clients: InvoiceClientItem[];
}

export function InvoicesPageClient({ invoices, summary, clients }: InvoicesPageClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const {
    searchValue,
    setSearchValue,
    statusFilter,
    setStatusFilter,
    setPage,
    itemsPerPage,
    setItemsPerPage,
    filteredInvoices,
    paginatedInvoices,
    totalItems,
    totalPages,
    clampedPage,
    handleResetFilters,
  } = useInvoicesFilters({ invoices });

  const {
    successMessage,
    errorMessage,
    activeDownloadId,
    activeSendId,
    isDownloading,
    isSending,
    handleDownload,
    handleSend,
    handleGenerate,
    clearSuccessMessage,
    clearErrorMessage,
  } = useInvoicesActions();

  const { filteredClientBookings } = useClientBookingsFilter({
    clients,
    searchValue,
  });

  const hasInvoices = invoices.length > 0;
  const hasFilteredInvoices = filteredInvoices.length > 0;
  const hasClientBookings = filteredClientBookings.length > 0;

  return (
    <div className="space-y-8">
      <InvoicesHeader />

      <InvoicesFilters
        searchValue={searchValue}
        statusFilter={statusFilter}
        onSearchChange={setSearchValue}
        onStatusChange={setStatusFilter}
        onReset={handleResetFilters}
      />

      <InvoicesStatsCards summary={summary} invoices={invoices} />

      <InvoicesViewControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        filteredCount={filteredInvoices.length}
        totalItems={totalItems}
        displayedCount={paginatedInvoices.length}
      />

      {successMessage && (
        <SuccessBanner message={successMessage} onClose={clearSuccessMessage} />
      )}

      {errorMessage && <ErrorBanner message={errorMessage} onClose={clearErrorMessage} />}

      <Card>
        <CardHeader className="flex items-center justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="text-lg font-semibold">Historique des factures</CardTitle>
            <p className="text-sm text-muted-foreground">
              {filteredInvoices.length} facture{filteredInvoices.length > 1 ? "s" : ""} affichée
              {filteredInvoices.length > 1 ? "s" : ""}. Téléchargez ou envoyez-les directement.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {!hasInvoices ? (
            hasClientBookings ? (
              <ClientBookingsSection
                bookings={filteredClientBookings}
                viewMode={viewMode}
                onGenerate={handleGenerate}
              />
            ) : (
              <EmptyState type="no-invoices" />
            )
          ) : !hasFilteredInvoices ? (
            hasClientBookings ? (
              <ClientBookingsSection
                bookings={filteredClientBookings}
                viewMode={viewMode}
                onGenerate={handleGenerate}
              />
            ) : (
              <EmptyState type="no-results" />
            )
          ) : viewMode === "grid" ? (
            <InvoicesGridView
              invoices={paginatedInvoices}
              onDownload={handleDownload}
              onSend={handleSend}
              isDownloading={isDownloading}
              isSending={isSending}
              activeDownloadId={activeDownloadId}
              activeSendId={activeSendId}
            />
          ) : (
            <InvoicesListView
              invoices={paginatedInvoices}
              onDownload={handleDownload}
              onSend={handleSend}
              isDownloading={isDownloading}
              isSending={isSending}
              activeDownloadId={activeDownloadId}
              activeSendId={activeSendId}
            />
          )}
        </CardContent>
      </Card>

      <InvoicesPagination
        page={clampedPage}
        totalPages={totalPages}
        totalItems={totalItems}
        limit={itemsPerPage}
        onPageChange={setPage}
      />
    </div>
  );
}
