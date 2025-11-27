"use client";

import { memo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CalendarStatsCardsProps {
  totalBookings: number;
  activeBookings: number;
  upcomingBookings: number;
  completedThisMonth: number;
  cancelledThisMonth: number;
  currentMonthName: string;
}

export const CalendarStatsCards = memo(function CalendarStatsCards({
  totalBookings,
  activeBookings,
  upcomingBookings,
  completedThisMonth,
  cancelledThisMonth,
  currentMonthName,
}: CalendarStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Réservations enregistrées</CardDescription>
          <CardTitle className="text-2xl">{totalBookings.toLocaleString("fr-FR")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Total cumulé depuis l&apos;ouverture de l&apos;administration.
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>En cours aujourd&apos;hui</CardDescription>
          <CardTitle className="text-2xl">{activeBookings.toLocaleString("fr-FR")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Réservations actives (véhicule actuellement loué).
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>À venir</CardDescription>
          <CardTitle className="text-2xl">{upcomingBookings.toLocaleString("fr-FR")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Réservations confirmées ou en attente dont le départ n&apos;est pas encore passé.
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Ce mois-ci</CardDescription>
          <CardTitle className="text-2xl">
            {completedThisMonth.toLocaleString("fr-FR")} terminé{completedThisMonth > 1 ? "es" : ""}{" "}
            / {cancelledThisMonth.toLocaleString("fr-FR")} annulé{cancelledThisMonth > 1 ? "es" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Bilan des réservations clôturées et annulées depuis le 1er {currentMonthName}.
        </CardContent>
      </Card>
    </div>
  );
});

