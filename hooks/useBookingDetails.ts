import { useMemo, useState, useTransition, useEffect } from "react";
import { format, formatDistanceStrict } from "date-fns";
import { fr } from "date-fns/locale";
import { getDriverLicenseUrlAction } from "@/actions/admin/bookings";
import { deriveBookingStatus } from "@/lib/booking-status-sync";
import { BookingStatus } from "@prisma/client";
import type { BookingDetail } from "@/actions/admin/bookings";
import { formatDateTime } from "@/components/admin/bookings/details/utils";

interface UseBookingDetailsProps {
  booking: BookingDetail;
}

export function useBookingDetails({ booking }: UseBookingDetailsProps) {
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [isLicensePending, startLicenseTransition] = useTransition();

  useEffect(() => {
    if (!isLicensePending) {
      const timeoutId = setTimeout(() => {
        setLicenseError(null);
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [isLicensePending]);

  const computedStatus = useMemo(() => {
    return deriveBookingStatus({
      status: booking.status,
      startDate: booking.startDate,
      endDate: booking.endDate,
      cancellationRequested: booking.cancellationRequested ?? false,
      modificationRequested: booking.modificationRequested ?? false,
      modificationDepositDifference: booking.modificationDepositDifference ?? null,
    });
  }, [booking]);

  const startDateLabel = useMemo(() => formatDateTime(booking.startDate), [booking.startDate]);
  const endDateLabel = useMemo(() => formatDateTime(booking.endDate), [booking.endDate]);
  const createdAtLabel = useMemo(() => formatDateTime(booking.createdAt), [booking.createdAt]);
  const updatedAtLabel = useMemo(() => formatDateTime(booking.updatedAt), [booking.updatedAt]);

  const durationLabel = useMemo(
    () =>
      formatDistanceStrict(new Date(booking.startDate), new Date(booking.endDate), {
        locale: fr,
      }),
    [booking.startDate, booking.endDate]
  );

  const timelineMessage = useMemo(() => {
    const now = new Date();
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);

    if (computedStatus === BookingStatus.CANCELLED) {
      return {
        label: "Réservation annulée",
        tone: "danger" as const,
        helper: `Annulée avant le ${endDateLabel}`,
      };
    }

    if (computedStatus === BookingStatus.COMPLETED) {
      return {
        label: "Trajet terminé",
        tone: "muted" as const,
        helper: `Clôturé le ${endDateLabel}`,
      };
    }

    if (computedStatus === BookingStatus.IN_PROGRESS) {
      return {
        label: "Trajet en cours",
        tone: "success" as const,
        helper: `Se termine dans ${formatDistanceStrict(now, end, { locale: fr })}`,
      };
    }

    return {
      label: "Trajet à venir",
      tone: "info" as const,
      helper: `Débute dans ${formatDistanceStrict(now, start, { locale: fr })}`,
    };
  }, [booking.startDate, booking.endDate, computedStatus, endDateLabel]);

  const canEdit = useMemo(() => {
    if (booking.status === BookingStatus.CANCELLED) {
      return false;
    }

    const now = new Date();
    return new Date(booking.startDate) > now && new Date(booking.endDate) > now;
  }, [booking.status, booking.startDate, booking.endDate]);

  const lastLicenseUploadLabel = useMemo(() => {
    if (!booking.user.driverLicenseLastUploadedAt) {
      return null;
    }
    return formatDateTime(booking.user.driverLicenseLastUploadedAt);
  }, [booking.user.driverLicenseLastUploadedAt]);

  const handleViewLicense = () => {
    if (!booking.user.hasDriverLicense || isLicensePending) {
      return;
    }

    startLicenseTransition(async () => {
      setLicenseError(null);
      const result = await getDriverLicenseUrlAction({
        userId: booking.user.id,
      });

      if (!result.success || !result.data) {
        setLicenseError(result.error ?? "Impossible de récupérer le permis pour ce client.");
        return;
      }

      window.open(result.data.url, "_blank", "noopener,noreferrer");
    });
  };

  return {
    computedStatus,
    startDateLabel,
    endDateLabel,
    createdAtLabel,
    updatedAtLabel,
    durationLabel,
    timelineMessage,
    canEdit,
    lastLicenseUploadLabel,
    licenseError,
    isLicensePending,
    handleViewLicense,
  };
}

