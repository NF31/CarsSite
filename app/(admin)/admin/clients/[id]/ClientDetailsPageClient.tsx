"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceStrict } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CalendarRange,
  CheckCircle2,
  Clock,
  Edit,
  Mail,
  MapPin,
  Shield,
  Star,
  User,
  UserRoundPlus,
  Wallet,
  FileText,
  Lock,
  Loader2,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CLIENT_STATUS_COLORS,
  CLIENT_STATUS_ICONS,
  CLIENT_STATUS_LABELS,
  clientDateFormatter,
  clientDateTimeFormatter,
} from "@/components/admin/clients/client-helpers";
import { getDriverLicenseUrlAction } from "@/actions/admin/bookings";
import type { ClientDetail, ClientDetailBooking } from "@/actions/admin/clients";
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "@/components/admin/bookings/booking-helpers";
import { BookingStatus } from "@prisma/client";

interface ClientDetailsPageClientProps {
  client: ClientDetail;
}

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const formatRelativeBooking = (booking: ClientDetailBooking) => {
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);

  return formatDistanceStrict(start, end, {
    locale: fr,
  });
};

const computeBookingStatus = (booking: ClientDetailBooking) => {
  if (booking.status === BookingStatus.CANCELLED) {
    return BookingStatus.CANCELLED;
  }

  const now = new Date();
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);

  if (end <= now) {
    return BookingStatus.COMPLETED;
  }

  if (start <= now && now < end) {
    return BookingStatus.IN_PROGRESS;
  }

  return booking.status;
};

export function ClientDetailsPageClient({ client }: ClientDetailsPageClientProps) {
  const router = useRouter();
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canCreateReservation = client.status === "ACTIVE" && !client.deletedAt;

  const StatusIcon = CLIENT_STATUS_ICONS[client.status];

  const bookingsWithStatus = useMemo(
    () =>
      client.bookings.map((booking) => ({
        ...booking,
        computedStatus: computeBookingStatus(booking),
      })),
    [client.bookings]
  );

  const lastBooking = bookingsWithStatus[0] ?? null;

  const statusBadge = useMemo(
    () => (
      <Badge className={`${CLIENT_STATUS_COLORS[client.status]} flex items-center gap-1`}>
        <StatusIcon className="h-3.5 w-3.5" />
        {CLIENT_STATUS_LABELS[client.status]}
      </Badge>
    ),
    [client.status, StatusIcon]
  );

  const handleViewDriverLicense = () => {
    if (!client.hasDriverLicense) {
      return;
    }
    startTransition(async () => {
      setLicenseError(null);
      const result = await getDriverLicenseUrlAction({
        userId: client.id,
      });

      if (!result.success || !result.data) {
        setLicenseError(result.error ?? "Impossible de récupérer le permis pour ce client.");
        return;
      }

      window.open(result.data.url, "_blank", "noopener,noreferrer");
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-3 xl:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Retour</span>
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 break-words">{client.name}</h1>
              {statusBadge}
              {client.lockedUntil && new Date(client.lockedUntil) > new Date() ? (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <Lock className="h-3.5 w-3.5" />
                  Verrouillé jusqu&apos;au{" "}
                  {clientDateTimeFormatter.format(new Date(client.lockedUntil))}
                </Badge>
              ) : null}
              {client.deletedAt && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs text-amber-700 border-amber-200 bg-amber-50">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Compte désactivé
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex flex-wrap gap-2 items-center">
              <span>Compte créé le {clientDateTimeFormatter.format(new Date(client.createdAt))}</span>
              <span className="text-gray-300">•</span>
              <span>Dernière mise à jour {clientDateTimeFormatter.format(new Date(client.updatedAt))}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full xl:w-auto">
          <Link href={`/admin/clients/edit/${client.id}`} className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto">
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          </Link>
          {canCreateReservation ? (
            <Link href={`/admin/bookings/add?clientId=${client.id}`} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <UserRoundPlus className="mr-2 h-4 w-4" />
                Nouvelle réservation
              </Button>
            </Link>
          ) : (
            <Button
              className="w-full sm:w-auto opacity-60"
              variant="outline"
              disabled
              title="Client inactif : réactivez le compte avant de créer une réservation."
            >
              <UserRoundPlus className="mr-2 h-4 w-4" />
              Nouvelle réservation
            </Button>
          )}
          <Link href={`/admin/bookings?search=${encodeURIComponent(client.name)}`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <CalendarRange className="mr-2 h-4 w-4" />
              Historique des réservations
            </Button>
          </Link>
          <Button variant="outline" className="w-full sm:w-auto" disabled>
            <Mail className="mr-2 h-4 w-4" />
            Envoyer un email (bientôt)
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground">Nom complet</p>
                  <p className="font-semibold text-gray-900">{client.name}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground">Adresse email</p>
                  <p className="font-semibold text-gray-900 break-all">{client.email}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-semibold text-gray-900 break-all">
                    {client.phone ?? "Non renseigné"}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground">Statut du compte</p>
                  {statusBadge}
                </div>
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {client.hasDriverLicense ? <BadgeCheck className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Permis de conduire</p>
                    <p className="text-sm text-muted-foreground">
                      {client.hasDriverLicense
                        ? client.driverLicenseLastUploadedAt
                          ? `Dernier envoi le ${clientDateTimeFormatter.format(new Date(client.driverLicenseLastUploadedAt))}`
                          : "Document disponible"
                        : "Aucun permis enregistré"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleViewDriverLicense}
                  disabled={!client.hasDriverLicense || isPending}
                >
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                  Voir le permis
                </Button>
              </div>
              {licenseError && (
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {licenseError}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5" />
                Réservations récentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bookingsWithStatus.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-muted-foreground">
                  Ce client n&apos;a pas encore effectué de réservation.
                </div>
              ) : (
                <div className="space-y-4">
                  {bookingsWithStatus.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Créée le {clientDateTimeFormatter.format(new Date(booking.createdAt))}
                          </p>
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="text-base font-semibold text-primary hover:underline"
                          >
                            Réservation {booking.reference}
                          </Link>
                        </div>
                        <Badge className={`${BOOKING_STATUS_COLORS[booking.computedStatus]} w-fit`}>
                          {BOOKING_STATUS_LABELS[booking.computedStatus]}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>
                            {clientDateTimeFormatter.format(new Date(booking.startDate))} →{" "}
                            {clientDateTimeFormatter.format(new Date(booking.endDate))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{formatRelativeBooking(booking)}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {booking.vehicle ? (
                          <span className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-primary" />
                            {booking.vehicle.brand} {booking.vehicle.model} • {booking.vehicle.licensePlate}
                          </span>
                        ) : null}
                        <span className="flex items-center gap-2 font-medium text-gray-900">
                          <Wallet className="h-4 w-4 text-primary" />
                          {currencyFormatter.format(booking.totalPrice)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Réservations totales</p>
                  <span className="text-2xl font-bold text-gray-900">{client.stats.totalBookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">En cours / à venir</p>
                  <span className="text-lg font-semibold">{client.stats.upcomingBookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Terminées</p>
                  <span className="text-lg font-semibold">{client.stats.completedBookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Annulées</p>
                  <span className="text-lg font-semibold">{client.stats.cancelledBookings}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Montant dépensé</p>
                  <span className="text-lg font-semibold text-primary">
                    {currencyFormatter.format(client.stats.totalAmountSpent)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Panier moyen</p>
                  <span className="text-lg font-semibold">
                    {currencyFormatter.format(client.stats.averageAmountSpent)}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Première réservation :{" "}
                  {client.stats.firstBookingDate
                    ? clientDateFormatter.format(new Date(client.stats.firstBookingDate))
                    : "Non disponible"}
                </p>
                <p>
                  Dernière réservation :{" "}
                  {client.stats.lastBookingDate
                    ? clientDateFormatter.format(new Date(client.stats.lastBookingDate))
                    : "Non disponible"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Préférences de communication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {client.preferences ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Emails transactionnels</span>
                    <Badge variant={client.preferences.emailNotifications ? "default" : "outline"}>
                      {client.preferences.emailNotifications ? "Activés" : "Désactivés"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rappels de réservation</span>
                    <Badge variant={client.preferences.bookingReminders ? "default" : "outline"}>
                      {client.preferences.bookingReminders ? "Activés" : "Désactivés"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Promotions</span>
                    <Badge variant={client.preferences.promotionalEmails ? "default" : "outline"}>
                      {client.preferences.promotionalEmails ? "Activées" : "Désactivées"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Marketing</span>
                    <Badge variant={client.preferences.marketingEmails ? "default" : "outline"}>
                      {client.preferences.marketingEmails ? "Activés" : "Désactivés"}
                    </Badge>
                  </div>
                  <Separator />
                  <p className="text-muted-foreground">
                    Langue préférée :{" "}
                    <span className="font-medium text-gray-900 uppercase">
                      {client.preferences.language}
                    </span>
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Préférences non configurées pour ce client.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Compte créé</p>
                  <p>{clientDateTimeFormatter.format(new Date(client.createdAt))}</p>
                </div>
              </div>
              {client.stats.lastBookingDate && (
                <div className="flex items-start gap-3">
                  <CalendarRange className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Dernière réservation</p>
                    <p>{clientDateTimeFormatter.format(new Date(client.stats.lastBookingDate))}</p>
                  </div>
                </div>
              )}
              {lastBooking && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Réservation en vedette</p>
                    <p>
                      <Link href={`/admin/bookings/${lastBooking.id}`} className="text-primary hover:underline">
                        {lastBooking.reference}
                      </Link>{" "}
                      • {currencyFormatter.format(lastBooking.totalPrice)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


