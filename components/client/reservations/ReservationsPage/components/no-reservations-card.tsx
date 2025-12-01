import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { History, ArrowUpRight } from "lucide-react";

export function NoReservationsCard() {
  return (
    <Card className="border border-dashed border-slate-200 bg-slate-50">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <History className="h-10 w-10 text-muted-foreground" />
        <div className="space-y-2">
          <p className="text-base font-semibold text-gray-900">Aucune réservation pour le moment</p>
          <p className="text-sm text-muted-foreground">
            Explorez notre flotte et réservez votre premier véhicule en quelques minutes.
          </p>
        </div>
        <Button asChild>
          <Link href="/vehicles" className="inline-flex items-center gap-2">
            Découvrir les véhicules
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

