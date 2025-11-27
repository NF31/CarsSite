"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { bookingCurrencyFormatter, BOOKING_STATUS_LABELS } from "@/components/admin/bookings/booking-helpers";
import { cn } from "@/lib/utils";
import type { BookingDetail } from "@/actions/admin/bookings";
import { formatDateTime } from "./utils";

interface ModerationAlertProps {
  booking: BookingDetail;
  isModificationRequest: boolean;
  isCancellationRequest: boolean;
}

export function ModerationAlert({
  booking,
  isModificationRequest,
  isCancellationRequest,
}: ModerationAlertProps) {
  if (!isModificationRequest && !isCancellationRequest) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Cette réservation est en attente de validation. Utilisez les boutons ci-dessus pour valider ou refuser.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {isModificationRequest ? (
          <>
            <strong>📅 Demande de modification de dates du client</strong>
            <br />
            Le client a demandé la modification des dates de cette réservation.
            {booking.modificationRequestedAt && (
              <>
                <br />
                <strong>Demandée le :</strong> {formatDateTime(booking.modificationRequestedAt)}
              </>
            )}

            {/* Informations de modification */}
            {booking.originalStartDate && booking.originalEndDate && booking.originalTotalPrice !== null && (
              <>
                <br />
                <br />
                <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3">
                  <strong className="text-blue-900">📊 Comparaison des dates et prix :</strong>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-blue-800 font-semibold mb-1">Dates originales :</p>
                        <p className="text-blue-900">
                          {formatDateTime(booking.originalStartDate)} → {formatDateTime(booking.originalEndDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-800 font-semibold mb-1">Nouvelles dates :</p>
                        <p className="text-blue-900 font-semibold">
                          {formatDateTime(booking.startDate)} → {formatDateTime(booking.endDate)}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-blue-200 pt-2 mt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-blue-800 font-semibold mb-1">Prix original :</p>
                          <p className="text-blue-900">
                            {bookingCurrencyFormatter.format(booking.originalTotalPrice)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-800 font-semibold mb-1">Nouveau prix :</p>
                          <p className="text-blue-900 font-semibold">
                            {bookingCurrencyFormatter.format(booking.totalPrice)}
                          </p>
                        </div>
                      </div>
                      {booking.originalTotalPrice !== booking.totalPrice && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-blue-800 font-semibold">Différence de prix :</span>
                            <span
                              className={cn(
                                "font-bold",
                                booking.totalPrice > booking.originalTotalPrice
                                  ? "text-amber-700"
                                  : "text-green-700"
                              )}
                            >
                              {booking.totalPrice > booking.originalTotalPrice ? "+" : ""}
                              {bookingCurrencyFormatter.format(booking.totalPrice - booking.originalTotalPrice)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Détails du remboursement/paiement */}
            {booking.modificationDepositDifference !== null && booking.originalDepositPaid !== null && (
              <>
                <br />
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                  <strong className="text-amber-900">💰 Détails du remboursement/paiement :</strong>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-amber-800">Acompte payé (original) :</span>
                      <span className="font-semibold text-amber-900">
                        {bookingCurrencyFormatter.format(booking.originalDepositPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-800">Nouvel acompte (30%) :</span>
                      <span className="font-semibold text-amber-900">
                        {bookingCurrencyFormatter.format(booking.depositPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-amber-200 pt-1 mt-1">
                      <span className="text-amber-800">Différence d&apos;acompte :</span>
                      <span
                        className={cn(
                          "font-semibold",
                          booking.modificationDepositDifference > 0 ? "text-red-700" : "text-green-700"
                        )}
                      >
                        {booking.modificationDepositDifference > 0 ? "+" : ""}
                        {bookingCurrencyFormatter.format(booking.modificationDepositDifference)}
                      </span>
                    </div>
                    {booking.modificationDepositDifference < 0 && (
                      <p className="text-xs text-green-700 mt-2 italic">
                        ✅ Un remboursement de{" "}
                        {bookingCurrencyFormatter.format(Math.abs(booking.modificationDepositDifference))} sera
                        effectué automatiquement via Stripe.
                      </p>
                    )}
                    {booking.modificationDepositDifference > 0 && (
                      <p className="text-xs text-amber-700 mt-2 italic">
                        💳 Un paiement supplémentaire de{" "}
                        {bookingCurrencyFormatter.format(booking.modificationDepositDifference)} sera demandé au
                        client (seulement la différence, pas le nouvel acompte en entier).
                        {booking.securityDepositPaid > 0 && (
                          <span className="block mt-1">
                            ℹ️ La caution de garantie ({bookingCurrencyFormatter.format(booking.securityDepositPaid)})
                            a déjà été payée et ne sera pas redemandée.
                          </span>
                        )}
                      </p>
                    )}
                    {booking.modificationDepositDifference === 0 && (
                      <p className="text-xs text-blue-700 mt-2 italic">
                        ℹ️ Aucun remboursement ni paiement supplémentaire nécessaire.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            <br />
            <br />
            <strong>Actions possibles :</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>
                <strong>Valider la modification</strong> : Les nouvelles dates seront confirmées.{" "}
                {booking.modificationDepositDifference !== null && booking.modificationDepositDifference < 0
                  ? `Un remboursement de ${bookingCurrencyFormatter.format(Math.abs(booking.modificationDepositDifference))} sera effectué automatiquement via Stripe.`
                  : booking.modificationDepositDifference !== null && booking.modificationDepositDifference > 0
                    ? `Une session de paiement de ${bookingCurrencyFormatter.format(booking.modificationDepositDifference)} sera créée pour le client.`
                    : "Aucun remboursement ni paiement supplémentaire ne sera nécessaire."}
              </li>
              <li>
                <strong>Refuser la modification</strong> : Les dates originales seront restaurées et la réservation
                repassera en statut{" "}
                {booking.cancellationPreviousStatus
                  ? BOOKING_STATUS_LABELS[booking.cancellationPreviousStatus]
                  : "CONFIRMED"}
                . Aucun remboursement ni paiement ne sera effectué.
              </li>
            </ul>
          </>
        ) : (
          <>
            <strong>⚠️ Demande d&apos;annulation du client</strong>
            <br />
            Le client a demandé l&apos;annulation de cette réservation.
            {booking.cancellationPreviousStatus && (
              <>
                <br />
                <strong>Statut actuel :</strong> {BOOKING_STATUS_LABELS[booking.status]} (en attente)
                <br />
                <strong>Statut précédent :</strong> {BOOKING_STATUS_LABELS[booking.cancellationPreviousStatus]} (sera
                restauré si vous conservez la réservation)
              </>
            )}
            {booking.cancellationReason && (
              <>
                <br />
                <strong>Raison de l&apos;annulation :</strong> {booking.cancellationReason}
              </>
            )}

            {/* Informations de remboursement */}
            {booking.depositPaid > 0 && booking.cancellationRequestedRefundRate !== null && (
              <>
                <br />
                <br />
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                  <strong className="text-amber-900">💰 Détails du remboursement :</strong>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-amber-800">Acompte payé :</span>
                      <span className="font-semibold text-amber-900">
                        {bookingCurrencyFormatter.format(booking.depositPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-800">Taux de remboursement :</span>
                      <span className="font-semibold text-amber-900">
                        {(booking.cancellationRequestedRefundRate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-amber-200 pt-1 mt-1">
                      <span className="text-amber-800">Montant à rembourser :</span>
                      <span className="font-semibold text-green-700">
                        {bookingCurrencyFormatter.format(
                          Math.round(booking.depositPaid * booking.cancellationRequestedRefundRate * 100) / 100
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-800">Frais retenus :</span>
                      <span className="font-semibold text-red-700">
                        {bookingCurrencyFormatter.format(
                          Math.round(
                            (booking.depositPaid - booking.depositPaid * booking.cancellationRequestedRefundRate) *
                              100
                          ) / 100
                        )}
                      </span>
                    </div>
                    {booking.cancellationRequestedRefundRate === 0 && (
                      <p className="text-xs text-amber-700 mt-2 italic">
                        ⚠️ Aucun remboursement ne sera effectué selon la politique d&apos;annulation.
                      </p>
                    )}
                    {booking.cancellationRequestedRefundRate === 1 && (
                      <p className="text-xs text-green-700 mt-2 italic">
                        ✅ Remboursement intégral de l&apos;acompte.
                      </p>
                    )}
                    {booking.cancellationRequestedRefundRate === 0.5 && (
                      <p className="text-xs text-amber-700 mt-2 italic">
                        ℹ️ Remboursement partiel de 50% de l&apos;acompte.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            <br />
            <br />
            <strong>Actions possibles :</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>
                <strong>Conserver la réservation</strong> : La réservation sera restaurée à son statut précédent (
                {booking.cancellationPreviousStatus
                  ? BOOKING_STATUS_LABELS[booking.cancellationPreviousStatus]
                  : "CONFIRMED"}
                ) et les dates seront conservées. Aucun remboursement ne sera effectué.
              </li>
              <li>
                <strong>Accepter l&apos;annulation</strong> : La réservation sera annulée et les dates seront libérées.{" "}
                {booking.depositPaid > 0 &&
                booking.cancellationRequestedRefundRate !== null &&
                booking.cancellationRequestedRefundRate > 0
                  ? `Un remboursement de ${bookingCurrencyFormatter.format(Math.round(booking.depositPaid * booking.cancellationRequestedRefundRate * 100) / 100)} sera effectué automatiquement.`
                  : "Aucun remboursement ne sera effectué."}
              </li>
            </ul>
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}

