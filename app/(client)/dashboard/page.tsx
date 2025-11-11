import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  History,
  Info,
  Settings,
  Wallet2,
} from "lucide-react";
import Link from "next/link";
import { BookingStatus, InvoiceStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditBookingDialog } from "@/components/client/dashboard/EditBookingDialog";
import { CancelBookingDialog } from "@/components/client/dashboard/CancelBookingDialog";
import { createDefaultAdminSettings } from "@/actions/admin/settings/shared";
import { getClientRecentBookingsAction } from "@/actions/client/bookings/get-recent";
import { RecentActivityCard } from "@/components/client/dashboard/RecentActivityCard";
import { ClientBreadcrumbs } from "@/components/client/Breadcrumbs";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  currencyFormatter,
  dateFormatter,
  dateTimeFormatter,
} from "@/components/client/dashboard/dashboard-constants";

export const dynamic = "force-dynamic";

const RECENT_ACTIVITY_PAGE_SIZE = 5;

type DashboardBooking = Prisma.BookingGetPayload<{
  include: {
    vehicle: {
      select: {
        brand: true;
        model: true;
        licensePlate: true;
      };
    };
    invoices: {
      select: {
        id: true;
        invoiceNumber: true;
        status: true;
        total: true;
      };
    };
  };
}>;

type DashboardBookingWithCancellation = DashboardBooking & {
  cancellationRequested?: boolean | null;
  cancellationRequestedAt?: Date | null;
  cancellationRequestedRefundRate?: number | null;
};

type DashboardSearchParams =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | Promise<Record<string, string | string[] | undefined>>
  | undefined;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: DashboardSearchParams;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const resolvedSearchParams: Record<string, string | string[] | undefined> = await (async () => {
    if (!searchParams) {
      return {};
    }

    if (searchParams instanceof URLSearchParams) {
      return Object.fromEntries(searchParams.entries());
    }

    if (searchParams instanceof Promise) {
      const awaited = await searchParams;
      return awaited ?? {};
    }

    return searchParams;
  })();

  const parsePageParam = (value: string | string[] | undefined): number => {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 1;
      }
      return parsePageParam(value[0]);
    }

    if (!value) {
      return 1;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  };

  const userId = session.user.id;

  const defaultSettings = createDefaultAdminSettings();

  const [bookings, invoices, cancellationPolicySetting] = await Promise.all([
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
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    }) as Promise<DashboardBooking[]>,
    prisma.invoice.findMany({
      where: { userId },
      include: {
        booking: {
          select: {
            reference: true,
            startDate: true,
          },
        },
      },
      orderBy: {
        issuedAt: "desc",
      },
    }),
    prisma.setting.findUnique({
      where: { key: "config.cancellationPolicy" },
      select: { value: true },
    }),
  ]);

  const cancellationPolicy =
    typeof cancellationPolicySetting?.value === "string"
      ? cancellationPolicySetting.value
      : defaultSettings.configuration.cancellationPolicy;

  const initialRecentResult = await getClientRecentBookingsAction({
    page: parsePageParam(resolvedSearchParams.recentPage),
    limit: RECENT_ACTIVITY_PAGE_SIZE,
  });

  const initialRecentBookings =
    initialRecentResult.success && initialRecentResult.data
      ? initialRecentResult.data
      : {
          bookings: [],
          pagination: {
            total: 0,
            limit: RECENT_ACTIVITY_PAGE_SIZE,
            page: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        };

  const now = new Date();

  const deriveBookingStatus = (booking: (typeof bookings)[number]): BookingStatus => {
    if (booking.status === BookingStatus.CANCELLED) {
      return BookingStatus.CANCELLED;
    }

    const start = booking.startDate;
    const end = booking.endDate;

    if (end <= now) {
      return BookingStatus.COMPLETED;
    }

    if (start <= now && now < end) {
      return BookingStatus.IN_PROGRESS;
    }

    return booking.status;
  };

  const derivedBookings = (bookings as DashboardBookingWithCancellation[]).map((booking) => {
    const cancellationRequested = booking.cancellationRequested ?? false;
    return {
      ...booking,
      cancellationRequested,
      cancellationRequestedAt: booking.cancellationRequestedAt ?? null,
      cancellationRequestedRefundRate: booking.cancellationRequestedRefundRate ?? null,
      derivedStatus: deriveBookingStatus(booking),
      isCancellationPending: cancellationRequested,
    };
  });

  const activeBookings = derivedBookings.filter(
    (booking) => booking.derivedStatus === BookingStatus.IN_PROGRESS,
  );

  const upcomingBookings = derivedBookings
    .filter(
      (booking) =>
        booking.startDate > now &&
        booking.derivedStatus !== BookingStatus.CANCELLED &&
        booking.derivedStatus !== BookingStatus.IN_PROGRESS,
    )
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 3);

  const pastBookings = derivedBookings.filter(
    (booking) =>
      booking.endDate < now &&
      (booking.derivedStatus === BookingStatus.COMPLETED ||
        booking.derivedStatus === BookingStatus.CANCELLED),
  );

  const outstandingInvoices = invoices.filter(
    (invoice) =>
      invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.OVERDUE,
  );

  const paidInvoices = invoices.filter((invoice) => invoice.status === InvoiceStatus.PAID);
  const totalSpent = paidInvoices.reduce((total, invoice) => total + invoice.total, 0);

  const recentInvoices = invoices.slice(0, 5);


  return (
    <div className="container space-y-8 py-8 px-4 sm:px-6">
      <ClientBreadcrumbs
        items={[
          { label: "Tableau de bord", href: "/dashboard" },
        ]}
        className="mb-4"
      />
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Bienvenue, {session.user.name} 👋</h1>
        <p className="text-gray-600">
          Visualisez vos prochaines locations, retrouvez vos factures et suivez l&apos;historique de vos voyages.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Réservations actives
            </CardTitle>
            <Clock className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{activeBookings.length}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              {activeBookings.length > 0
                ? "Profitez bien de votre location en cours."
                : "Aucune location en cours pour le moment."}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">À venir</CardTitle>
            <Calendar className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{upcomingBookings.length}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              {upcomingBookings.length > 0
                ? "Préparez-vous pour vos prochains trajets."
                : "Réservez votre prochain véhicule en quelques clics."}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Historique complété
            </CardTitle>
            <History className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{pastBookings.length}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              {pastBookings.length > 0
                ? "Replongez dans vos précédentes expériences."
                : "Pas encore de location terminée."}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Factures à payer</CardTitle>
            <CreditCard className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{outstandingInvoices.length}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              {outstandingInvoices.length > 0
                ? "Pensez à régler vos factures en attente."
                : "Aucune facture en attente de paiement."}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border border-slate-100 shadow-sm">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Prochaines réservations</CardTitle>
              <CardDescription>
                Retrouvez vos locations confirmées. Nous vous enverrons un rappel par email avant chaque départ.
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/reservations" className="inline-flex items-center gap-1">
                Gérer mes réservations
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-muted-foreground">
                Aucune réservation à venir. Réservez un véhicule pour votre prochaine escapade.
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {booking.vehicle
                            ? `${booking.vehicle.brand} ${booking.vehicle.model}`
                            : booking.reference}
                        </h3>
                        <Badge className={`${BOOKING_STATUS_COLORS[booking.derivedStatus]} text-[10px]`}>
                          {BOOKING_STATUS_LABELS[booking.derivedStatus]}
                        </Badge>
                        {booking.isCancellationPending ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Annulation demandée
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Départ le {dateTimeFormatter.format(new Date(booking.startDate))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Référence : {booking.reference}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.invoices[0] ? (
                        <Badge variant="outline" className="text-xs">
                          Facture {booking.invoices[0].invoiceNumber}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Facture en cours
                        </Badge>
                      )}
                      {booking.vehicle ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="secondary" size="sm" className="inline-flex items-center gap-1">
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
                                Informations principales sur le véhicule associé à votre réservation.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 text-sm">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                    Marque
                                  </p>
                                  <p className="font-semibold text-gray-900">{booking.vehicle.brand}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                    Modèle
                                  </p>
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
                                    Statut
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
                                  {dateTimeFormatter.format(new Date(booking.startDate))} →{" "}
                                  {dateTimeFormatter.format(new Date(booking.endDate))}
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
                                    <Badge className={`${INVOICE_STATUS_COLORS[booking.invoices[0].status]} text-[10px]`}>
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
                      {booking.startDate > now && booking.derivedStatus !== BookingStatus.PENDING ? (
                        <EditBookingDialog
                          bookingId={booking.id}
                          startDate={booking.startDate.toISOString()}
                          endDate={booking.endDate.toISOString()}
                        />
                      ) : null}
                      {booking.startDate > now &&
                      !booking.isCancellationPending &&
                      (booking.derivedStatus === BookingStatus.PENDING ||
                        booking.derivedStatus === BookingStatus.CONFIRMED) ? (
                        <CancelBookingDialog
                          bookingId={booking.id}
                          startDate={booking.startDate.toISOString()}
                          depositPaid={booking.depositPaid ?? 0}
                          cancellationPolicy={cancellationPolicy}
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Résumé financier</CardTitle>
            <CardDescription>Statut de vos paiements et dépenses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Montant total payé</span>
                <Wallet2 className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {currencyFormatter.format(totalSpent)}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Factures payées</span>
                <span className="font-semibold text-emerald-600">{paidInvoices.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Factures en attente</span>
                <span className="font-semibold text-amber-600">{outstandingInvoices.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Total de factures</span>
                <span className="font-medium text-gray-900">{invoices.length}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/client/invoices" className="inline-flex items-center justify-center gap-2 text-sm">
                Voir mes factures
                <FileText className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Vos dernières réservations terminées ou en cours.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivityCard
              initialData={initialRecentBookings}
              cancellationPolicy={cancellationPolicy}
            />
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Mes factures récentes</CardTitle>
            <CardDescription>Retrouvez vos cinq dernières factures générées.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentInvoices.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-muted-foreground">
                Aucune facture disponible pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        Émise le {dateFormatter.format(new Date(invoice.issuedAt))}
                        {invoice.booking
                          ? ` • Réservation ${invoice.booking.reference}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">
                        {currencyFormatter.format(invoice.total)}
                      </span>
                      <Badge className={`${INVOICE_STATUS_COLORS[invoice.status]} text-[10px]`}>
                        {INVOICE_STATUS_LABELS[invoice.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>Mettez à jour vos coordonnées et documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-gray-900">Nom :</span> {session.user.name}
            </div>
            <div>
              <span className="font-medium text-gray-900">Email :</span> {session.user.email}
            </div>
            <p className="text-xs text-muted-foreground">
              Rendez-vous sur la page profil pour modifier vos informations ou télécharger votre permis.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile" className="inline-flex items-center gap-2">
                Gérer mon profil
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Conseils & assistance</CardTitle>
            <CardDescription>Profitez au mieux de vos locations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
              <p>
                Pensez à vérifier vos factures quelques jours après chaque location pour garder un historique clair.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Car className="mt-0.5 h-4 w-4 text-primary" />
              <p>
                Besoin d&apos;un véhicule pour une occasion spéciale ? Réservez en avance pour garantir la disponibilité.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 text-indigo-500" />
              <p>
                Retrouvez toutes vos factures dans la section dédiée pour faciliter vos démarches administratives.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}