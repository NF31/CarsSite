import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

export default function AdminBookingsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Réservations</h1>
          <p className="text-sm text-muted-foreground">
            Consultez et gérez toutes les réservations clients. La vue détaillée est en cours de réalisation.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/bookings/add">
            <CalendarDays className="mr-2 h-4 w-4" />
            Nouvelle réservation
          </Link>
        </Button>
      </header>

      <div className="rounded-lg border border-dashed bg-white px-6 py-12 text-center text-sm text-muted-foreground">
        La liste des réservations sera disponible prochainement. En attendant, vous pouvez créer une réservation
        manuellement via le bouton ci-dessus.
      </div>
    </div>
  );
}



