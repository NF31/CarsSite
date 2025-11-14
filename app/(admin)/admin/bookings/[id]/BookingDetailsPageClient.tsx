"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, formatDistanceStrict } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarRange,
  Clock,
  MapPin,
  User,
  Car,
  Shield,
  Euro,
  CreditCard,
  FileText,
  Edit,
  Mail,
  Phone,
  IdCard,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  bookingCurrencyFormatter,
} from "@/components/admin/bookings/booking-helpers";
import {
  getDriverLicenseUrlAction,
  moderateBookingStatusAction,
  type BookingDetail,
} from "@/actions/admin/bookings";
import { BookingStatus, ServicePricingType, VehicleStatus } from "@prisma/client";
import { X, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BookingDetailsPageClientProps {
  booking: BookingDetail;
}

const pricingTypeLabels: Record<ServicePricingType, string> = {
  FIXED: "Montant fixe",
  PER_DAY: "Par jour",
  PERCENTAGE: "Pourcentage",
};

const vehicleStatusLabels: Record<VehicleStatus, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Réservé",
  MAINTENANCE: "En maintenance",
  UNAVAILABLE: "Indisponible",
};

const vehicleStatusColors: Record<VehicleStatus, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  RESERVED: "bg-blue-50 text-blue-700 border-blue-200",
  MAINTENANCE: "bg-amber-50 text-amber-700 border-amber-200",
  UNAVAILABLE: "bg-red-50 text-red-700 border-red-200",
};

function capitalize(value: string) {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateTime(value: string) {
  return capitalize(format(new Date(value), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr }));
}

function computeDynamicStatus(booking: BookingDetail): BookingStatus {
  if (booking.status === BookingStatus.CANCELLED) {
    return BookingStatus.CANCELLED;
  }

  const now = new Date();
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);

  if (endDate <= now) {
    return BookingStatus.COMPLETED;
  }

  if (startDate <= now && now < endDate) {
    return BookingStatus.IN_PROGRESS;
  }

  return booking.status;
}

export function BookingDetailsPageClient({ booking }: BookingDetailsPageClientProps) {
  const router = useRouter();
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [isModerating, startModerate] = useTransition();
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [activeModeration, setActiveModeration] = useState<string | null>(null);
  const [isLicensePending, startLicenseTransition] = useTransition();

  const computedStatus = useMemo(() => computeDynamicStatus(booking), [booking]);

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

  const handleModeration = (action: "approve" | "reject") => {
    setModerationError(null);
    setActiveModeration(action);

    startModerate(async () => {
      try {
        const result = await moderateBookingStatusAction({
          bookingId: booking.id,
          action,
        });

        if (!result.success) {
          setModerationError(result.error ?? "Erreur lors de la validation/refus de la réservation.");
          return;
        }

        // Rafraîchir la page pour afficher les changements
        router.refresh();
      } catch (error) {
        console.error("Erreur lors de la modération", error);
        setModerationError("Une erreur inattendue est survenue.");
      } finally {
        setActiveModeration(null);
      }
    });
  };

  // Vérifier si la réservation nécessite une validation (statut PENDING)
  const needsValidation = computedStatus === BookingStatus.PENDING;
  const isCancellationRequest = booking.cancellationRequested === true;
  const isProcessing = isModerating && activeModeration !== null;

  return (
    <div className="space-y-6">
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
                    onClick={() => handleModeration("reject")}
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
                    onClick={() => handleModeration("approve")}
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
                    onClick={() => handleModeration("reject")}
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
                    onClick={() => handleModeration("approve")}
                    className="w-full md:w-auto"
                  >
                    {isProcessing && activeModeration === "approve" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Valider
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

      {moderationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{moderationError}</AlertDescription>
        </Alert>
      )}

      {needsValidation && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {isCancellationRequest ? (
              <>
                <strong>⚠️ Demande d&apos;annulation du client</strong>
                <br />
                Le client a demandé l&apos;annulation de cette réservation.
                {booking.cancellationPreviousStatus && (
                  <>
                    <br />
                    <strong>Statut actuel :</strong> {BOOKING_STATUS_LABELS[booking.status]} (en attente)
                    <br />
                    <strong>Statut précédent :</strong> {BOOKING_STATUS_LABELS[booking.cancellationPreviousStatus]} (sera restauré si vous conservez la réservation)
                  </>
                )}
                {booking.cancellationReason && (
                  <>
                    <br />
                    <strong>Raison de l&apos;annulation :</strong> {booking.cancellationReason}
                  </>
                )}
                <br />
                <br />
                <strong>Actions possibles :</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>Conserver la réservation</strong> : La réservation sera restaurée à son statut précédent ({booking.cancellationPreviousStatus ? BOOKING_STATUS_LABELS[booking.cancellationPreviousStatus] : "CONFIRMED"}) et les dates seront conservées.</li>
                  <li><strong>Accepter l&apos;annulation</strong> : La réservation sera annulée et les dates seront libérées.</li>
                </ul>
              </>
            ) : (
              "Cette réservation est en attente de validation. Utilisez les boutons ci-dessus pour valider ou refuser."
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarRange className="h-5 w-5 text-muted-foreground" />
                Période & itinéraire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Début</p>
                  <p className="text-sm font-semibold text-gray-900 break-words">{startDateLabel}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Fin</p>
                  <p className="text-sm font-semibold text-gray-900 break-words">{endDateLabel}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Durée estimée</p>
                  <p className="text-sm font-semibold text-gray-900 break-words">{durationLabel}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Statut temporel</p>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="break-words">{timelineMessage.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{timelineMessage.helper}</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Retrait</p>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900 break-words">
                        {booking.pickupLocation.name}
                      </p>
                      <p className="text-muted-foreground break-words">{booking.pickupLocation.city}</p>
                      {booking.pickupLocation.address && (
                        <p className="text-xs text-muted-foreground break-words">
                          {booking.pickupLocation.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Retour</p>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900 break-words">
                        {booking.returnLocation.name}
                      </p>
                      <p className="text-muted-foreground break-words">{booking.returnLocation.city}</p>
                      {booking.returnLocation.address && (
                        <p className="text-xs text-muted-foreground break-words">
                          {booking.returnLocation.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                Client & documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-gray-900 break-words">{booking.user.name}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {booking.user.email && (
                      <span className="inline-flex items-center gap-1 break-words">
                        <Mail className="h-4 w-4" />
                        {booking.user.email}
                      </span>
                    )}
                    {booking.user.phone && (
                      <span className="inline-flex items-center gap-1 break-words">
                        <Phone className="h-4 w-4" />
                        {booking.user.phone}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="uppercase text-[11px]">
                  {booking.user.role}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-3 rounded-md border border-dashed border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">Permis de conduire</p>
                    <p
                      className={cn(
                        "text-sm font-medium inline-flex items-center gap-2",
                        booking.user.hasDriverLicense ? "text-emerald-600" : "text-amber-600"
                      )}
                    >
                      {booking.user.hasDriverLicense ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Permis enregistré
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                          Permis manquant
                        </>
                      )}
                    </p>
                    {lastLicenseUploadLabel && (
                      <p className="text-xs text-muted-foreground">
                        Dernière mise à jour le {lastLicenseUploadLabel}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Remplacements utilisés : {booking.user.driverLicenseUploadCount ?? 0}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full lg:w-auto lg:shrink-0"
                    onClick={handleViewLicense}
                    disabled={!booking.user.hasDriverLicense || isLicensePending}
                  >
                    {isLicensePending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ouverture...
                      </>
                    ) : (
                      <>
                        <IdCard className="mr-2 h-4 w-4" />
                        Voir le permis
                      </>
                    )}
                  </Button>
                </div>
                {licenseError && (
                  <p className="text-xs text-red-600">{licenseError}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {booking.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Notes internes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
                  {booking.notes}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                Services additionnels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.services.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-muted-foreground">
                  Aucun service additionnel n&apos;est lié à cette réservation.
                </div>
              ) : (
                <div className="space-y-3">
                  {booking.services.map((service) => (
                    <div
                      key={service.id}
                      className="flex flex-col gap-2 rounded-md border bg-white/50 p-3 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900">{service.name}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[11px]">
                            {pricingTypeLabels[service.pricingType]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[11px]",
                              service.active
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            )}
                          >
                            {service.active ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Tarification appliquée :{" "}
                        <span className="font-medium text-gray-900">
                          {service.pricingType === ServicePricingType.PERCENTAGE
                            ? `${service.price}%`
                            : bookingCurrencyFormatter.format(service.price)}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:space-y-4 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Euro className="h-5 w-5 text-muted-foreground" />
                Montants & paiements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">Montant total</p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  {bookingCurrencyFormatter.format(booking.totalPrice)}
                </p>
              </div>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    Acompte payé
                  </span>
                  <span className="font-semibold text-gray-900">
                    {bookingCurrencyFormatter.format(booking.depositPaid)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    Reste à payer
                  </span>
                  <span className="font-semibold text-gray-900">
                    {bookingCurrencyFormatter.format(booking.remainingAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="h-5 w-5 text-muted-foreground" />
                Véhicule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="text-base font-semibold text-gray-900">
                  {booking.vehicle.brand} {booking.vehicle.model}
                </p>
                <p className="text-muted-foreground">Immatriculation {booking.vehicle.licensePlate}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[11px]",
                    vehicleStatusColors[booking.vehicle.status] ?? "bg-gray-100 text-gray-600 border-gray-200"
                  )}
                >
                  {vehicleStatusLabels[booking.vehicle.status] ?? booking.vehicle.status}
                </Badge>
                {booking.vehicle.location && (
                  <Badge variant="outline" className="text-[11px]">
                    {booking.vehicle.location.city} • {booking.vehicle.location.name}
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-2 xl:flex-row">
                <Link href={`/admin/vehicles/${booking.vehicle.id}`} className="w-full min-w-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full whitespace-normal text-center"
                  >
                    Voir le véhicule
                  </Button>
                </Link>
                <Link
                  href={`/admin/vehicles/availability?vehicleId=${booking.vehicle.id}`}
                  className="w-full min-w-0"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full whitespace-normal text-center"
                  >
                    Consulter les disponibilités
                  </Button>
                </Link>
              </div>
              <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/80 p-3 text-xs text-muted-foreground">
                Caution recommandée :{" "}
                <span className="font-semibold text-gray-900">
                  {bookingCurrencyFormatter.format(booking.vehicle.deposit)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Historique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créée le</span>
                <span className="font-medium text-gray-900">{createdAtLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dernière mise à jour</span>
                <span className="font-medium text-gray-900">{updatedAtLabel}</span>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Pour modifier cette réservation, assurez-vous que la période n&apos;est pas passée. Les
                réservations terminées ou annulées ne peuvent pas être modifiées depuis l&apos;admin.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


