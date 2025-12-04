import { Metadata } from "next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Calendar, MapPin, Car, Euro } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Confirmation de réservation - CarRental",
  description: "Votre réservation a été confirmée",
};

interface BookingConfirmationPageProps {
  searchParams: Promise<{
    reference?: string;
  }>;
}

export default async function BookingConfirmationPage({
  searchParams,
}: BookingConfirmationPageProps) {
  const params = await searchParams;
  const reference = params.reference;

  if (!reference) {
    redirect("/vehicles");
  }

  // Récupérer la réservation
  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      vehicle: {
        select: {
          brand: true,
          model: true,
          year: true,
          licensePlate: true,
          images: true,
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
    },
  });

  if (!booking) {
    redirect("/vehicles");
  }

  const mainImage = booking.vehicle.images[0] || "/placeholder-car.jpg";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* En-tête de confirmation */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Réservation confirmée !</h1>
        <p className="text-muted-foreground">
          Votre réservation a été enregistrée avec succès
        </p>
      </div>

      {/* Référence de réservation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Référence de réservation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-primary">{booking.reference}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Conservez cette référence pour toutes vos démarches
          </p>
        </CardContent>
      </Card>

      {/* Détails de la réservation */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Véhicule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Véhicule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">
                {booking.vehicle.brand} {booking.vehicle.model}
              </p>
              <p className="text-sm text-muted-foreground">
                {booking.vehicle.year} • {booking.vehicle.licensePlate}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-semibold">Départ</p>
                <p className="text-sm text-muted-foreground">
                  {format(booking.startDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Retour</p>
                <p className="text-sm text-muted-foreground">
                  {format(booking.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lieux */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Lieux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Retrait</p>
                <p className="text-sm text-muted-foreground">
                  {booking.pickupLocation.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {booking.pickupLocation.city}
                  {booking.pickupLocation.address && ` • ${booking.pickupLocation.address}`}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Retour</p>
                <p className="text-sm text-muted-foreground">
                  {booking.returnLocation.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {booking.returnLocation.city}
                  {booking.returnLocation.address && ` • ${booking.returnLocation.address}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Prix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total</span>
                <span className="font-semibold">{booking.totalPrice.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Acompte</span>
                <span>{booking.depositPaid.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Solde à la remise</span>
                <span>{booking.remainingAmount.toFixed(2)}€</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations importantes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informations importantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              • Vous recevrez un email de confirmation avec tous les détails de votre réservation
            </p>
            <p>
              • Veuillez vous présenter à l'agence de retrait avec votre permis de conduire et une pièce d'identité
            </p>
            <p>
              • Le paiement sera effectué à la remise du véhicule
            </p>
            <p>
              • En cas de modification ou d'annulation, contactez-nous au plus tôt
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild variant="outline">
          <Link href="/vehicles">Faire une autre réservation</Link>
        </Button>
        <Button asChild>
          <Link href="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
}

