"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Car,
  Euro,
  CreditCard,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ClientBookingDetail } from "@/actions/client/bookings/get-booking";
import { BookingStatus } from "@/lib/types/booking-status";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
} from "@/components/client/dashboard/dashboard-constants";
import { checkPaymentStatusAction } from "@/actions/public/payments/check-payment-status";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ClientBookingDetailsPageProps {
  booking: ClientBookingDetail;
}

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function ClientBookingDetailsPage({ booking: initialBooking }: ClientBookingDetailsPageProps) {
  const router = useRouter();
  const booking = initialBooking;
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const now = new Date();

  const derivedStatus =
    booking.status === BookingStatus.CANCELLED
      ? BookingStatus.CANCELLED
      : endDate <= now
        ? BookingStatus.COMPLETED
        : startDate <= now && now < endDate
          ? BookingStatus.IN_PROGRESS
          : booking.status;

  const mainImage = booking.vehicle.images[0] || "/placeholder-car.jpg";
  // Calculer la durée exacte (même logique que calculate-price.ts)
  const diffMs = endDate.getTime() - startDate.getTime();
  const msPerDay = 1000 * 60 * 60 * 24;
  const exactDuration = Math.max(diffMs / msPerDay, 1); // Minimum 1 jour, division exacte
  
  // Formater la durée de manière professionnelle pour l'affichage
  // Arrondir intelligemment : si la partie décimale est significative (> 0.05), arrondir vers le haut
  // Sinon, arrondir vers le bas pour éviter d'afficher des décimales
  const formatDuration = (days: number): string => {
    const wholeDays = Math.floor(days);
    const decimalPart = days - wholeDays;
    
    // Si la partie décimale est significative (> 0.05), arrondir vers le haut
    const roundedDays = decimalPart > 0.05 ? Math.ceil(days) : wholeDays;
    
    return `${roundedDays} jour${roundedDays > 1 ? "s" : ""}`;
  };
  
  const durationDisplay = formatDuration(exactDuration);
  // Utiliser la durée exacte pour les calculs, mais la version formatée pour l'affichage
  const duration = exactDuration;


  const handleCheckPayment = async () => {
    setIsCheckingPayment(true);
    try {
      const result = await checkPaymentStatusAction(booking.id);
      if (result.success && result.data?.paid) {
        toast.success("Paiement confirmé !", {
          description: "Votre paiement a été enregistré avec succès.",
        });
        // Rafraîchir la page pour afficher les nouvelles données
        router.refresh();
      } else {
        toast.info("Paiement non trouvé", {
          description: "Le paiement n&apos;a pas encore été enregistré. Si vous venez de payer, attendez quelques instants ou contactez le support.",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du paiement:", error);
      toast.error("Erreur", {
        description: "Impossible de vérifier le statut du paiement.",
      });
    } finally {
      setIsCheckingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* En-tête */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Détails de la réservation</h1>
              <p className="text-muted-foreground">Référence : {booking.reference}</p>
            </div>
            <Badge className={`${BOOKING_STATUS_COLORS[derivedStatus]} text-sm px-4 py-2`}>
              {BOOKING_STATUS_LABELS[derivedStatus]}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Véhicule */}
            <Card className="border-2 border-primary/10 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  Véhicule réservé
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="relative w-full md:w-64 h-48 rounded-lg overflow-hidden">
                    <Image
                      src={mainImage}
                      alt={`${booking.vehicle.brand} ${booking.vehicle.model}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 256px"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {booking.vehicle.brand} {booking.vehicle.model}
                      </h2>
                      <p className="text-muted-foreground">
                        {booking.vehicle.year} • {booking.vehicle.seats} places • {booking.vehicle.transmission} • {booking.vehicle.fuelType}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Immatriculation : <span className="font-mono font-semibold">{booking.vehicle.licensePlate}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {currencyFormatter.format(booking.vehicle.pricePerDay)}
                        </p>
                        <p className="text-xs text-muted-foreground">par jour</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates et lieux */}
            <Card className="border-2 border-primary/10 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Dates et lieux
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Départ
                    </div>
                    <p className="text-base font-semibold">
                      {format(startDate, "EEEE d MMMM yyyy &apos;à&apos; HH:mm", { locale: fr })}
                    </p>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{booking.pickupLocation.name}</p>
                        <p>{booking.pickupLocation.city}</p>
                        {booking.pickupLocation.address && (
                          <p className="text-xs">{booking.pickupLocation.address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Retour
                    </div>
                    <p className="text-base font-semibold">
                      {format(endDate, "EEEE d MMMM yyyy &apos;à&apos; HH:mm", { locale: fr })}
                    </p>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{booking.returnLocation.name}</p>
                        <p>{booking.returnLocation.city}</p>
                        {booking.returnLocation.address && (
                          <p className="text-xs">{booking.returnLocation.address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Durée de location</p>
                  <p className="text-lg font-semibold">
                    {durationDisplay}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Services additionnels */}
            {booking.services.length > 0 && (
              <Card className="border-2 border-primary/10 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Services additionnels
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {booking.services.map((service) => {
                      // Calculer le prix réel du service
                      const vehiclePrice = booking.vehicle.pricePerDay * duration;
                      let serviceTotal = 0;
                      
                      if (service.pricingType === "PER_DAY") {
                        serviceTotal = service.price * duration;
                      } else if (service.pricingType === "FIXED") {
                        serviceTotal = service.price;
                      } else if (service.pricingType === "PERCENTAGE") {
                        serviceTotal = (vehiclePrice * service.price) / 100;
                      } else {
                        serviceTotal = service.price;
                      }

                      return (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                        >
                          <div>
                            <p className="font-semibold">{service.name}</p>
                            {service.description && (
                              <p className="text-sm text-muted-foreground">{service.description}</p>
                            )}
                            {service.pricingType === "PERCENTAGE" && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {service.price}% du prix du véhicule
                              </p>
                            )}
                          </div>
                          <p className="font-medium text-primary">
                            {currencyFormatter.format(serviceTotal)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {booking.notes && (
              <Card className="border-2 border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-900">{booking.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Annulation */}
            {booking.cancellationRequested && (
              <Card className="border-2 border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Demande d&apos;annulation en cours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {booking.cancellationReason && (
                    <div>
                      <p className="text-sm font-medium text-red-900 mb-1">Raison :</p>
                      <p className="text-sm text-red-800">{booking.cancellationReason}</p>
                    </div>
                  )}
                  <p className="text-xs text-red-700">
                    Votre demande d&apos;annulation est en attente de traitement par l&apos;administrateur.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne latérale - Récapitulatif financier */}
          <div className="space-y-6">
            <Card className="border-2 border-primary/10 shadow-lg sticky top-4">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5 text-primary" />
                  Récapitulatif financier
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Location ({durationDisplay})</span>
                    <span className="font-semibold">
                      {currencyFormatter.format(booking.vehicle.pricePerDay * duration)}
                    </span>
                  </div>
                  {booking.services.length > 0 && (
                    <>
                      <Separator />
                      {booking.services.map((service) => {
                        // Calculer le prix réel du service
                        const vehiclePrice = booking.vehicle.pricePerDay * duration;
                        let serviceTotal = 0;
                        
                        if (service.pricingType === "PER_DAY") {
                          serviceTotal = service.price * duration;
                        } else if (service.pricingType === "FIXED") {
                          serviceTotal = service.price;
                        } else if (service.pricingType === "PERCENTAGE") {
                          serviceTotal = (vehiclePrice * service.price) / 100;
                        } else {
                          serviceTotal = service.price;
                        }

                        return (
                          <div key={service.id} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{service.name}</span>
                            <span>{currencyFormatter.format(serviceTotal)}</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-semibold">Total de la location</span>
                    <span className="text-xl font-bold text-primary">
                      {currencyFormatter.format(booking.totalPrice)}
                    </span>
                  </div>
                  <div className="space-y-2 pt-3 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Acompte payé</span>
                      <span className="font-semibold text-green-600">
                        {currencyFormatter.format(booking.depositPaid)}
                      </span>
                    </div>
                    {booking.vehicle.deposit > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          {booking.securityDepositPaid && booking.securityDepositPaid > 0
                            ? "Caution de garantie payée"
                            : "Caution de garantie"}
                        </span>
                        <span className={`font-semibold ${booking.securityDepositPaid && booking.securityDepositPaid > 0 ? "text-green-600" : "text-amber-600"}`}>
                          {currencyFormatter.format(booking.vehicle.deposit)}
                        </span>
                      </div>
                    )}
                    {booking.remainingAmount > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Solde à la remise</span>
                        <span className="font-semibold">
                          {currencyFormatter.format(booking.remainingAmount)}
                        </span>
                      </div>
                    )}
                    {booking.vehicle.deposit > 0 && (
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                        {booking.securityDepositPaid && booking.securityDepositPaid > 0
                          ? "✅ La caution de garantie a été payée et sera remboursée après restitution sans dégâts."
                          : "ⓘ La caution de garantie sera remboursée après restitution sans dégâts."}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border border-muted">
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.depositPaid === 0 && derivedStatus === BookingStatus.PENDING && (
                  <>
                    <Button asChild className="w-full" size="lg">
                      <Link href={`/bookings/payment?bookingId=${booking.id}&type=deposit`}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Payer maintenant
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleCheckPayment}
                      disabled={isCheckingPayment}
                    >
                      {isCheckingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Vérification...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Vérifier le paiement
                        </>
                      )}
                    </Button>
                  </>
                )}
                {booking.depositPaid > 0 && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">Acompte payé</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Votre acompte de {currencyFormatter.format(booking.depositPaid)} a été enregistré.
                    </p>
                  </div>
                )}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour au tableau de bord
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

