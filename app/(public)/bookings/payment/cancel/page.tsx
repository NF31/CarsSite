import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PaymentCancelPageProps {
  searchParams: Promise<{
    booking_id?: string;
  }>;
}

export default async function PaymentCancelPage({ searchParams }: PaymentCancelPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { booking_id } = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-2 border-amber-200 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-amber-50 to-amber-100 pb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Paiement annulé
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Votre paiement a été annulé
            </p>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground text-center">
                Vous avez annulé le processus de paiement. Votre réservation a été créée mais reste en attente de paiement.
                <br />
                <br />
                Vous pouvez réessayer de payer depuis votre tableau de bord.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="flex-1" variant="outline">
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour au tableau de bord
                </Link>
              </Button>
              {booking_id && (
                <Button asChild className="flex-1">
                  <Link href={`/bookings/payment?bookingId=${booking_id}`}>
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

