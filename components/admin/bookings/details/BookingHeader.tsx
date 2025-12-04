"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Loader2, CheckCircle2, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
} from "@/components/admin/bookings/booking-helpers";
import { BookingStatus } from "@/lib/types/booking-status";
import type { BookingDetail } from "@/actions/admin/bookings";

interface BookingHeaderProps {
  booking: BookingDetail;
  computedStatus: BookingStatus;
  canEdit: boolean;
  needsValidation: boolean;
  isCancellationRequest: boolean;
  isProcessing: boolean;
  activeModeration: string | null;
  createdAtLabel: string;
  updatedAtLabel: string;
  onModeration: (action: "approve" | "reject") => void;
}

export function BookingHeader({
  booking,
  computedStatus,
  canEdit,
  needsValidation,
  isCancellationRequest,
  isProcessing,
  activeModeration,
  createdAtLabel,
  updatedAtLabel,
  onModeration,
}: BookingHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="flex items-start gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="mt-1"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Retour</span>
        </Button>
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 break-words">
              Réservation {booking.reference}
            </h1>
            <Badge className={cn("text-xs font-medium", BOOKING_STATUS_COLORS[computedStatus])}>
              {BOOKING_STATUS_LABELS[computedStatus]}
            </Badge>
            {!canEdit && (
              <Badge
                variant="outline"
                className="text-xs bg-amber-50 text-amber-700 border-amber-200"
              >
                Modification indisponible
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Créée le {createdAtLabel} • Dernière mise à jour le {updatedAtLabel}
          </p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto">
        {needsValidation ? (
          <>
            {isCancellationRequest ? (
              <>
                <Button
                  variant="default"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => onModeration("reject")}
                  className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white"
                >
                  {isProcessing && activeModeration === "reject" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Conserver la réservation
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => onModeration("approve")}
                  className="w-full md:w-auto"
                >
                  {isProcessing && activeModeration === "approve" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <X className="mr-2 h-4 w-4" />
                  )}
                  Accepter l&apos;annulation
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => onModeration("reject")}
                  className="w-full md:w-auto"
                >
                  {isProcessing && activeModeration === "reject" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <X className="mr-2 h-4 w-4" />
                  )}
                  Refuser
                </Button>
                <Button
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => onModeration("approve")}
                  className="w-full md:w-auto"
                >
                  {isProcessing && activeModeration === "approve" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Valider
                    </>
                  )}
                </Button>
              </>
            )}
          </>
        ) : canEdit ? (
          <Link href={`/admin/bookings/edit/${booking.id}`} className="w-full md:w-auto">
            <Button className="w-full md:w-auto">
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          </Link>
        ) : (
          <Button className="w-full md:w-auto" variant="secondary" disabled>
            <Edit className="mr-2 h-4 w-4" />
            Modifier indisponible
          </Button>
        )}
      </div>
    </div>
  );
}

