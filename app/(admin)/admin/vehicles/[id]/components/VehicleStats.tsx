import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Calendar } from "lucide-react";

interface VehicleStatsProps {
  bookingsCount: number;
  reviewsCount: number;
}

export const VehicleStats = memo(function VehicleStats({
  bookingsCount,
  reviewsCount,
}: VehicleStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Statistiques
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Réservations
          </span>
          <span className="text-2xl font-bold">{bookingsCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <Star className="h-4 w-4" />
            Avis
          </span>
          <span className="text-2xl font-bold">{reviewsCount}</span>
        </div>
      </CardContent>
    </Card>
  );
});

