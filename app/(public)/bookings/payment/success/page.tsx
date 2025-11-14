import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PaymentSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
    booking_id?: string;
  }>;
}

export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { session_id, booking_id } = await searchParams;

  let booking = null;

  if (session_id) {
    // Récupérer la session Stripe pour obtenir le bookingId
    try {
      const stripeSession = await stripe.checkout.sessions.retrieve(session_id);
      const bookingIdFromMetadata = stripeSession.metadata?.bookingId;

      if (bookingIdFromMetadata) {
        booking = await prisma.booking.findUnique({
          where: { id: bookingIdFromMetadata },
          select: {
            id: true,
            reference: true,
            depositPaid: true,
            securityDepositPaid: true,
            totalPrice: true,
            remainingAmount: true,
            vehicle: {
              select: {
                brand: true,
                model: true,
                deposit: true,
              },
            },
          },
        });
      }
    } catch (error) {
      console.error("[Payment] Erreur lors de la récupération de la session Stripe:", error);
    }
  } else if (booking_id) {
    booking = await prisma.booking.findUnique({
      where: { id: booking_id },
      select: {
        id: true,
        reference: true,
        depositPaid: true,
        securityDepositPaid: true,
        totalPrice: true,
        remainingAmount: true,
        vehicle: {
          select: {
            brand: true,
            model: true,
            deposit: true,
          },
        },
      },
    });
  }

  if (!booking) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-2 border-green-200 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-green-50 to-green-100 pb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Paiement confirmé !
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Votre réservation a été confirmée avec succès
            </p>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Référence de réservation</p>
              <p className="text-2xl font-bold text-primary font-mono">{booking.reference}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Véhicule</span>
                <span className="font-semibold">
                  {booking.vehicle.brand} {booking.vehicle.model}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Acompte payé (30%)</span>
                <span className="font-semibold text-green-600">
                  {booking.depositPaid.toFixed(2)}€
                </span>
              </div>
              {booking.securityDepositPaid > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Caution de garantie payée</span>
                  <span className="font-semibold text-amber-600">
                    {booking.securityDepositPaid.toFixed(2)}€
                  </span>
                </div>
              )}
              {booking.remainingAmount > 0 && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Solde à la remise</span>
                  <span className="font-semibold">{booking.remainingAmount.toFixed(2)}€</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-semibold">Total de la location</span>
                <span className="font-bold text-lg">{booking.totalPrice.toFixed(2)}€</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Prochaines étapes :</strong>
                <br />
                Vous allez recevoir un email de confirmation dans quelques instants. Votre réservation sera validée par un administrateur dans les plus brefs délais.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="flex-1" variant="outline">
                <Link href="/dashboard">
                  Retour au tableau de bord
                </Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href={`/bookings/${booking.id}`}>
                  Voir ma réservation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

