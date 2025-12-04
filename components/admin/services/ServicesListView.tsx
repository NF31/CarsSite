"use client";

import Link from "next/link";
import type { ServiceRecord } from "@/actions/admin/services";
import type { ServicePricingType } from "@/lib/types/service-pricing-type";
import type { VehicleCategory } from "@/lib/types/vehicle-category";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Gift, MoreVertical } from "lucide-react";
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

interface ServicesListViewProps {
  services: ServiceRecord[];
  startIndex?: number;
}

function renderPrice(service: ServiceRecord) {
  if (service.pricingType === "PERCENTAGE") {
    return `${service.price}%`;
  }
  return currencyFormatter.format(service.price);
}

export function ServicesListView({ services, startIndex = 0 }: ServicesListViewProps) {
  if (services.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-white">
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          Aucun service à afficher avec les filtres actuels.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vue cartes pour mobile / tablette */}
      <div className="grid gap-3 lg:hidden">
        {services.map((service, index) => (
          <div
            key={service.id}
            className={cn(
              "rounded-lg border bg-white p-4 shadow-sm space-y-3",
              !service.active && "opacity-85 border-dashed"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Gift className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    #{startIndex + index + 1}
                  </p>
                  <p className="text-base font-semibold text-gray-900">{service.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {service.description ?? "Pas de description"}
                  </p>
                </div>
              </div>
              <Badge variant={service.active ? "default" : "outline"} className="text-[10px]">
                {service.active ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary" className="text-xs">
                {pricingTypeLabels[service.pricingType]}
              </Badge>
              <span className="font-semibold text-primary">{renderPrice(service)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(service.availableForCategories ?? []).length === 0 ? (
                <Badge variant="outline" className="text-xs">
                  Toutes catégories
                </Badge>
              ) : (
                (service.availableForCategories ?? []).map((category) => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {categoryLabels[category]}
                  </Badge>
                ))
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href={`/admin/services/${service.id}/edit`}>Modifier</Link>
              </Button>
              <ServiceToggleButton
                serviceId={service.id}
                serviceName={service.name}
                active={service.active}
                variant={service.active ? "ghost" : "secondary"}
                size="sm"
                className="flex-1"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Vue compacte (breakpoint lg) */}
      <div className="hidden lg:block xl:hidden border rounded-lg overflow-hidden bg-white shadow-sm">
        <table className="w-full table-auto divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 min-w-[56px]">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 min-w-[200px]">
                Service
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 min-w-[160px]">
                Tarification
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 min-w-[120px]">
                Statut
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 min-w-[150px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {services.map((service, index) => (
              <tr key={service.id} className={cn(!service.active && "opacity-85" )}>
                <td className="px-4 py-3 text-center text-xs text-muted-foreground align-top">
                  {startIndex + index + 1}
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{service.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {service.description ?? "Pas de description"}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="space-y-1">
                    <Badge variant="secondary" className="text-[11px]">
                      {pricingTypeLabels[service.pricingType]}
                    </Badge>
                    <div className="text-xs text-muted-foreground">{renderPrice(service)}</div>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <Badge variant={service.active ? "default" : "outline"} className="text-[11px]">
                    {service.active ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/services/${service.id}/edit`}>Modifier</Link>
                        </DropdownMenuItem>
                        <ServiceToggleButton
                          serviceId={service.id}
                          serviceName={service.name}
                          active={service.active}
                          trigger={({ onClick, isPending }) => (
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault();
                                onClick();
                              }}
                              disabled={isPending}
                            >
                              {service.active ? "Désactiver" : "Activer"}
                            </DropdownMenuItem>
                          )}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue détaillée (breakpoint xl) */}
      <div className="hidden xl:block">
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 min-w-[60px]">
                  #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 min-w-[240px]">
                  Service
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 min-w-[160px]">
                  Tarification
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 min-w-[240px]">
                  Catégories
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 min-w-[120px]">
                  Statut
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 min-w-[160px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {services.map((service, index) => (
                <tr key={service.id} className={cn(!service.active && "opacity-85")}>
                  <td className="px-6 py-4 text-sm text-muted-foreground text-center">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <p className="text-sm font-semibold text-gray-900 truncate">{service.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {service.description ?? "Pas de description"}
                    </p>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1">
                      <Badge variant="secondary" className="text-xs">
                        {pricingTypeLabels[service.pricingType]}
                      </Badge>
                      <div className="text-xs text-muted-foreground">{renderPrice(service)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-wrap gap-1.5 max-w-[320px]">
                      {(service.availableForCategories ?? []).length === 0 ? (
                        <Badge variant="outline" className="text-xs">
                          Toutes catégories
                        </Badge>
                      ) : (
                        (service.availableForCategories ?? []).map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {categoryLabels[category]}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <Badge variant={service.active ? "default" : "outline"} className="text-xs">
                      {service.active ? "Actif" : "Inactif"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <Button size="sm" variant="outline" className="h-9 px-4" asChild>
                        <Link href={`/admin/services/${service.id}/edit`}>Modifier</Link>
                      </Button>
                      <ServiceToggleButton
                        serviceId={service.id}
                        serviceName={service.name}
                        active={service.active}
                        variant={service.active ? "ghost" : "secondary"}
                        size="sm"
                        className="h-9 px-4"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

