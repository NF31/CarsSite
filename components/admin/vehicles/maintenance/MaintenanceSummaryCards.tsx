"use client";

import type { MaintenanceSummary } from "@/actions/admin/vehicles/get-maintenance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wrench,
  AlertTriangle,
  Euro,
  CalendarClock,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MaintenanceSummaryCardsProps {
  summary?: MaintenanceSummary | null;
  isLoading?: boolean;
}

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function MaintenanceSummaryCards({
  summary,
  isLoading,
}: MaintenanceSummaryCardsProps) {
  const active = summary?.active ?? 0;
  const scheduled = summary?.scheduled ?? 0;
  const inProgress = summary?.inProgress ?? 0;
  const overdue = summary?.overdue ?? 0;
  const completedThisMonth = summary?.completedThisMonth ?? 0;
  const totalCostThisMonth = summary?.totalCostThisMonth ?? 0;
  const totalCost = summary?.totalCost ?? 0;
  const vehiclesInMaintenance = summary?.vehiclesInMaintenance ?? 0;
  const nextMaintenance = summary?.nextMaintenance ?? null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
        {[1, 2, 3, 4].map((key) => (
          <Card key={key} className="border border-gray-200">
            <div className="h-32 animate-pulse rounded-xl bg-muted/40" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
      <Card className="border border-primary/20 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Maintenances actives
          </CardTitle>
          <Wrench className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900">{active}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {scheduled} planifiée{scheduled > 1 ? "s" : ""} • {inProgress} en cours
          </p>
        </CardContent>
      </Card>

      <Card className="border border-amber-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            État des interventions
          </CardTitle>
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900">{completedThisMonth}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {overdue > 0
              ? `${overdue} maintenance${overdue > 1 ? "s" : ""} en retard`
              : "Aucun retard détecté"}
          </p>
        </CardContent>
      </Card>

      <Card className="border border-emerald-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Coût du mois
          </CardTitle>
          <Euro className="h-5 w-5 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900">
            {currencyFormatter.format(totalCostThisMonth)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Total cumulé : {currencyFormatter.format(totalCost)}
          </p>
        </CardContent>
      </Card>

      <Card className="border border-blue-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Prochaine maintenance
          </CardTitle>
          <CalendarClock className="h-5 w-5 text-blue-500" />
        </CardHeader>
        <CardContent className="space-y-2">
          {nextMaintenance ? (
            <>
              <p className="text-base font-semibold text-gray-900">
                {format(new Date(nextMaintenance.startDate), "dd MMM yyyy HH:mm", {
                  locale: fr,
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {nextMaintenance.vehicle.label}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune maintenance planifiée prochainement.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {vehiclesInMaintenance} véhicule{vehiclesInMaintenance > 1 ? "s" : ""} indisponible{vehiclesInMaintenance > 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

