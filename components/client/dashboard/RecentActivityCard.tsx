"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
import {
  getClientRecentBookingsAction,
  type ClientRecentBooking,
  type ClientRecentBookingsPagination,
  type GetClientRecentBookingsSuccess,
} from "@/actions/client/bookings/get-recent";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  currencyFormatter,
  dateFormatter,
  dateTimeFormatter,
} from "./dashboard-constants";
import { EditBookingDialog } from "./EditBookingDialog";
import { CancelBookingDialog } from "./CancelBookingDialog";
import { BookingStatus } from "@prisma/client";

interface RecentActivityCardProps {
  initialData: GetClientRecentBookingsSuccess;
  cancellationPolicy: string;
}

export function RecentActivityCard({ initialData, cancellationPolicy }: RecentActivityCardProps) {
  const [bookings, setBookings] = useState<ClientRecentBooking[]>(initialData.bookings);
  const [pagination, setPagination] = useState<ClientRecentBookingsPagination>(initialData.pagination);
  const [isError, setIsError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();

  const parsePageFromSearch = (value: string | null): number => {
    if (!value) {
      return 1;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  };

  const currentPageInQuery = parsePageFromSearch(searchParams.get("recentPage"));

  const fetchPage = (page: number) => {
    startTransition(async () => {
      const result = await getClientRecentBookingsAction({ page, limit: pagination.limit });
      if (!result.success || !result.data) {
        setIsError(result.error ?? "Impossible de charger les réservations récentes.");
        return;
      }

      setBookings(result.data.bookings);
      setPagination(result.data.pagination);
      setIsError(null);
    });
  };

  useEffect(() => {
    if (currentPageInQuery !== pagination.page) {
      fetchPage(currentPageInQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageInQuery]);

  const hasPrevious = pagination.hasPrev;
  const hasNext = pagination.hasNext;
  const now = useMemo(() => new Date(), []);

  const handlePageChange = (page: number) => {
    if (page === pagination.page || page < 1) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("recentPage");
    } else {
      params.set("recentPage", page.toString());
    }

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(`/dashboard${newUrl}`, { scroll: false });
    fetchPage(page);
  };

  if (pagination.total === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-muted-foreground">
        Vos réservations récentes apparaîtront ici.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {isError}
        </div>
      ) : null}
      <div className="space-y-3">
        {bookings.map((booking) => {
          const startDate = new Date(booking.startDate);
          const endDate = new Date(booking.endDate);
          const canEdit = startDate > now && booking.derivedStatus !== BookingStatus.PENDING;
          const canCancel =
            startDate > now &&
            !booking.isCancellationPending &&
            (booking.derivedStatus === BookingStatus.PENDING ||
              booking.derivedStatus === BookingStatus.CONFIRMED);

          return (
            <div
              key={booking.id}
              className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {booking.vehicle
                    ? `${booking.vehicle.brand} ${booking.vehicle.model}`
                    : booking.reference}
                </p>
                <p className="text-xs text-muted-foreground">
                  Départ le {dateFormatter.format(startDate)} • Retour le {dateFormatter.format(endDate)}
                </p>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                <Badge className={`${BOOKING_STATUS_COLORS[booking.derivedStatus]} text-[10px]`}>
                  {BOOKING_STATUS_LABELS[booking.derivedStatus]}
                </Badge>
                {booking.isCancellationPending ? (
                  <Badge variant="destructive" className="text-[10px]">
                    Annulation demandée
                  </Badge>
                ) : null}
                {booking.vehicle ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="inline-flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        Détails véhicule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>
                          {booking.vehicle.brand} {booking.vehicle.model}
                        </DialogTitle>
                        <DialogDescription>
                          Informations liées à ce véhicule et à votre réservation.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Marque</p>
                            <p className="font-semibold text-gray-900">{booking.vehicle.brand}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Modèle</p>
                            <p className="font-semibold text-gray-900">{booking.vehicle.model}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Immatriculation
                            </p>
                            <p className="font-semibold text-gray-900">
                              {booking.vehicle.licensePlate}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Statut calculé
                            </p>
                            <Badge className={`${BOOKING_STATUS_COLORS[booking.derivedStatus]} text-[10px]`}>
                              {BOOKING_STATUS_LABELS[booking.derivedStatus]}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Période de location
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {dateTimeFormatter.format(startDate)} → {dateTimeFormatter.format(endDate)}
                          </p>
                        </div>
                        {booking.invoices[0] ? (
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Facture associée
                            </p>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="font-semibold text-gray-900">
                                {booking.invoices[0].invoiceNumber}
                              </span>
                              <Badge
                                className={`${INVOICE_STATUS_COLORS[booking.invoices[0].status]} text-[10px]`}
                              >
                                {INVOICE_STATUS_LABELS[booking.invoices[0].status]}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Montant : {currencyFormatter.format(booking.invoices[0].total)}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : null}
                {canEdit ? (
                  <EditBookingDialog
                    bookingId={booking.id}
                    startDate={booking.startDate}
                    endDate={booking.endDate}
                  />
                ) : null}
                {canCancel ? (
                  <CancelBookingDialog
                    bookingId={booking.id}
                    startDate={booking.startDate}
                    depositPaid={booking.depositPaid ?? 0}
                    cancellationPolicy={cancellationPolicy}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {pagination.totalPages > 1 ? (
        <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Affichage {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} • Page{" "}
            {pagination.page} sur {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!hasPrevious || isPending}
            >
              {isPending && hasPrevious ? "Chargement..." : "Précédent"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!hasNext || isPending}
            >
              {isPending && hasNext ? "Chargement..." : "Suivant"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}


