"use client";

import { memo } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface BookingHistoryCardProps {
  createdAtLabel: string;
  updatedAtLabel: string;
}

export const BookingHistoryCard = memo(function BookingHistoryCard({
  createdAtLabel,
  updatedAtLabel,
}: BookingHistoryCardProps) {
  return (
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
          Pour modifier cette réservation, assurez-vous que la période n&apos;est pas passée. Les réservations
          terminées ou annulées ne peuvent pas être modifiées depuis l&apos;admin.
        </p>
      </CardContent>
    </Card>
  );
});

