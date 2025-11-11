"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cancelClientBookingAction } from "@/actions/client/bookings/cancel-booking";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export type CancelBookingDialogProps = {
  bookingId: string;
  startDate: string;
  depositPaid: number;
  cancellationPolicy: string;
  cancellationState?: {
    requested: boolean;
    requestedAt: string | null;
    refundRate: number | null;
  };
};

interface CancelBookingState {
  success: boolean;
  error?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function computeRefundPreview(startDate: string, depositPaid: number) {
  const start = new Date(startDate);
  const now = new Date();

  if (Number.isNaN(start.getTime()) || start <= now) {
    return {
      refundRate: 0,
      refundAmount: 0,
      retainedAmount: depositPaid,
      daysBeforeStart: 0,
      tier: "too-late" as const,
    };
  }

  const hoursBeforeStart = (start.getTime() - now.getTime()) / 3600000;
  const daysBeforeStart = hoursBeforeStart / 24;

  let refundRate = 0;
  let tier: "full" | "partial" | "none";

  if (daysBeforeStart > 7) {
    refundRate = 1;
    tier = "full";
  } else if (daysBeforeStart >= 3) {
    refundRate = 0.5;
    tier = "partial";
  } else {
    refundRate = 0;
    tier = "none";
  }

  const refundAmount = Math.round(depositPaid * refundRate * 100) / 100;
  const retainedAmount = Math.round((depositPaid - refundAmount) * 100) / 100;

  return {
    refundRate,
    refundAmount,
    retainedAmount,
    daysBeforeStart,
    tier,
  };
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="destructive" disabled={pending || disabled}>
      {pending ? "Annulation en cours..." : "Confirmer l'annulation"}
    </Button>
  );
}

export function CancelBookingDialog({
  bookingId,
  startDate,
  depositPaid,
  cancellationPolicy,
  cancellationState,
}: CancelBookingDialogProps) {
  const initialState = useMemo<CancelBookingState>(
    () => ({
      success: false,
      error: undefined,
    }),
    [],
  );
  const [state, action] = useActionState(cancelClientBookingAction, initialState);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const cancellationRequested = cancellationState?.requested ?? false;
  const cancellationRequestedAt = cancellationState?.requestedAt ?? null;
  const cancellationRefundRate = cancellationState?.refundRate ?? null;

  const preview = useMemo(() => {
    if (cancellationRequested && cancellationRefundRate !== null && cancellationRequestedAt) {
      const refundAmount = Math.round(depositPaid * cancellationRefundRate * 100) / 100;
      const retainedAmount = Math.round((depositPaid - refundAmount) * 100) / 100;
      return {
        refundRate: cancellationRefundRate,
        refundAmount,
        retainedAmount,
        daysBeforeStart: 0,
        tier:
          cancellationRefundRate === 1
            ? ("full" as const)
            : cancellationRefundRate === 0.5
            ? ("partial" as const)
            : ("none" as const),
      };
    }
    return computeRefundPreview(startDate, depositPaid);
  }, [startDate, depositPaid, cancellationRequested, cancellationRefundRate, cancellationRequestedAt]);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
    }
  }, [state.success]);

  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  const refundLabel =
    preview.tier === "full"
      ? "Remboursement estimé de 100% de l'acompte"
      : preview.tier === "partial"
      ? "Remboursement estimé de 50% de l'acompte"
      : cancellationRequested
      ? "Remboursement estimé communiqué lors de la demande"
      : "Aucun remboursement estimé";

  const previewClassName = cn(
    "rounded-md border px-3 py-2 text-sm transition-colors",
    preview.tier === "full"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : preview.tier === "partial"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : preview.tier === "too-late"
      ? "border-slate-200 bg-slate-50 text-muted-foreground"
      : "border-rose-200 bg-rose-50 text-rose-700",
  );

  const isValidationDisabled = preview.tier === "too-late" || cancellationRequested;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-rose-600 hover:text-rose-700",
            cancellationRequested ? "opacity-70" : "",
          )}
          aria-disabled={cancellationRequested}
        >
          {cancellationRequested ? "Annulation en attente" : "Annuler la réservation"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {cancellationRequested
              ? "Annulation en cours de validation"
              : "Annuler cette réservation"}
          </DialogTitle>
          <DialogDescription>
            {cancellationRequested
              ? "Votre demande d'annulation a été transmise à l'équipe. Vous serez notifié dès qu'elle sera traitée."
              : "Confirmez l'annulation. Le remboursement appliqué dépendra du délai restant avant le départ ainsi que de la politique indiquée ci-dessous."}
          </DialogDescription>
        </DialogHeader>

        <div className={previewClassName}>
          <p className="font-medium">{refundLabel}</p>
          <p className="mt-1 text-xs">
            Acompte : {formatCurrency(depositPaid)} • Remboursement estimé :{" "}
            {formatCurrency(preview.refundAmount)} • Frais retenus :{" "}
            {formatCurrency(preview.retainedAmount)}
          </p>
        </div>

        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-muted-foreground">
          {cancellationPolicy}
        </div>

        <form action={action} className="space-y-4">
          <input type="hidden" name="bookingId" value={bookingId} />
          {!cancellationRequested ? (
            <>
              <div className="space-y-2">
                <label htmlFor={`reason-${bookingId}`} className="text-sm font-medium text-gray-900">
                  Motif (optionnel)
                </label>
                <Textarea
                  id={`reason-${bookingId}`}
                  name="cancellationReason"
                  placeholder="Expliquez brièvement la raison de votre annulation (500 caractères max)."
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={500}
                  className="min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground">
                  {reason.length}/500 caractères. Cette information aide nos équipes à améliorer le
                  service.
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-muted-foreground">
              Demande envoyée le{" "}
              {cancellationRequestedAt
                ? new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(cancellationRequestedAt))
                : "—"}{" "}
              . Vous pouvez contacter le support si vous souhaitez revenir sur cette annulation.
            </div>
          )}
          {state.error ? <p className="text-sm font-medium text-red-600">{state.error}</p> : null}
          {!cancellationRequested ? (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Revenir en arrière
              </Button>
              <SubmitButton disabled={isValidationDisabled} />
            </div>
          ) : (
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Fermer
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}


