type ResolvedSearchParams = Record<string, string | string[] | undefined>;
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createDefaultAdminSettings } from "@/actions/admin/settings/shared";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  currencyFormatter,
  dateFormatter,
  dateTimeFormatter,
} from "@/components/client/dashboard/dashboard-constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditBookingDialog } from "@/components/client/dashboard/EditBookingDialog";
import { CancelBookingDialog } from "@/components/client/dashboard/CancelBookingDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info, Calendar, Clock, History, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import { ClientBreadcrumbs } from "@/components/client/Breadcrumbs";

export const dynamic = "force-dynamic";

function deriveBookingStatus(
  start: Date,
  end: Date,
  status: BookingStatus,
  now: Date,
): BookingStatus {
  if (status === BookingStatus.CANCELLED) {
    return BookingStatus.CANCELLED;
  }

  if (end <= now) {
    return BookingStatus.COMPLETED;
  }

  if (start <= now && now < end) {
    return BookingStatus.IN_PROGRESS;
  }

  return status;
}

type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | Promise<Record<string, string | string[] | undefined>>
  | undefined;

type ClientReservationsPageProps = {
  searchParams?: SearchParamsInput;
};

const HISTORY_PAGE_SIZE = 5;

function parsePageParam(param: string | string[] | undefined): number {
  if (Array.isArray(param)) {
    if (param.length === 0) {
      return 1;
    }
    return parsePageParam(param[0]);
  }

  if (!param) {
    return 1;
  }

  const parsed = Number.parseInt(param, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return 1;
  }

  return parsed;
}

export default async function ClientReservationsPage({ searchParams }: ClientReservationsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [bookings, cancellationPolicySetting] = await Promise.all([
    prisma.booking.findMany({
      where: { userId },
      include: {
        vehicle: {
          select: {
            brand: true,
            model: true,
            licensePlate: true,
          },
        },
        pickupLocation: {
          select: {
            name: true,
            city: true,
            address: true,
          },
        },
        returnLocation: {
          select: {
            name: true,
            city: true,
            address: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
          },
          orderBy: {
            issuedAt: "desc",
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    }),
    prisma.setting.findUnique({
      where: { key: "config.cancellationPolicy" },
      select: { value: true },
    }),
  ]);

  const defaultSettings = createDefaultAdminSettings();
  const cancellationPolicy =
    typeof cancellationPolicySetting?.value === "string"
      ? cancellationPolicySetting.value
      : defaultSettings.configuration.cancellationPolicy;

  const now = new Date();

  // Récupérer les services pour toutes les réservations
  const allServiceIds = new Set<string>();
  bookings.forEach((booking) => {
    booking.serviceIds.forEach((id) => allServiceIds.add(id));
  });

  const servicesMap = new Map<string, { id: string; name: string; price: number }>();
  if (allServiceIds.size > 0) {
    const services = await prisma.service.findMany({
      where: {
        id: {
          in: Array.from(allServiceIds),
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });
    services.forEach((service) => {
      servicesMap.set(service.id, service);
    });
  }

  const derivedBookings = bookings.map((booking) => {
    const derivedStatus = deriveBookingStatus(
      booking.startDate,
      booking.endDate,
      booking.status,
      now,
    );

    return {
      ...booking,
      startDateISO: booking.startDate.toISOString(),
      endDateISO: booking.endDate.toISOString(),
      derivedStatus,
      isCancellationPending: booking.cancellationRequested ?? false,
      cancellationRequestedAtISO: booking.cancellationRequestedAt
        ? booking.cancellationRequestedAt.toISOString()
        : null,
      cancellationRequestedRefundRate: booking.cancellationRequestedRefundRate ?? null,
      depositPaid: booking.depositPaid ?? 0,
    };
  });

  const upcomingBookings = derivedBookings
    .filter(
      (booking) =>
        booking.startDate > now &&
        booking.derivedStatus !== BookingStatus.CANCELLED &&
        booking.derivedStatus !== BookingStatus.IN_PROGRESS,
    )
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const inProgressBookings = derivedBookings
    .filter((booking) => booking.derivedStatus === BookingStatus.IN_PROGRESS)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const pastBookings = derivedBookings
    .filter(
      (booking) =>
        booking.derivedStatus === BookingStatus.COMPLETED ||
        booking.derivedStatus === BookingStatus.CANCELLED,
    )
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

  const totalUpcoming = upcomingBookings.length;
  const totalInProgress = inProgressBookings.length;
  const totalPast = pastBookings.length;
  const totalBookings = derivedBookings.length;

  const resolvedSearchParams: ResolvedSearchParams = await (async () => {
    if (!searchParams) {
      return {};
    }

    if (searchParams instanceof URLSearchParams) {
      return Object.fromEntries(searchParams.entries()) as ResolvedSearchParams;
    }

    if (searchParams instanceof Promise) {
      const awaited = await searchParams;
      return (awaited ?? {}) as ResolvedSearchParams;
    }

    return searchParams as ResolvedSearchParams;
  })();

  const historyPageParam = resolvedSearchParams.historyPage;
  const requestedHistoryPage = parsePageParam(historyPageParam);
  const totalHistoryPages = Math.max(1, Math.ceil(totalPast / HISTORY_PAGE_SIZE));
  const historyPage = Math.min(requestedHistoryPage, totalHistoryPages);
  const historyStartIndex = (historyPage - 1) * HISTORY_PAGE_SIZE;
  const historyPageBookings = pastBookings.slice(
    historyStartIndex,
    historyStartIndex + HISTORY_PAGE_SIZE,
  );
  const historyRangeStart = totalPast === 0 ? 0 : historyStartIndex + 1;
  const historyRangeEnd =
    totalPast === 0 ? 0 : Math.min(historyStartIndex + HISTORY_PAGE_SIZE, totalPast);
  const hasPreviousHistoryPage = historyPage > 1;
  const hasNextHistoryPage = historyPage < totalHistoryPages;

  const createHistoryPageHref = (page: number) => {
    const params = new URLSearchParams();
    const entries = Object.entries(resolvedSearchParams ?? {});

    for (const [key, rawValue] of entries) {
      if (key === "historyPage" || rawValue === undefined || rawValue === null) {
        continue;
      }

      if (Array.isArray(rawValue)) {
        rawValue.forEach((entry) => {
          params.append(key, entry);
        });
      } else {
        params.set(key, String(rawValue));
      }
    }

    if (page > 1) {
      params.set("historyPage", page.toString());
    } else {
      params.delete("historyPage");
    }

    const query = params.toString();
    return query.length > 0 ? `/reservations?${query}` : "/reservations";
  };

  const renderBookingCard = (booking: (typeof derivedBookings)[number]) => {
    const startDate = new Date(booking.startDateISO);
    const endDate = new Date(booking.endDateISO);
    const canEdit =
      startDate > now &&
      booking.derivedStatus !== BookingStatus.PENDING &&
      booking.derivedStatus !== BookingStatus.CANCELLED &&
      booking.derivedStatus !== BookingStatus.COMPLETED &&
      !booking.isCancellationPending;
    const canCancel =
      startDate > now &&
      !booking.isCancellationPending &&
      (booking.derivedStatus === BookingStatus.PENDING ||
        booking.derivedStatus === BookingStatus.CONFIRMED);

    return (
      <div
        key={booking.id}
        className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between"
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">
              {booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : booking.reference}
            </p>
            <Badge className={`${BOOKING_STATUS_COLORS[booking.derivedStatus]} text-[10px]`}>
              {BOOKING_STATUS_LABELS[booking.derivedStatus]}
            </Badge>
            {booking.isCancellationPending ? (
              <Badge variant="destructive" className="text-[10px]">
                Annulation demandée
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Départ le {dateTimeFormatter.format(startDate)} • Retour le {dateTimeFormatter.format(endDate)}
          </p>
          <p className="text-xs text-muted-foreground">
            Référence : <span className="font-medium text-gray-900">{booking.reference}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="inline-flex items-center gap-1 text-xs sm:text-sm">
                <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Détails réservation</span>
                <span className="sm:hidden">Détails</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Réservation {booking.reference}</DialogTitle>
                <DialogDescription>
                  Informations détaillées de votre réservation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Référence</p>
                    <p className="font-semibold text-gray-900">{booking.reference}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Statut</p>
                    <Badge className={`${BOOKING_STATUS_COLORS[booking.derivedStatus]} text-[10px]`}>
                      {BOOKING_STATUS_LABELS[booking.derivedStatus]}
                    </Badge>
                  </div>
                  {booking.createdAt ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Date de création</p>
                      <p className="font-semibold text-gray-900">
                        {(() => {
                          if (!booking.createdAt) return "N/A";
                          const date = new Date(booking.createdAt);
                          if (isNaN(date.getTime())) return "N/A";
                          return dateFormatter.format(date);
                        })()}
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Période de location
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      Départ : {dateTimeFormatter.format(startDate)}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      Retour : {dateTimeFormatter.format(endDate)}
                    </p>
                  </div>
                </div>
                {booking.pickupLocation || booking.returnLocation ? (
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Lieux</p>
                    {booking.pickupLocation ? (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-700">Prise en charge</p>
                        <p className="text-sm text-gray-900">
                          {booking.pickupLocation.name}
                          {booking.pickupLocation.address ? ` - ${booking.pickupLocation.address}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">{booking.pickupLocation.city}</p>
                      </div>
                    ) : null}
                    {booking.returnLocation ? (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-700">Restitution</p>
                        <p className="text-sm text-gray-900">
                          {booking.returnLocation.name}
                          {booking.returnLocation.address ? ` - ${booking.returnLocation.address}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">{booking.returnLocation.city}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Prix total</p>
                    <p className="font-semibold text-gray-900">
                      {currencyFormatter.format(booking.totalPrice ?? 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Acompte payé</p>
                    <p className="font-semibold text-gray-900">
                      {currencyFormatter.format(booking.depositPaid ?? 0)}
                    </p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Montant restant</p>
                    <p className="font-semibold text-gray-900">
                      {currencyFormatter.format((booking.totalPrice ?? 0) - (booking.depositPaid ?? 0))}
                    </p>
                  </div>
                </div>
                {booking.serviceIds && booking.serviceIds.length > 0 ? (
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Services additionnels
                    </p>
                    <div className="space-y-1">
                      {booking.serviceIds
                        .map((serviceId) => servicesMap.get(serviceId))
                        .filter((service): service is { id: string; name: string; price: number } => service !== undefined)
                        .map((service) => (
                          <div key={service.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-900">{service.name}</span>
                            <span className="font-semibold text-gray-900">
                              {currencyFormatter.format(service.price)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null}
                {booking.notes ? (
                  <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Notes</p>
                    <p className="text-sm text-gray-900">{booking.notes}</p>
                  </div>
                ) : null}
                {booking.vehicle ? (
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Véhicule</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-700">Marque</p>
                        <p className="text-sm text-gray-900">{booking.vehicle.brand}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-700">Modèle</p>
                        <p className="text-sm text-gray-900">{booking.vehicle.model}</p>
                      </div>
                      {booking.vehicle.licensePlate ? (
                        <div className="space-y-1 sm:col-span-2">
                          <p className="text-xs font-semibold text-gray-700">Immatriculation</p>
                          <p className="text-sm text-gray-900">{booking.vehicle.licensePlate}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {booking.invoices.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Factures associées
                    </p>
                    {booking.invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">
                            {invoice.invoiceNumber || "N/A"}
                          </span>
                          <Badge className={`${INVOICE_STATUS_COLORS[invoice.status]} text-[10px]`}>
                            {INVOICE_STATUS_LABELS[invoice.status]}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Montant : {currencyFormatter.format(invoice.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
                {booking.isCancellationPending ? (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                    <p className="text-xs font-semibold text-orange-900 uppercase tracking-wide">
                      Annulation en attente
                    </p>
                    {booking.cancellationRequestedAtISO ? (
                      <p className="mt-1 text-xs text-orange-700">
                        Demandée le {dateTimeFormatter.format(new Date(booking.cancellationRequestedAtISO))}
                      </p>
                    ) : null}
                    {booking.cancellationRequestedRefundRate !== null ? (
                      <p className="mt-1 text-xs text-orange-700">
                        Taux de remboursement : {booking.cancellationRequestedRefundRate}%
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
          {booking.vehicle ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="inline-flex items-center gap-1 text-xs sm:text-sm">
                  <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Détails véhicule</span>
                  <span className="sm:hidden">Véhicule</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {booking.vehicle.brand} {booking.vehicle.model}
                  </DialogTitle>
                  <DialogDescription>
                    Informations principales sur le véhicule associé à cette réservation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Marque</p>
                      <p className="font-semibold text-gray-900">{booking.vehicle.brand}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Modèle</p>
                      <p className="font-semibold text-gray-900">{booking.vehicle.model}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Immatriculation</p>
                      <p className="font-semibold text-gray-900">{booking.vehicle.licensePlate}</p>
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Période de location</p>
                    <p className="text-sm font-medium text-gray-900">
                      {dateTimeFormatter.format(startDate)} → {dateTimeFormatter.format(endDate)}
                    </p>
                  </div>
                  {booking.invoices[0] ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Facture associée</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="font-semibold text-gray-900">
                          {booking.invoices[0].invoiceNumber ?? "Facture en cours"}
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
              startDate={booking.startDateISO}
              endDate={booking.endDateISO}
              totalPrice={booking.totalPrice ?? 0}
              vehicleId={booking.vehicleId}
              serviceIds={booking.serviceIds}
              depositPaid={booking.depositPaid ?? 0}
            />
          ) : null}
          {canCancel ? (
            <CancelBookingDialog
              bookingId={booking.id}
              startDate={booking.startDateISO}
              depositPaid={booking.depositPaid ?? 0}
              cancellationPolicy={cancellationPolicy}
              cancellationState={{
                requested: booking.isCancellationPending,
                requestedAt: booking.cancellationRequestedAtISO,
                refundRate: booking.cancellationRequestedRefundRate,
              }}
            />
          ) : null}
        </div>
      </div>
    );
  };

  const renderEmptyState = (title: string, description: string) => (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
      <div className="space-y-2 px-6">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="container space-y-8 py-8 px-4 sm:px-6">
      <ClientBreadcrumbs
        items={[
          { label: "Tableau de bord", href: "/dashboard" },
          { label: "Mes réservations" },
        ]}
        className="mb-4"
      />
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Mes réservations</h1>
        <p className="text-gray-600">
          Retrouvez vos locations passées, en cours et à venir. Gérez vos demandes de modification ou
          d&apos;annulation en quelques clics.
        </p>
      </header>

      {totalBookings === 0 ? (
        <Card className="border border-dashed border-slate-200 bg-slate-50">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <History className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-base font-semibold text-gray-900">Aucune réservation pour le moment</p>
              <p className="text-sm text-muted-foreground">
                Explorez notre flotte et réservez votre premier véhicule en quelques minutes.
              </p>
            </div>
            <Button asChild>
              <Link href="/vehicles" className="inline-flex items-center gap-2">
                Découvrir les véhicules
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  À venir
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-gray-900">{totalUpcoming}</div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Réservations confirmées à venir. Vous pouvez encore les modifier ou demander une annulation.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  En cours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-gray-900">{totalInProgress}</div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Locations actuellement actives. Profitez de votre trajet et pensez à vérifier votre check-out.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Historique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-gray-900">{totalPast}</div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Locations terminées ou annulées. Consultez vos factures ou réservez à nouveau un véhicule.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-slate-100 shadow-sm">
              <CardHeader>
                <CardTitle>Réservations à venir</CardTitle>
                <CardDescription>
                  Vos prochaines locations confirmées. Modifiez vos dates ou annulez conformément à notre
                  politique.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingBookings.length === 0
                  ? renderEmptyState(
                      "Aucune réservation à venir",
                      "Planifiez votre prochaine escapade en choisissant un véhicule adapté à vos besoins.",
                    )
                  : upcomingBookings.map(renderBookingCard)}
              </CardContent>
            </Card>

            <Card className="border border-slate-100 shadow-sm">
              <CardHeader>
                <CardTitle>Réservations en cours</CardTitle>
                <CardDescription>
                  Locations actuellement actives. Contactez-nous en cas de besoin ou prolongez votre séjour.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inProgressBookings.length === 0
                  ? renderEmptyState(
                      "Aucune réservation en cours",
                      "Vos locations actives apparaîtront ici dès le début de votre parcours.",
                    )
                  : inProgressBookings.map(renderBookingCard)}
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="border border-slate-100 shadow-sm">
              <CardHeader>
                <CardTitle>Historique des réservations</CardTitle>
                <CardDescription>
                  Consultez vos locations terminées ou annulées, téléchargez vos factures et laissez un avis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pastBookings.length === 0
                  ? renderEmptyState(
                      "Historique vide",
                      "Vos locations terminées s’afficheront ici. Nous espérons vous revoir bientôt !",
                    )
                  : historyPageBookings.map(renderBookingCard)}
                {totalHistoryPages > 1 ? (
                  <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      Affichage {historyRangeStart}–{historyRangeEnd} sur {totalPast} • Page {historyPage} sur{" "}
                      {totalHistoryPages}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild disabled={!hasPreviousHistoryPage}>
                        <Link
                          href={hasPreviousHistoryPage ? createHistoryPageHref(historyPage - 1) : "#"}
                          aria-disabled={!hasPreviousHistoryPage}
                        >
                          Précédent
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild disabled={!hasNextHistoryPage}>
                        <Link
                          href={hasNextHistoryPage ? createHistoryPageHref(historyPage + 1) : "#"}
                          aria-disabled={!hasNextHistoryPage}
                        >
                          Suivant
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}


