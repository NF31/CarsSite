"use client";

import { useState } from "react";
import { createCheckoutSessionAction } from "@/actions/public/payments/create-checkout-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, Shield, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PaymentPageClientProps {
  booking: {
    id: string;
    reference: string;
    vehicle: {
      brand: string;
      model: string;
      year: number;
      licensePlate: string;
    };
    period: string;
  };
  paymentDetails: {
    downPayment: number;
    securityDeposit: number;
    totalToPay: number;
    remainingAmount: number;
  };
  paymentType?: string; // "deposit" | "full" | "authorization"
  paymentDescription?: string;
  backToStep4Url?: string; // URL pour revenir à l'étape 4
}

export function PaymentPageClient({ booking, paymentDetails, paymentType = "full", paymentDescription, backToStep4Url }: PaymentPageClientProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const description = paymentDescription || `Paiement pour la réservation ${booking.reference} - ${booking.vehicle.brand} ${booking.vehicle.model}`;

      const result = await createCheckoutSessionAction({
        bookingId: booking.id,
        amount: paymentDetails.totalToPay,
        description,
        paymentType: paymentType as "deposit" | "full" | "authorization",
      });

      if (result.success && result.url) {
        // Rediriger vers Stripe Checkout
        window.location.href = result.url;
      } else {
        setError(result.error || "Erreur lors de la création de la session de paiement");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Erreur lors du paiement:", error);
      setError("Une erreur inattendue est survenue.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href={backToStep4Url || `/bookings/${booking.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backToStep4Url ? "Retour à l'étape 4" : "Retour à la réservation"}
              </Link>
            </Button>
            <span className="text-muted-foreground">•</span>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href="/dashboard">
                Tableau de bord
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Paiement sécurisé</h1>
          <p className="text-muted-foreground">
            Finalisez votre réservation en toute sécurité
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Colonne principale - Détails du paiement */}
          <div className="lg:col-span-2 space-y-6">
            {/* Récapitulatif de la réservation */}
            <Card className="border-2 border-primary/10 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Récapitulatif de votre réservation
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between pb-4 border-b">
                    <div>
                      <p className="font-semibold text-lg">
                        {booking.vehicle.brand} {booking.vehicle.model}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.vehicle.year} • {booking.vehicle.licensePlate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Référence</p>
                      <p className="font-mono font-semibold text-primary">{booking.reference}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Période de location</p>
                    <p className="text-base">{booking.period}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Détails du paiement */}
            <Card className="border-2 border-primary/10 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Détails du paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {paymentType === "deposit" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">Acompte (30%)</span>
                        <span className="font-semibold">{paymentDetails.downPayment.toFixed(2)}€</span>
                      </div>
                      {paymentDetails.securityDeposit > 0 && (
                        <div className="flex justify-between items-center py-2 border-b">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-amber-600" />
                            <span className="text-sm text-muted-foreground">Caution de garantie</span>
                            <span className="text-xs text-muted-foreground">(bloquée plus tard)</span>
                          </div>
                          <span className="font-semibold text-muted-foreground">
                            {paymentDetails.securityDeposit.toFixed(2)}€
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-base font-semibold">Total à payer maintenant</span>
                        <span className="text-2xl font-bold text-primary">
                          {paymentDetails.totalToPay.toFixed(2)}€
                        </span>
                      </div>
                    </div>
                  )}
                  {paymentType === "full" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Acompte (30%)</span>
                      <span className="font-semibold">{paymentDetails.downPayment.toFixed(2)}€</span>
                    </div>
                    {paymentDetails.securityDeposit > 0 && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-amber-600" />
                          <span className="text-sm text-muted-foreground">Caution de garantie</span>
                        </div>
                        <span className="font-semibold text-amber-600">
                          {paymentDetails.securityDeposit.toFixed(2)}€
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-base font-semibold">Total à payer maintenant</span>
                      <span className="text-2xl font-bold text-primary">
                        {paymentDetails.totalToPay.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                  )}
                  {paymentType === "authorization" && (
                    <div className="space-y-3">
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm font-semibold text-blue-800 mb-2">⚠️ Empreinte bancaire uniquement</p>
                        <p className="text-xs text-blue-700">
                          Aucun débit ne sera effectué. Le montant sera simplement bloqué sur votre carte et libéré après restitution sans dégâts.
                        </p>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">Acompte (30%)</span>
                        <span className="font-semibold text-muted-foreground">0,00€</span>
                        <span className="text-xs text-muted-foreground">(sur place)</span>
                      </div>
                      {paymentDetails.securityDeposit > 0 && (
                        <div className="flex justify-between items-center py-2 border-b">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-amber-600" />
                            <span className="text-sm text-muted-foreground">Caution de garantie (empreinte)</span>
                          </div>
                          <span className="font-semibold text-amber-600">
                            {paymentDetails.securityDeposit.toFixed(2)}€
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-base font-semibold">Montant à bloquer</span>
                        <span className="text-2xl font-bold text-primary">
                          {paymentDetails.totalToPay.toFixed(2)}€
                        </span>
                      </div>
                    </div>
                  )}
                  {paymentDetails.remainingAmount > 0 && (
                    <Alert className="mt-4 bg-blue-50 border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm text-blue-800">
                        <strong>Solde à la remise :</strong> {paymentDetails.remainingAmount.toFixed(2)}€
                        <br />
                        Ce montant sera à régler lors de la remise du véhicule.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Erreur */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Boutons d'action */}
            <div className="space-y-3">
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-200 h-14 text-lg font-semibold"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {paymentType === "authorization" ? "Redirection vers l'empreinte..." : "Redirection vers le paiement..."}
                  </>
                ) : paymentType === "deposit" ? (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Payer l&apos;acompte {paymentDetails.totalToPay.toFixed(2)}€
                  </>
                ) : paymentType === "authorization" ? (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Confirmer l&apos;empreinte {paymentDetails.totalToPay.toFixed(2)}€
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Payer {paymentDetails.totalToPay.toFixed(2)}€ maintenant
                  </>
                )}
              </Button>
              
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full h-12"
                disabled={isProcessing}
              >
                <Link href={`/bookings/${booking.id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour aux détails de la réservation
                </Link>
              </Button>
            </div>

            {/* Sécurité */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
              <Shield className="h-4 w-4" />
              <span>Paiement sécurisé par Stripe • Vos données sont protégées</span>
            </div>
          </div>

          {/* Colonne latérale - Informations */}
          <div className="space-y-6">
            <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Paiement sécurisé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Paiement crypté et sécurisé par Stripe</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Aucune donnée bancaire stockée sur nos serveurs</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Confirmation immédiate de votre paiement</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-muted">
              <CardHeader>
                <CardTitle className="text-lg">Ce qui se passe ensuite</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    1
                  </div>
                  <p>Vous serez redirigé vers la page de paiement sécurisée Stripe</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    2
                  </div>
                  <p>Entrez vos informations de carte bancaire</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    3
                  </div>
                  <p>Confirmez votre paiement</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    4
                  </div>
                  <p>Vous recevrez une confirmation par email</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

