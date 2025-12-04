import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

interface PaymentExpiredPageProps {
  searchParams: Promise<{
    session_id?: string;
    booking_id?: string;
  }>;
}

export default async function PaymentExpiredPage({ searchParams }: PaymentExpiredPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { session_id, booking_id } = await searchParams;

  let booking = null;
  let stripeSession = null;

  // Récupérer les informations de la session Stripe si disponible
  if (session_id) {
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(session_id);
      const bookingIdFromMetadata = stripeSession.metadata?.bookingId;
      
      if (bookingIdFromMetadata) {
        booking = await prisma.booking.findUnique({
          where: { id: bookingIdFromMetadata },
          select: {
            id: true,
            reference: true,
            status: true,
            vehicle: {
              select: {
                brand: true,
                model: true,
              },
            },
          },
        });
      }
    } catch (error) {
      console.error("[Payment Expired] Erreur lors de la récupération de la session Stripe:", error);
    }
  } else if (booking_id) {
    booking = await prisma.booking.findUnique({
      where: { id: booking_id },
      select: {
        id: true,
        reference: true,
        status: true,
        vehicle: {
          select: {
            brand: true,
            model: true,
          },
        },
      },
    });
  }

  const isSessionExpired = stripeSession?.status === "expired";

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-2 border-amber-200 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-amber-50 to-amber-100 pb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center mb-4">
              <Clock className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              {isSessionExpired ? "Session de paiement expirée" : "Paiement en attente"}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {isSessionExpired 
                ? "Cette session de paiement a expiré. Veuillez créer une nouvelle session de paiement."
                : "Votre session de paiement n'est pas encore complétée."}
            </p>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            {booking && (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Réservation</p>
                <p className="text-2xl font-bold text-primary font-mono">{booking.reference}</p>
                {booking.vehicle && (
                  <p className="text-sm text-muted-foreground">
                    {booking.vehicle.brand} {booking.vehicle.model}
                  </p>
                )}
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Que s&apos;est-il passé ?</h3>
                {isSessionExpired ? (
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>La session de paiement Stripe a expiré (généralement après 24 heures)</li>
                    <li>Aucun paiement n&apos;a été effectué</li>
                    <li>Votre réservation reste en attente de paiement</li>
                  </ul>
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Vous avez quitté la page de paiement avant de finaliser</li>
                    <li>Le paiement n&apos;a pas été complété</li>
                    <li>Votre réservation reste en attente de paiement</li>
                  </ul>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Prochaines étapes :</strong>
                <br />
                {booking 
                  ? "Vous pouvez réessayer de payer depuis votre tableau de bord ou directement depuis cette page."
                  : "Connectez-vous à votre compte pour accéder à vos réservations et effectuer le paiement."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="flex-1" variant="outline">
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour au tableau de bord
                </Link>
              </Button>
              {booking && (
                <Button asChild className="flex-1">
                  <Link href={`/bookings/payment?bookingId=${booking.id}`}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Réessayer le paiement
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

