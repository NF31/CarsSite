"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import type { ServiceRecord } from "@/actions/admin/services";
import type { ServicePricingType } from "@/lib/types/service-pricing-type";
import type { VehicleCategory } from "@/lib/types/vehicle-category";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ServiceToggleButton } from "./ServiceToggleButton";

const pricingTypeLabels: Record<ServicePricingType, string> = {
  PER_DAY: "Par jour",
  FIXED: "Montant fixe",
  PERCENTAGE: "Pourcentage",
};

const categoryLabels: Record<VehicleCategory, string> = {
  ECONOMY: "Économique",
  COMPACT: "Compacte",
  MID_SIZE: "Moyenne",
  FULL_SIZE: "Grande",
  SUV: "SUV",
  LUXURY: "Luxe",
  VAN: "Utilitaire",
};

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

interface ServicesGridViewProps {
  services: ServiceRecord[];
}

function renderPrice(service: ServiceRecord) {
  if (service.pricingType === "PERCENTAGE") {
    return `${service.price}%`;
  }
  return currencyFormatter.format(service.price);
}

export function ServicesGridView({ services }: ServicesGridViewProps) {
  if (services.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Aucun service à afficher avec les filtres actuels.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {services.map((service) => (
        <Card
          key={service.id}
          className={cn(
            "border shadow-sm transition hover:shadow-md",
            !service.active && "opacity-85 border-dashed"
          )}
        >
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {service.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {service.description ?? "Pas de description fournie"}
                  </p>
                </div>
              </div>
              <Badge variant={service.active ? "default" : "outline"} className="text-xs">
                {service.active ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {pricingTypeLabels[service.pricingType]}
              </Badge>
              <span className="text-sm font-semibold text-primary">{renderPrice(service)}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              {(service.availableForCategories ?? []).length === 0 ? (
                <Badge variant="outline">Toutes catégories</Badge>
              ) : (
                (service.availableForCategories ?? []).map((category) => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {categoryLabels[category]}
                  </Badge>
                ))
              )}
            </div>
            <p className="text-xs">
              Dernière mise à jour le{" "}
              <span className="font-medium">
                {format(new Date(service.updatedAt), "dd MMM yyyy", { locale: fr })}
              </span>
            </p>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </span>
              <span className="flex items-center gap-1">
                {service.active ? (
                  <ToggleLeft className="h-3.5 w-3.5" />
                ) : (
                  <ToggleRight className="h-3.5 w-3.5" />
                )}
                {service.active ? "Désactiver" : "Activer"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/services/${service.id}/edit`}>Modifier</Link>
              </Button>
              <ServiceToggleButton
                serviceId={service.id}
                serviceName={service.name}
                active={service.active}
                variant={service.active ? "ghost" : "secondary"}
                size="sm"
              />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

