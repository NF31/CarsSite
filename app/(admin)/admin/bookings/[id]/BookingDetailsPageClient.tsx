"use client";

import { useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { BookingStatus } from "@prisma/client";
import type { BookingDetail } from "@/actions/admin/bookings";
import { RefundHistorySection } from "@/components/admin/bookings/RefundHistorySection";
import {
  BookingHeader,
  ModerationAlert,
  BookingPeriodCard,
  BookingClientCard,
  BookingServicesCard,
  BookingFinancialCard,
  BookingVehicleCard,
  BookingHistoryCard,
  BookingNotesCard,
  RejectionDialog,
} from "@/components/admin/bookings/details";
import { useBookingDetails } from "@/hooks/useBookingDetails";
import { useBookingModeration } from "@/hooks/useBookingModeration";

interface BookingDetailsPageClientProps {
  booking: BookingDetail;
}

export function BookingDetailsPageClient({ booking }: BookingDetailsPageClientProps) {
  // Logger les changements de props booking
  useEffect(() => {
    console.log(`[BookingDetailsPageClient] 📦 Props booking mises à jour:`, {
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      modificationRequested: booking.modificationRequested,
      modificationDepositDifference: booking.modificationDepositDifference,
      updatedAt: booking.updatedAt,
    });
  }, [
    booking.id,
    booking.reference,
    booking.status,
    booking.modificationRequested,
    booking.modificationDepositDifference,
    booking.updatedAt,
  ]);

  // Utiliser les hooks personnalisés pour la logique
  const bookingDetails = useBookingDetails({ booking });
  const moderation = useBookingModeration({ booking });

  // Calculs dérivés
  const needsValidation = bookingDetails.computedStatus === BookingStatus.PENDING;
  const isCancellationRequest = booking.cancellationRequested === true;
  const isModificationRequest = booking.modificationRequested === true;

  return (
    <div className="space-y-6">
      <BookingHeader
        booking={booking}
        computedStatus={bookingDetails.computedStatus}
        canEdit={bookingDetails.canEdit}
        needsValidation={needsValidation}
        isCancellationRequest={isCancellationRequest}
        isProcessing={moderation.isProcessing}
        activeModeration={moderation.activeModeration}
        createdAtLabel={bookingDetails.createdAtLabel}
        updatedAtLabel={bookingDetails.updatedAtLabel}
        onModeration={moderation.handleModeration}
      />

      {moderation.moderationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{moderation.moderationError}</AlertDescription>
        </Alert>
      )}

      {needsValidation && (
        <ModerationAlert
          booking={booking}
          isModificationRequest={isModificationRequest}
          isCancellationRequest={isCancellationRequest}
        />
      )}

      <RefundHistorySection bookingId={booking.id} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <div className="space-y-6 min-w-0">
          <BookingPeriodCard
            booking={booking}
            startDateLabel={bookingDetails.startDateLabel}
            endDateLabel={bookingDetails.endDateLabel}
            durationLabel={bookingDetails.durationLabel}
            timelineMessage={bookingDetails.timelineMessage}
          />

          <BookingClientCard
            booking={booking}
            lastLicenseUploadLabel={bookingDetails.lastLicenseUploadLabel}
            isLicensePending={bookingDetails.isLicensePending}
            licenseError={bookingDetails.licenseError}
            onViewLicense={bookingDetails.handleViewLicense}
          />

          <BookingNotesCard notes={booking.notes || ""} />

          <BookingServicesCard booking={booking} />
        </div>

        <div className="space-y-6 xl:space-y-4 min-w-0">
          <BookingFinancialCard booking={booking} />

          <BookingVehicleCard booking={booking} />

          <BookingHistoryCard
            createdAtLabel={bookingDetails.createdAtLabel}
            updatedAtLabel={bookingDetails.updatedAtLabel}
          />
        </div>
      </div>

      <RejectionDialog
        open={moderation.rejectionDialogOpen}
        onOpenChange={moderation.setRejectionDialogOpen}
        rejectionReason={moderation.rejectionReason}
        onRejectionReasonChange={moderation.setRejectionReason}
        isCancellationRequest={isCancellationRequest}
        isModerating={moderation.isModerating}
        onConfirm={moderation.handleRejectionConfirm}
      />
    </div>
  );
}


