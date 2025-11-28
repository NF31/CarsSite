import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { currencyFormatter } from "../utils/formatters";

interface OperationalTrackingProps {
  pendingInvoices: number;
  maintenanceVehicles: number;
  availableVehicles: number;
  reservedVehicles: number;
  maintenanceCount: number;
  maintenanceCost: number;
  maintenanceCompleted: number;
  maintenanceUpcoming: number;
  servicesCount: number;
  topServiceLabel: string | null;
  topServiceCount: number;
}

export const OperationalTracking = memo(function OperationalTracking({
  pendingInvoices,
  maintenanceVehicles,
  availableVehicles,
  reservedVehicles,
  maintenanceCount,
  maintenanceCost,
  maintenanceCompleted,
  maintenanceUpcoming,
  servicesCount,
  topServiceLabel,
  topServiceCount,
}: OperationalTrackingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Suivi opérationnel</CardTitle>
        <CardDescription>Mettez en place vos actions prioritaires.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border/50 bg-muted/10 px-4 py-3">
          <p className="font-medium text-foreground">
            {pendingInvoices.toLocaleString("fr-FR")} facture
            {pendingInvoices > 1 ? "s" : ""} à régulariser
          </p>
          <p>
            Relancez les clients concernés ou marquez les factures comme payées pour assainir votre
            trésorerie.
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/10 px-4 py-3">
          <p className="font-medium text-foreground">
            {maintenanceVehicles.toLocaleString("fr-FR")} véhicule
            {maintenanceVehicles > 1 ? "s" : ""} en maintenance
          </p>
          <p>Planifiez une remise en circulation pour maintenir un bon niveau de disponibilité.</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/10 px-4 py-3">
          <p className="font-medium text-foreground">
            {availableVehicles.toLocaleString("fr-FR")} véhicule
            {availableVehicles > 1 ? "s disponibles" : " disponible"}
          </p>
          <p>
            Optimisez le taux d&apos;occupation en orientant les clients vers les modèles actuellement
            libres.
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/10 px-4 py-3">
          <p className="font-medium text-foreground">
            {reservedVehicles.toLocaleString("fr-FR")} réservation
            {reservedVehicles > 1 ? "s en cours" : " en cours"}
          </p>
          <p>Vérifiez les départs imminents pour anticiper les états des lieux de sortie.</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/10 px-4 py-3">
          <p className="font-medium text-foreground">
            {maintenanceCount.toLocaleString("fr-FR")} intervention maintenance
          </p>
          <p>
            Coût cumulé :{" "}
            {currencyFormatter.format(maintenanceCost || 0)} •{" "}
            {maintenanceCompleted.toLocaleString("fr-FR")} clôturées ·{" "}
            {maintenanceUpcoming.toLocaleString("fr-FR")} à venir
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/10 px-4 py-3">
          <p className="font-medium text-foreground">
            {servicesCount.toLocaleString("fr-FR")} option
            {servicesCount > 1 ? "s additionnelles vendues" : " additionnelle vendue"}
          </p>
          <p>
            {topServiceLabel
              ? `Service le plus populaire : ${topServiceLabel} (${topServiceCount.toLocaleString(
                  "fr-FR",
                )})`
              : "Aucun service supplémentaire vendu sur cette période."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

