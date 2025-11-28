import { useMemo } from "react";
import type { RefundListItem } from "@/actions/admin/refunds/get-all-refunds";

interface UseRefundsStatsProps {
  refunds: RefundListItem[];
}

export function useRefundsStats({ refunds }: UseRefundsStatsProps) {
  const stats = useMemo(() => {
    const completed = refunds.filter((r) => r.status === "COMPLETED").length;
    const pending = refunds.filter((r) => r.status === "PENDING").length;
    const failed = refunds.filter((r) => r.status === "FAILED").length;
    const cancellationRefunds = refunds.filter((r) => r.reason === "cancellation").length;
    const modificationRefunds = refunds.filter((r) => r.reason === "booking_modification").length;

    return {
      total: refunds.length,
      completed,
      pending,
      failed,
      cancellationRefunds,
      modificationRefunds,
    };
  }, [refunds]);

  return stats;
}

