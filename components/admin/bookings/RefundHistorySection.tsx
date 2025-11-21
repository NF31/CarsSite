"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle2, History, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getRefundHistoryAction, type RefundHistoryItem } from "@/actions/admin/bookings";
import { bookingCurrencyFormatter } from "@/components/admin/bookings/booking-helpers";

interface RefundHistorySectionProps {
  bookingId: string;
}

export function RefundHistorySection({ bookingId }: RefundHistorySectionProps) {
  const [refunds, setRefunds] = useState<RefundHistoryItem[]>([]);
  const [totalRefunded, setTotalRefunded] = useState<number>(0);
  const [refundableAmount, setRefundableAmount] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRefundHistory() {
      setIsLoading(true);
      setError(null);

      try {
        console.log("[RefundHistorySection] 🔄 Chargement de l'historique des remboursements pour bookingId:", bookingId);
        const result = await getRefundHistoryAction(bookingId);
        console.log("[RefundHistorySection] ✅ Résultat:", result);

        if (result.success) {
          setRefunds(result.refunds || []);
          setTotalRefunded(result.totalRefunded || 0);
          setRefundableAmount(result.refundableAmount);
          console.log("[RefundHistorySection] ✅ Données chargées:", {
            refundsCount: result.refunds?.length || 0,
            totalRefunded: result.totalRefunded || 0,
            refundableAmount: result.refundableAmount,
          });
        } else {
          setError(result.error || "Impossible de charger l'historique des remboursements.");
          console.error("[RefundHistorySection] ❌ Erreur:", result.error);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue lors du chargement de l'historique.";
        setError(errorMessage);
        console.error("[RefundHistorySection] ❌ Erreur lors du chargement:", err);
      }

      setIsLoading(false);
    }

    fetchRefundHistory();
  }, [bookingId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-muted-foreground" />
            Historique des remboursements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-muted-foreground" />
            Historique des remboursements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const hasRefunds = refunds.length > 0;
  const isFullyRefunded = refundableAmount !== undefined && refundableAmount <= 0 && hasRefunds;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-muted-foreground" />
          Historique des remboursements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avertissement si complètement remboursé */}
        {isFullyRefunded && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ Attention :</strong> Le Payment Intent a déjà été complètement remboursé. 
              Le montant remboursable disponible est de {bookingCurrencyFormatter.format(refundableAmount)}. 
              Aucun remboursement supplémentaire n&apos;est possible.
            </AlertDescription>
          </Alert>
        )}

        {/* Avertissement si partiellement remboursé */}
        {refundableAmount !== undefined && refundableAmount > 0 && refundableAmount < totalRefunded && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>ℹ️ Information :</strong> Le Payment Intent a déjà été partiellement remboursé. 
              Le montant remboursable restant est de {bookingCurrencyFormatter.format(refundableAmount)}.
            </AlertDescription>
          </Alert>
        )}

        {/* Résumé */}
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Total remboursé</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookingCurrencyFormatter.format(totalRefunded)}
              </p>
            </div>
            {refundableAmount !== undefined && (
              <div className="space-y-1 text-right">
                <p className="text-sm font-medium text-gray-600">Montant remboursable restant</p>
                <p className={`text-2xl font-bold ${refundableAmount <= 0 ? "text-red-600" : "text-green-600"}`}>
                  {bookingCurrencyFormatter.format(Math.max(0, refundableAmount))}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Liste des remboursements */}
        {hasRefunds ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Remboursements effectués ({refunds.length})
            </h3>
            <div className="space-y-2">
              {refunds.map((refund) => {
                const reasonLabel =
                  refund.reason === "cancellation"
                    ? "Annulation"
                    : refund.reason === "booking_modification"
                    ? "Modification de dates"
                    : "Autre";

                return (
                  <div
                    key={refund.id}
                    className="rounded-md border border-gray-200 bg-white p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <p className="text-sm font-semibold text-gray-900">
                            {bookingCurrencyFormatter.format(refund.amount)}
                          </p>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs font-medium text-gray-600">{reasonLabel}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {format(new Date(refund.createdAt), "dd MMM yyyy 'à' HH:mm", {
                              locale: fr,
                            })}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{refund.status.toLowerCase()}</span>
                          {refund.transactionId && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px]">
                                {refund.transactionId.substring(0, 20)}...
                              </span>
                            </>
                          )}
                        </div>
                        {refund.metadata?.isPartialRefund && (
                          <p className="text-xs text-amber-600 mt-1">
                            ⚠️ Remboursement partiel : {bookingCurrencyFormatter.format(refund.metadata.effectiveRefundAmount || refund.amount)} 
                            sur {bookingCurrencyFormatter.format(refund.metadata.requestedAmount || refund.amount)} demandé
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">Aucun remboursement effectué</p>
            <p className="text-xs text-gray-500 mt-1">
              Aucun remboursement n&apos;a encore été effectué pour cette réservation.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

