"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Filter, Gauge, Users, Euro, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface VehiclesFiltersProps {
  mobile?: boolean;
}

export function VehiclesFilters({ mobile = false }: VehiclesFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [transmission, setTransmission] = useState<string | null>(
    searchParams.get("transmission") || null
  );
  const [minSeats, setMinSeats] = useState<string | null>(
    searchParams.get("minSeats") || null
  );
  const [maxPrice, setMaxPrice] = useState<string | null>(
    searchParams.get("maxPrice") || null
  );
  const [fuelType, setFuelType] = useState<string | null>(
    searchParams.get("fuelType") || null
  );
  const [isOpen, setIsOpen] = useState(false);

  // Appliquer les filtres automatiquement quand ils changent
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let hasChanges = false;
    
    if (transmission) {
      if (params.get("transmission") !== transmission) {
        params.set("transmission", transmission);
        hasChanges = true;
      }
    } else {
      if (params.has("transmission")) {
        params.delete("transmission");
        hasChanges = true;
      }
    }
    
    if (minSeats) {
      if (params.get("minSeats") !== minSeats) {
        params.set("minSeats", minSeats);
        hasChanges = true;
      }
    } else {
      if (params.has("minSeats")) {
        params.delete("minSeats");
        hasChanges = true;
      }
    }
    
    if (maxPrice) {
      if (params.get("maxPrice") !== maxPrice) {
        params.set("maxPrice", maxPrice);
        hasChanges = true;
      }
    } else {
      if (params.has("maxPrice")) {
        params.delete("maxPrice");
        hasChanges = true;
      }
    }
    
    if (fuelType) {
      if (params.get("fuelType") !== fuelType) {
        params.set("fuelType", fuelType);
        hasChanges = true;
      }
    } else {
      if (params.has("fuelType")) {
        params.delete("fuelType");
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      params.delete("page");
      router.push(`/vehicles?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transmission, minSeats, maxPrice, fuelType]);

  const clearFilters = () => {
    setTransmission(null);
    setMinSeats(null);
    setMaxPrice(null);
    setFuelType(null);
    
    const params = new URLSearchParams(searchParams.toString());
    params.delete("transmission");
    params.delete("minSeats");
    params.delete("maxPrice");
    params.delete("fuelType");
    params.delete("page");
    router.push(`/vehicles?${params.toString()}`);
  };

  const hasActiveFilters =
    transmission !== null || minSeats !== null || maxPrice !== null || fuelType !== null;

  const filtersContent = (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between pb-4 border-b">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          Filtres
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Réinitialiser tous les filtres"
          >
            <X className="h-3 w-3 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Transmission */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          Transmission
        </Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={transmission === "MANUAL" ? "default" : "outline"}
            onClick={() => setTransmission(transmission === "MANUAL" ? null : "MANUAL")}
            className={cn(
              "flex-1",
              transmission === "MANUAL"
                ? ""
                : "bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-gray-50"
            )}
            aria-label={transmission === "MANUAL" ? "Désélectionner transmission manuelle" : "Sélectionner transmission manuelle"}
          >
            Manuelle
          </Button>
          <Button
            type="button"
            variant={transmission === "AUTOMATIC" ? "default" : "outline"}
            onClick={() => setTransmission(transmission === "AUTOMATIC" ? null : "AUTOMATIC")}
            className={cn(
              "flex-1",
              transmission === "AUTOMATIC"
                ? ""
                : "bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-gray-50"
            )}
            aria-label={transmission === "AUTOMATIC" ? "Désélectionner transmission automatique" : "Sélectionner transmission automatique"}
          >
            Automatique
          </Button>
        </div>
      </div>

      {/* Nombre de places */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Nombre de places
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {[2, 4, 5, 7, 8, 9].map((seats) => (
            <Button
              key={seats}
              type="button"
              variant={minSeats === String(seats) ? "default" : "outline"}
              onClick={() => setMinSeats(minSeats === String(seats) ? null : String(seats))}
              className={cn(
                minSeats === String(seats)
                  ? ""
                  : "bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-gray-50"
              )}
              aria-label={minSeats === String(seats) ? `Désélectionner ${seats} places` : `Sélectionner ${seats} places minimum`}
            >
              {seats}
            </Button>
          ))}
        </div>
      </div>

      {/* Type de carburant */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Type de carburant
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={fuelType === "PETROL" ? "default" : "outline"}
            onClick={() => setFuelType(fuelType === "PETROL" ? null : "PETROL")}
            className={cn(
              fuelType === "PETROL"
                ? ""
                : "bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-gray-50"
            )}
            aria-label={fuelType === "PETROL" ? "Désélectionner essence" : "Sélectionner essence"}
          >
            Essence
          </Button>
          <Button
            type="button"
            variant={fuelType === "DIESEL" ? "default" : "outline"}
            onClick={() => setFuelType(fuelType === "DIESEL" ? null : "DIESEL")}
            className={cn(
              fuelType === "DIESEL"
                ? ""
                : "bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-gray-50"
            )}
            aria-label={fuelType === "DIESEL" ? "Désélectionner diesel" : "Sélectionner diesel"}
          >
            Diesel
          </Button>
          <Button
            type="button"
            variant={fuelType === "ELECTRIC" ? "default" : "outline"}
            onClick={() => setFuelType(fuelType === "ELECTRIC" ? null : "ELECTRIC")}
            className={cn(
              fuelType === "ELECTRIC"
                ? ""
                : "bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-gray-50"
            )}
            aria-label={fuelType === "ELECTRIC" ? "Désélectionner électrique" : "Sélectionner électrique"}
          >
            Électrique
          </Button>
          <Button
            type="button"
            variant={fuelType === "HYBRID" ? "default" : "outline"}
            onClick={() => setFuelType(fuelType === "HYBRID" ? null : "HYBRID")}
            className={cn(
              fuelType === "HYBRID"
                ? ""
                : "bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-gray-50"
            )}
            aria-label={fuelType === "HYBRID" ? "Désélectionner hybride" : "Sélectionner hybride"}
          >
            Hybride
          </Button>
        </div>
      </div>

      {/* Prix maximum */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Euro className="h-4 w-4 text-primary" />
          Prix maximum par jour
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[50, 100, 150, 200].map((price) => (
            <Button
              key={price}
              type="button"
              variant={maxPrice === String(price) ? "default" : "outline"}
              onClick={() => setMaxPrice(maxPrice === String(price) ? null : String(price))}
              className={cn(
                maxPrice === String(price)
                  ? ""
                  : "bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-gray-50"
              )}
              aria-label={maxPrice === String(price) ? `Désélectionner prix maximum ${price}€` : `Sélectionner prix maximum ${price}€ par jour`}
            >
              {price}€
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  // Version mobile avec Sheet
  if (mobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 lg:hidden"
            aria-label={`Ouvrir les filtres${hasActiveFilters ? ` (${[transmission, minSeats, maxPrice, fuelType].filter(Boolean).length} actif${[transmission, minSeats, maxPrice, fuelType].filter(Boolean).length > 1 ? 's' : ''})` : ''}`}
          >
            <Filter className="h-4 w-4" />
            Filtres
            {hasActiveFilters && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {[transmission, minSeats, maxPrice, fuelType].filter(Boolean).length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[90vw] sm:w-[400px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtres</SheetTitle>
            <SheetDescription>
              Affinez votre recherche selon vos préférences
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">{filtersContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  // Version desktop
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm lg:sticky lg:top-4">
      {filtersContent}
    </div>
  );
}

