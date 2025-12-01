"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, Clock, CheckCircle2 } from "lucide-react";
import { formatDateTime, formatCurrency, truncateReference } from "../utils/helpers";
import type { NavbarNotificationItem } from "../types";

type NotificationItemProps = {
  booking: NavbarNotificationItem;
  isProcessing: boolean;
  isMarkingAsViewed: boolean;
  activeBookingId: string | null;
  requiresAction: boolean;
  onReject: () => void;
  onApprove: () => void;
  onDismiss: () => void;
  onView: () => void;
};

export function NotificationItem({
  booking,
  isProcessing,
  isMarkingAsViewed,
  activeBookingId,
  requiresAction,
  onReject,
  onApprove,
  onDismiss,
  onView,
}: NotificationItemProps) {
  const isCancellation = booking.type === "cancellation";
  const isPaymentNotification = booking.type === "payment";
  const isModificationPayment = booking.type === "modificationPayment";
  const badgeLabel = isCancellation
    ? "Annulation demandée"
    : isModificationPayment
    ? "Paiement modification reçu"
    : isPaymentNotification
    ? "Paiement reçu"
    : "Validation requise";

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{booking.userName}</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {truncateReference(booking.reference)}
            </Badge>
            <Badge
              variant={isCancellation ? "destructive" : "secondary"}
              className={`text-[10px] ${
                isPaymentNotification ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : ""
              }`}
            >
              {badgeLabel}
            </Badge>
          </div>
          {booking.userEmail ? (
            <p className="text-xs text-muted-foreground">{booking.userEmail}</p>
          ) : null}
        </div>
        <Link
          href={`/admin/bookings/${booking.id}`}
          className="text-xs text-primary underline-offset-2 hover:underline disabled:opacity-50"
          onClick={onView}
        >
          {isMarkingAsViewed && activeBookingId === booking.id ? "Marquage..." : "Voir"}
        </Link>
      </div>
      <div className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
        <div className="flex items-center gap-2 font-medium text-gray-900">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          Période demandée
        </div>
        <p className="mt-1">
          {formatDateTime(booking.startDate)} → {formatDateTime(booking.endDate)}
        </p>
        <p className="mt-1 text-muted-foreground">
          {booking.vehicleLabel}
          {booking.vehiclePlate ? ` • ${booking.vehiclePlate}` : ""}
        </p>
      </div>
      {isCancellation ? (
        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <p className="font-semibold">Annulation à valider</p>
          {booking.cancellationRequestedAt ? (
            <p>Demandée le {formatDateTime(booking.cancellationRequestedAt)}</p>
          ) : null}
          {booking.cancellationReason ? (
            <p className="mt-1 italic text-rose-800">« {booking.cancellationReason} »</p>
          ) : null}
          <p className="mt-1">
            Acompte : {formatCurrency(booking.depositPaid)}.
            {booking.cancellationRefundRate === 1
              ? " Remboursement estimé : 100%."
              : booking.cancellationRefundRate === 0.5
              ? " Remboursement estimé : 50%."
              : " Aucun remboursement estimé."}
          </p>
        </div>
      ) : isModificationPayment ? (
        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          <p className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Paiement supplémentaire de modification confirmé
          </p>
          <p className="mt-1">
            Le client a effectué le paiement supplémentaire pour la modification de dates.
          </p>
          <p className="mt-1">Acompte total payé : {formatCurrency(booking.depositPaid)}.</p>
          <p className="mt-1 text-blue-700">
            La réservation est confirmée avec les nouvelles dates, aucune action requise.
          </p>
        </div>
      ) : isPaymentNotification ? (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <p className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Paiement confirmé automatiquement
          </p>
          <p className="mt-1">Acompte reçu : {formatCurrency(booking.depositPaid)}.</p>
          <p className="mt-1 text-emerald-700">
            La réservation est déjà confirmée, aucune action requise.
          </p>
        </div>
      ) : null}
      {requiresAction ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={isProcessing || activeBookingId !== null}
            onClick={onReject}
            className="inline-flex items-center gap-1"
          >
            {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            {booking.type === "cancellation" ? "Rejeter la demande" : "Refuser"}
          </Button>
          <Button
            size="sm"
            disabled={isProcessing || activeBookingId !== null}
            onClick={onApprove}
            className="inline-flex items-center gap-1"
          >
            {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {booking.type === "cancellation" ? "Confirmer l'annulation" : "Valider"}
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            onClick={onDismiss}
            disabled={isMarkingAsViewed && activeBookingId === booking.id}
          >
            {isMarkingAsViewed && activeBookingId === booking.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {isMarkingAsViewed && activeBookingId === booking.id ? "Marquage..." : "Marquer comme lu"}
          </Button>
        </div>
      )}
    </div>
  );
}

