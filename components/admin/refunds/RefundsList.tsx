import { memo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, User, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bookingCurrencyFormatter } from "@/components/admin/bookings/booking-helpers";
import type { RefundListItem } from "@/actions/admin/refunds/get-all-refunds";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  COMPLETED: "Complété",
  PENDING: "En attente",
  FAILED: "Échoué",
  CANCELLED: "Annulé",
};

const statusColors: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
};

const reasonLabels: Record<string, string> = {
  cancellation: "Annulation",
  booking_modification: "Modification de dates",
  other: "Autre",
};

interface RefundsListProps {
  refunds: RefundListItem[];
}

export const RefundsList = memo(function RefundsList({ refunds }: RefundsListProps) {
  if (refunds.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {refunds.map((refund) => {
        const reasonLabel =
          refund.reason && reasonLabels[refund.reason]
            ? reasonLabels[refund.reason]
            : "Autre";

        return (
          <div
            key={refund.id}
            className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className={cn(
                          "h-4 w-4",
                          refund.status === "COMPLETED"
                            ? "text-green-600"
                            : refund.status === "PENDING"
                            ? "text-amber-600"
                            : "text-red-600"
                        )}
                      />
                      <h3 className="text-sm font-semibold text-gray-900">
                        {bookingCurrencyFormatter.format(refund.amount)}
                      </h3>
                      <Badge
                        className={cn(
                          "text-xs",
                          statusColors[refund.status] || "bg-gray-100 text-gray-800"
                        )}
                      >
                        {statusLabels[refund.status] || refund.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {reasonLabel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <Link
                        href={`/admin/bookings/${refund.bookingId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {refund.bookingReference}
                      </Link>
                      <span>•</span>
                      <span>
                        {format(new Date(refund.createdAt), "dd MMM yyyy 'à' HH:mm", {
                          locale: fr,
                        })}
                      </span>
                      {refund.transactionId && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[10px]">
                            {refund.transactionId.substring(0, 20)}...
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informations sur la réservation */}
                {refund.booking && (
                  <div className="grid gap-3 md:grid-cols-2 text-sm">
                    {refund.booking.user && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{refund.booking.user.name}</span>
                        {refund.booking.user.email && (
                          <span className="text-xs text-muted-foreground">
                            ({refund.booking.user.email})
                          </span>
                        )}
                      </div>
                    )}
                    {refund.booking.vehicle && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {refund.booking.vehicle.brand} {refund.booking.vehicle.model}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({refund.booking.vehicle.licensePlate})
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Information sur remboursement partiel */}
                {refund.metadata?.isPartialRefund && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-2">
                    <p className="text-xs text-amber-800">
                      ⚠️ Remboursement partiel :{" "}
                      {bookingCurrencyFormatter.format(
                        refund.metadata.effectiveRefundAmount || refund.amount
                      )}{" "}
                      sur{" "}
                      {bookingCurrencyFormatter.format(
                        refund.metadata.requestedAmount || refund.amount
                      )}{" "}
                      demandé
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild className="shrink-0">
                  <Link href={`/admin/bookings/${refund.bookingId}`}>
                    Voir la réservation
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

