"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface VehiclesSearchFiltersProps {
  locations: Array<{
    id: string;
    name: string;
    city: string;
    address: string;
  }>;
  initialFilters: {
    category?: string;
    pickupPlaceId?: string;
    returnPlaceId?: string;
    startDate?: string;
    endDate?: string;
    locationId?: string;
  };
}

export function VehiclesSearchFilters({
  locations,
  initialFilters,
}: VehiclesSearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<string>(
    initialFilters.category || "all"
  );
  const [locationId, setLocationId] = useState<string>(
    initialFilters.locationId || "all"
  );
  const [startDate, setStartDate] = useState<string>(
    initialFilters.startDate || ""
  );
  const [endDate, setEndDate] = useState<string>(
    initialFilters.endDate || ""
  );

  // Fonction pour obtenir la date du jour au format ISO (YYYY-MM-DD)
  const getTodayDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayDateString = getTodayDateString();

  const handleFilterChange = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Catégorie
    if (category && category !== "all") {
      params.set("category", category);
    } else {
      params.delete("category");
    }

    // Localisation
    if (locationId && locationId !== "all") {
      params.set("locationId", locationId);
    } else {
      params.delete("locationId");
    }

    // Dates
    if (startDate) {
      params.set("startDate", startDate);
    } else {
      params.delete("startDate");
    }

    if (endDate) {
      params.set("endDate", endDate);
    } else {
      params.delete("endDate");
    }

    // Réinitialiser la page à 1
    params.delete("page");

    router.push(`/vehicles?${params.toString()}`);
  };

  const clearFilters = () => {
    setCategory("all");
    setLocationId("all");
    setStartDate("");
    setEndDate("");
    router.push("/vehicles");
  };

  const hasActiveFilters =
    category !== "all" ||
    locationId !== "all" ||
    startDate !== "" ||
    endDate !== "";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filtres</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2"
            >
              <X className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Catégorie */}
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <Select
            value={category}
            onValueChange={(value) => {
              setCategory(value);
              // Mettre à jour l'URL immédiatement
              const params = new URLSearchParams(searchParams.toString());
              if (value !== "all") {
                params.set("category", value);
              } else {
                params.delete("category");
              }
              params.delete("page");
              router.push(`/vehicles?${params.toString()}`);
            }}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              <SelectItem value="cars">Voitures</SelectItem>
              <SelectItem value="utility">Utilitaires</SelectItem>
              <SelectItem value="subscription">Abonnement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Localisation */}
        <div className="space-y-2">
          <Label htmlFor="location">Localisation</Label>
          <Select
            value={locationId}
            onValueChange={(value) => {
              setLocationId(value);
              // Mettre à jour l'URL immédiatement
              const params = new URLSearchParams(searchParams.toString());
              if (value !== "all") {
                params.set("locationId", value);
              } else {
                params.delete("locationId");
              }
              params.delete("page");
              router.push(`/vehicles?${params.toString()}`);
            }}
          >
            <SelectTrigger id="location">
              <SelectValue placeholder="Toutes les localisations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les localisations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.city} - {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date de départ */}
        <div className="space-y-2">
          <Label htmlFor="start-date">Date de départ</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            min={todayDateString}
            onChange={(e) => {
              const newStartDate = e.target.value;
              setStartDate(newStartDate);
              // Si la date de fin est avant la nouvelle date de départ, la réinitialiser
              if (endDate && newStartDate && endDate < newStartDate) {
                setEndDate("");
              }
              // Mettre à jour l'URL immédiatement
              const params = new URLSearchParams(searchParams.toString());
              if (newStartDate) {
                params.set("startDate", newStartDate);
              } else {
                params.delete("startDate");
              }
              params.delete("page");
              router.push(`/vehicles?${params.toString()}`);
            }}
          />
        </div>

        {/* Date de retour */}
        <div className="space-y-2">
          <Label htmlFor="end-date">Date de retour</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            min={startDate || todayDateString}
            onChange={(e) => {
              const newEndDate = e.target.value;
              setEndDate(newEndDate);
              // Mettre à jour l'URL immédiatement
              const params = new URLSearchParams(searchParams.toString());
              if (newEndDate) {
                params.set("endDate", newEndDate);
              } else {
                params.delete("endDate");
              }
              params.delete("page");
              router.push(`/vehicles?${params.toString()}`);
            }}
          />
        </div>

        {/* Badge des filtres actifs */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2">
            {category !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {category === "cars"
                  ? "Voitures"
                  : category === "utility"
                  ? "Utilitaires"
                  : "Abonnement"}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCategory("all");
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("category");
                    params.delete("page");
                    router.push(`/vehicles?${params.toString()}`);
                  }}
                  className="ml-1 hover:text-destructive h-auto w-auto p-0"
                  aria-label="Supprimer le filtre de catégorie"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {locationId !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {locations.find((l) => l.id === locationId)?.city}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setLocationId("all");
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("locationId");
                    params.delete("page");
                    router.push(`/vehicles?${params.toString()}`);
                  }}
                  className="ml-1 hover:text-destructive h-auto w-auto p-0"
                  aria-label="Supprimer le filtre de localisation"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {startDate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Départ: {new Date(startDate).toLocaleDateString("fr-FR")}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setStartDate("");
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("startDate");
                    params.delete("page");
                    router.push(`/vehicles?${params.toString()}`);
                  }}
                  className="ml-1 hover:text-destructive h-auto w-auto p-0"
                  aria-label="Supprimer le filtre de date de départ"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {endDate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Retour: {new Date(endDate).toLocaleDateString("fr-FR")}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEndDate("");
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("endDate");
                    params.delete("page");
                    router.push(`/vehicles?${params.toString()}`);
                  }}
                  className="ml-1 hover:text-destructive h-auto w-auto p-0"
                  aria-label="Supprimer le filtre de date de retour"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


