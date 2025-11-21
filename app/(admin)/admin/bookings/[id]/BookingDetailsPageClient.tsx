"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, formatDistanceStrict } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { RefundHistorySection } from "@/components/admin/bookings/RefundHistorySection";

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

// Utiliser la fonction centralisée depuis lib/booking-status-sync
import { deriveBookingStatus } from "@/lib/booking-status-sync";

function computeDynamicStatus(booking: BookingDetail): BookingStatus {
  return deriveBookingStatus({
    status: booking.status,
    startDate: booking.startDate,
    endDate: booking.endDate,
    cancellationRequested: booking.cancellationRequested ?? false,
    modificationRequested: booking.modificationRequested ?? false,
    modificationDepositDifference: booking.modificationDepositDifference ?? null,
  });
}

export function BookingDetailsPageClient({ booking }: BookingDetailsPageClientProps) {
  const router = useRouter();
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [isModerating, startModerate] = useTransition();
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [activeModeration, setActiveModeration] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false); // État supplémentaire pour bloquer immédiatement
  const [isLicensePending, startLicenseTransition] = useTransition();
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

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
  }, [booking.id, booking.reference, booking.status, booking.modificationRequested, booking.modificationDepositDifference, booking.updatedAt]);

  // Réinitialiser les états quand isModerating devient false (transition terminée)
  useEffect(() => {
    if (!isModerating) {
      // Attendre un court délai pour s'assurer que le refresh est terminé
      const timeoutId = setTimeout(() => {
        setIsProcessingAction(false);
        setActiveModeration(null);
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [isModerating]);

  const computedStatus = useMemo(() => {
    const status = computeDynamicStatus(booking);
    console.log(`[BookingDetailsPageClient] 🏷️ Statut calculé:`, {
      bookingStatus: booking.status,
      computedStatus: status,
    });
    return status;
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

  const handleModeration = (action: "approve" | "reject") => {
    // Empêcher les clics multiples - vérifier TOUS les états possibles
    if (isProcessingAction || isModerating || activeModeration !== null) {
      console.log(`[BookingDetails] ⚠️ Action déjà en cours, ignore le clic sur ${action}`, {
        isProcessingAction,
        isModerating,
        activeModeration,
      });
      return;
    }

    // Bloquer immédiatement pour éviter les clics multiples
    setIsProcessingAction(true);
    setModerationError(null);
    
    // Si c'est un refus d'annulation OU de modification, ouvrir le dialog pour saisir le message
    const isModification = booking.modificationRequested || (booking.modificationDepositDifference ?? 0) > 0;
    if (action === "reject" && (isCancellationRequest || isModification)) {
      setRejectionDialogOpen(true);
      setIsProcessingAction(false); // Réinitialiser si on ouvre juste le dialog
      return;
    }

    // Sinon, procéder directement
    setActiveModeration(action);

    startModerate(async () => {
      try {
        const result = await moderateBookingStatusAction({
          bookingId: booking.id,
          action,
        });

        if (!result.success) {
          setModerationError(result.error ?? "Erreur lors de la validation/refus de la réservation.");
          toast.error(result.error ?? "Erreur lors de la validation/refus de la réservation.");
          setIsProcessingAction(false);
          setActiveModeration(null);
          return;
        }

        // Déterminer le type de demande pour afficher le bon message
        const isModification = booking.modificationRequested || (booking.modificationDepositDifference ?? 0) > 0;
        const isCancellation = booking.cancellationRequested;

        if (action === "approve") {
          if (isModification) {
            toast.success("Modification validée !", {
              description: `L'email a été envoyé au client avec les instructions de paiement.`,
            });
          } else if (isCancellation) {
            toast.success("Annulation validée !", {
              description: `L'email de confirmation d'annulation a été envoyé au client.`,
            });
          } else {
            toast.success("Réservation validée !", {
              description: `L'email de confirmation a été envoyé au client.`,
            });
          }
        } else {
          if (isModification) {
            toast.success("Modification refusée", {
              description: `L'email de refus a été envoyé au client.`,
            });
          } else if (isCancellation) {
            toast.success("Annulation refusée", {
              description: `L'email de refus d'annulation a été envoyé au client.`,
            });
          } else {
            toast.success("Réservation refusée", {
              description: `L'email de refus a été envoyé au client.`,
            });
          }
        }

        // Réinitialiser les états
        setIsProcessingAction(false);
        setActiveModeration(null);
        
        // Logs pour déboguer
        console.log("[BookingDetails] ✅ Action réussie, préparation de la redirection...");
        console.log("[BookingDetails] 📊 Détails de l'action:");
        console.log(`   - Action: ${action}`);
        console.log(`   - Type: ${isModification ? "modification" : isCancellation ? "annulation" : "réservation"}`);
        console.log(`   - Booking ID: ${booking.id}`);
        console.log(`   - Référence: ${booking.reference}`);
        console.log(`   - Statut actuel (avant redirection): ${booking.status}`);
        console.log(`   - modificationDepositDifference: ${booking.modificationDepositDifference ?? "N/A"}€`);
        console.log(`   - Redirection dans: 500ms`);
        console.log(`   - Destination: /admin/bookings`);
        
        // Rediriger vers la liste des réservations après traitement
        setTimeout(() => {
          console.log("[BookingDetails] 🚀 Exécution de la redirection vers /admin/bookings...");
          router.push("/admin/bookings");
        }, 500);
      } catch (error) {
        console.error("Erreur lors de la modération", error);
        const errorMessage = "Une erreur inattendue est survenue.";
        setModerationError(errorMessage);
        toast.error(errorMessage);
        setIsProcessingAction(false);
        setActiveModeration(null);
      }
    });
  };

  const handleRejectionConfirm = () => {
    // Empêcher les clics multiples - vérifier TOUS les états possibles
    if (isProcessingAction || isModerating || activeModeration !== null) {
      console.log(`[BookingDetails] ⚠️ Action déjà en cours, ignore la confirmation de refus`, {
        isProcessingAction,
        isModerating,
        activeModeration,
      });
      return;
    }

    const isModification = booking.modificationRequested || (booking.modificationDepositDifference ?? 0) > 0;
    if (!rejectionReason.trim()) {
      setModerationError(
        isModification
          ? "Veuillez saisir un message expliquant pourquoi vous refusez cette modification."
          : "Veuillez saisir un message expliquant pourquoi vous conservez la réservation."
      );
      return;
    }

    // Bloquer immédiatement pour éviter les clics multiples
    setIsProcessingAction(true);
    setRejectionDialogOpen(false);
    setActiveModeration("reject");

    startModerate(async () => {
      try {
        const result = await moderateBookingStatusAction({
          bookingId: booking.id,
          action: "reject",
          rejectionReason: rejectionReason.trim(),
        });

        if (!result.success) {
          const errorMessage = result.error ?? "Erreur lors de la conservation de la réservation.";
          setModerationError(errorMessage);
          toast.error(errorMessage);
          setIsProcessingAction(false);
          setActiveModeration(null);
          return;
        }

        // Déterminer le type pour afficher le bon message
        const isModification = booking.modificationRequested || (booking.modificationDepositDifference ?? 0) > 0;
        const isCancellation = booking.cancellationRequested;

        if (isModification) {
          toast.success("Modification refusée", {
            description: `L'email de refus a été envoyé au client.`,
          });
        } else if (isCancellation) {
          toast.success("Annulation refusée", {
            description: `L'email de refus d'annulation a été envoyé au client.`,
          });
        } else {
          toast.success("Réservation refusée", {
            description: `L'email de refus a été envoyé au client.`,
          });
        }

        // Réinitialiser le message et les états
        setRejectionReason("");
        setIsProcessingAction(false);
        setActiveModeration(null);
        
        // Logs pour déboguer
        console.log("[BookingDetails] ✅ Action réussie, redirection vers la liste des réservations...");
        
        // Rediriger vers la liste des réservations après traitement
        setTimeout(() => {
          console.log("[BookingDetails] 🚀 Exécution de la redirection vers /admin/bookings...");
          router.push("/admin/bookings");
        }, 500);
      } catch (error) {
        console.error("Erreur lors de la conservation", error);
        const errorMessage = "Une erreur inattendue est survenue.";
        setModerationError(errorMessage);
        toast.error(errorMessage);
        setIsProcessingAction(false);
        setActiveModeration(null);
      }
    });
  };

  // Vérifier si la réservation nécessite une validation (statut PENDING)
  const needsValidation = computedStatus === BookingStatus.PENDING;
  const isCancellationRequest = booking.cancellationRequested === true;
  const isModificationRequest = booking.modificationRequested === true;
  // Désactiver les boutons si une action est en cours - utiliser TOUS les états pour être sûr
  const isProcessing = isProcessingAction || isModerating || activeModeration !== null;

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
            {isModificationRequest ? (
              <>
                <strong>📅 Demande de modification de dates du client</strong>
                <br />
                Le client a demandé la modification des dates de cette réservation.
                {booking.modificationRequestedAt && (
                  <>
                    <br />
                    <strong>Demandée le :</strong> {formatDateTime(booking.modificationRequestedAt)}
                  </>
                )}
                
                {/* Informations de modification */}
                {booking.originalStartDate && booking.originalEndDate && booking.originalTotalPrice !== null && (
                  <>
                    <br />
                    <br />
                    <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3">
                      <strong className="text-blue-900">📊 Comparaison des dates et prix :</strong>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-blue-800 font-semibold mb-1">Dates originales :</p>
                            <p className="text-blue-900">
                              {formatDateTime(booking.originalStartDate)} → {formatDateTime(booking.originalEndDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-800 font-semibold mb-1">Nouvelles dates :</p>
                            <p className="text-blue-900 font-semibold">
                              {formatDateTime(booking.startDate)} → {formatDateTime(booking.endDate)}
                            </p>
                          </div>
                        </div>
                        <div className="border-t border-blue-200 pt-2 mt-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-blue-800 font-semibold mb-1">Prix original :</p>
                              <p className="text-blue-900">
                                {bookingCurrencyFormatter.format(booking.originalTotalPrice)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-blue-800 font-semibold mb-1">Nouveau prix :</p>
                              <p className="text-blue-900 font-semibold">
                                {bookingCurrencyFormatter.format(booking.totalPrice)}
                              </p>
                            </div>
                          </div>
                          {booking.originalTotalPrice !== booking.totalPrice && (
                            <div className="mt-2 pt-2 border-t border-blue-200">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-blue-800 font-semibold">Différence de prix :</span>
                                <span className={cn(
                                  "font-bold",
                                  booking.totalPrice > booking.originalTotalPrice ? "text-amber-700" : "text-green-700"
                                )}>
                                  {booking.totalPrice > booking.originalTotalPrice ? "+" : ""}
                                  {bookingCurrencyFormatter.format(booking.totalPrice - booking.originalTotalPrice)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Détails du remboursement/paiement */}
                {booking.modificationDepositDifference !== null && booking.originalDepositPaid !== null && (
                  <>
                    <br />
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                      <strong className="text-amber-900">💰 Détails du remboursement/paiement :</strong>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-amber-800">Acompte payé (original) :</span>
                          <span className="font-semibold text-amber-900">
                            {bookingCurrencyFormatter.format(booking.originalDepositPaid)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-800">Nouvel acompte (30%) :</span>
                          <span className="font-semibold text-amber-900">
                            {bookingCurrencyFormatter.format(booking.depositPaid)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-amber-200 pt-1 mt-1">
                          <span className="text-amber-800">Différence d&apos;acompte :</span>
                          <span className={cn(
                            "font-semibold",
                            booking.modificationDepositDifference > 0 ? "text-red-700" : "text-green-700"
                          )}>
                            {booking.modificationDepositDifference > 0 ? "+" : ""}
                            {bookingCurrencyFormatter.format(booking.modificationDepositDifference)}
                          </span>
                        </div>
                        {booking.modificationDepositDifference < 0 && (
                          <p className="text-xs text-green-700 mt-2 italic">
                            ✅ Un remboursement de {bookingCurrencyFormatter.format(Math.abs(booking.modificationDepositDifference))} sera effectué automatiquement via Stripe.
                          </p>
                        )}
                        {booking.modificationDepositDifference > 0 && (
                          <p className="text-xs text-amber-700 mt-2 italic">
                            💳 Un paiement supplémentaire de {bookingCurrencyFormatter.format(booking.modificationDepositDifference)} sera demandé au client (seulement la différence, pas le nouvel acompte en entier).
                            {booking.securityDepositPaid > 0 && (
                              <span className="block mt-1">
                                ℹ️ La caution de garantie ({bookingCurrencyFormatter.format(booking.securityDepositPaid)}) a déjà été payée et ne sera pas redemandée.
                              </span>
                            )}
                          </p>
                        )}
                        {booking.modificationDepositDifference === 0 && (
                          <p className="text-xs text-blue-700 mt-2 italic">
                            ℹ️ Aucun remboursement ni paiement supplémentaire nécessaire.
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
                
                <br />
                <br />
                <strong>Actions possibles :</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>Valider la modification</strong> : Les nouvelles dates seront confirmées. {booking.modificationDepositDifference !== null && booking.modificationDepositDifference < 0 ? `Un remboursement de ${bookingCurrencyFormatter.format(Math.abs(booking.modificationDepositDifference))} sera effectué automatiquement via Stripe.` : booking.modificationDepositDifference !== null && booking.modificationDepositDifference > 0 ? `Une session de paiement de ${bookingCurrencyFormatter.format(booking.modificationDepositDifference)} sera créée pour le client.` : "Aucun remboursement ni paiement supplémentaire ne sera nécessaire."}</li>
                  <li><strong>Refuser la modification</strong> : Les dates originales seront restaurées et la réservation repassera en statut {booking.cancellationPreviousStatus ? BOOKING_STATUS_LABELS[booking.cancellationPreviousStatus] : "CONFIRMED"}. Aucun remboursement ni paiement ne sera effectué.</li>
                </ul>
              </>
            ) : isCancellationRequest ? (
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
                
                {/* Informations de remboursement */}
                {booking.depositPaid > 0 && booking.cancellationRequestedRefundRate !== null && (
                  <>
                    <br />
                    <br />
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                      <strong className="text-amber-900">💰 Détails du remboursement :</strong>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-amber-800">Acompte payé :</span>
                          <span className="font-semibold text-amber-900">
                            {bookingCurrencyFormatter.format(booking.depositPaid)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-800">Taux de remboursement :</span>
                          <span className="font-semibold text-amber-900">
                            {(booking.cancellationRequestedRefundRate * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-amber-200 pt-1 mt-1">
                          <span className="text-amber-800">Montant à rembourser :</span>
                          <span className="font-semibold text-green-700">
                            {bookingCurrencyFormatter.format(
                              Math.round(booking.depositPaid * booking.cancellationRequestedRefundRate * 100) / 100
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-800">Frais retenus :</span>
                          <span className="font-semibold text-red-700">
                            {bookingCurrencyFormatter.format(
                              Math.round((booking.depositPaid - booking.depositPaid * booking.cancellationRequestedRefundRate) * 100) / 100
                            )}
                          </span>
                        </div>
                        {booking.cancellationRequestedRefundRate === 0 && (
                          <p className="text-xs text-amber-700 mt-2 italic">
                            ⚠️ Aucun remboursement ne sera effectué selon la politique d&apos;annulation.
                          </p>
                        )}
                        {booking.cancellationRequestedRefundRate === 1 && (
                          <p className="text-xs text-green-700 mt-2 italic">
                            ✅ Remboursement intégral de l&apos;acompte.
                          </p>
                        )}
                        {booking.cancellationRequestedRefundRate === 0.5 && (
                          <p className="text-xs text-amber-700 mt-2 italic">
                            ℹ️ Remboursement partiel de 50% de l&apos;acompte.
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
                
                <br />
                <br />
                <strong>Actions possibles :</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>Conserver la réservation</strong> : La réservation sera restaurée à son statut précédent ({booking.cancellationPreviousStatus ? BOOKING_STATUS_LABELS[booking.cancellationPreviousStatus] : "CONFIRMED"}) et les dates seront conservées. Aucun remboursement ne sera effectué.</li>
                  <li><strong>Accepter l&apos;annulation</strong> : La réservation sera annulée et les dates seront libérées. {booking.depositPaid > 0 && booking.cancellationRequestedRefundRate !== null && booking.cancellationRequestedRefundRate > 0 ? `Un remboursement de ${bookingCurrencyFormatter.format(Math.round(booking.depositPaid * booking.cancellationRequestedRefundRate * 100) / 100)} sera effectué automatiquement.` : "Aucun remboursement ne sera effectué."}</li>
                </ul>
              </>
            ) : (
              "Cette réservation est en attente de validation. Utilisez les boutons ci-dessus pour valider ou refuser."
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Historique des remboursements */}
      <RefundHistorySection bookingId={booking.id} />

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

      {/* Dialog pour saisir le message de refus (annulation ou modification) */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isCancellationRequest ? "Conserver la réservation" : "Refuser la modification"}
            </DialogTitle>
            <DialogDescription>
              {isCancellationRequest
                ? "Veuillez expliquer pourquoi vous conservez cette réservation. Ce message sera envoyé au client par email."
                : "Veuillez expliquer pourquoi vous refusez cette modification de dates. Ce message sera envoyé au client par email."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">
                Message au client <span className="text-muted-foreground">(optionnel mais recommandé)</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder={
                  isCancellationRequest
                    ? "Ex: La réservation est confirmée et le véhicule est disponible. Nous ne pouvons pas accepter l'annulation à ce stade..."
                    : "Ex: Les nouvelles dates demandées ne sont pas disponibles. Le véhicule est déjà réservé pour cette période..."
                }
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                maxLength={500}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {rejectionReason.length}/500 caractères
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectionDialogOpen(false);
                setRejectionReason("");
              }}
              disabled={isModerating && activeModeration === "reject"}
            >
              Annuler
            </Button>
            <Button
              onClick={handleRejectionConfirm}
              disabled={isModerating && activeModeration === "reject"}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isModerating && activeModeration === "reject" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {isCancellationRequest ? "Confirmer la conservation" : "Confirmer le refus"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


