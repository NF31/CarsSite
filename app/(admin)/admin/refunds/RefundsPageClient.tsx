"use client";

import type { RefundListItem } from "@/actions/admin/refunds/get-all-refunds";
import {
  RefundsHeader,
  RefundsStatsCards,
  RefundsFilters,
  RefundsList,
  EmptyState,
  ErrorBanner,
} from "@/components/admin/refunds";
import { useRefundsFilters, useRefundsStats } from "@/components/admin/refunds/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RefundsPageClientProps {
  refunds: RefundListItem[];
  totalRefunded: number;
  error?: string | null;
}

export function RefundsPageClient({ refunds, totalRefunded, error }: RefundsPageClientProps) {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    reasonFilter,
    setReasonFilter,
    filteredRefunds,
  } = useRefundsFilters({ refunds });

  const stats = useRefundsStats({ refunds });

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorBanner message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RefundsHeader />

      <RefundsStatsCards totalRefunded={totalRefunded} stats={stats} />

      <RefundsFilters
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        reasonFilter={reasonFilter}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
        onReasonChange={setReasonFilter}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Remboursements ({filteredRefunds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRefunds.length === 0 ? (
            <EmptyState hasRefunds={refunds.length > 0} />
          ) : (
            <RefundsList refunds={filteredRefunds} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
