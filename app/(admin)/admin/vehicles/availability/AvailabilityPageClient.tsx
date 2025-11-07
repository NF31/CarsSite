"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ArrowLeft, Car } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getVehiclesAction, getVehicleByIdAction, type GetVehiclesFilters } from "@/actions/admin/vehicles";
import { VehiclesFilters } from "@/components/admin/vehicles/VehiclesFilters";
import type { VehicleCategory, VehicleStatus } from "@prisma/client";
import { AvailabilityCalendar } from "@/components/admin/vehicles/AvailabilityCalendar";
import { VehiclesGridView } from "@/components/admin/vehicles/VehiclesGridView";

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  mileage: number;
  category: VehicleCategory;
  seats: number;
  transmission: string;
  fuelType: string;
  color: string;
  pricePerDay: number;
  pricePerWeek: number | null;
  pricePerMonth: number | null;
  deposit: number;
  status: VehicleStatus;
  locationId: string;
  location: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
  features: string[];
  images: string[];
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    bookings: number;
    reviews: number;
  };
};

interface AvailabilityPageClientProps {
  initialLocations: Array<{ id: string; name: string; city: string }>;
  initialBrands: string[];
}

export function AvailabilityPageClient({
  initialLocations,
  initialBrands,
}: AvailabilityPageClientProps) {
  const searchParams = useSearchParams();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [filters, setFilters] = useState<GetVehiclesFilters>({
    page: 1,
    limit: 20,
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Charger le véhicule depuis l'URL si présent
  useEffect(() => {
    const vehicleIdFromUrl = searchParams.get("vehicleId");
    if (vehicleIdFromUrl && !selectedVehicle) {
      startTransition(async () => {
        try {
          const vehicleResult = await getVehicleByIdAction(vehicleIdFromUrl);
          if (vehicleResult.success && vehicleResult.data) {
            // Convertir les données en format Vehicle
            const vehicle: Vehicle = {
              id: vehicleResult.data.id,
              brand: vehicleResult.data.brand,
              model: vehicleResult.data.model,
              year: vehicleResult.data.year,
              licensePlate: vehicleResult.data.licensePlate,
              mileage: vehicleResult.data.mileage,
              category: vehicleResult.data.category as VehicleCategory,
              seats: vehicleResult.data.seats,
              transmission: vehicleResult.data.transmission,
              fuelType: vehicleResult.data.fuelType,
              color: vehicleResult.data.color,
              pricePerDay: vehicleResult.data.pricePerDay,
              pricePerWeek: vehicleResult.data.pricePerWeek,
              pricePerMonth: vehicleResult.data.pricePerMonth,
              deposit: vehicleResult.data.deposit,
              status: vehicleResult.data.status as VehicleStatus,
              locationId: vehicleResult.data.locationId,
              location: {
                id: vehicleResult.data.location.id,
                name: vehicleResult.data.location.name,
                city: vehicleResult.data.location.city,
                address: vehicleResult.data.location.address || undefined,
              },
              features: vehicleResult.data.features,
              images: vehicleResult.data.images,
              description: vehicleResult.data.description,
              createdAt: new Date(vehicleResult.data.createdAt),
              updatedAt: new Date(vehicleResult.data.updatedAt),
              _count: vehicleResult.data._count,
            };
            setSelectedVehicle(vehicle);
          }
        } catch (error) {
          console.error("Error loading vehicle from URL:", error);
        }
      });
    }
  }, [searchParams, selectedVehicle]);

  // Charger les véhicules
  useEffect(() => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const result = await getVehiclesAction(filters);
        if (result.success && result.data) {
          setVehicles(result.data.vehicles);
          setPagination(result.data.pagination);
        }
      } catch (error) {
        console.error("Error loading vehicles:", error);
      } finally {
        setIsLoading(false);
      }
    });
  }, [filters]);

  const handleFiltersChange = (newFilters: GetVehiclesFilters) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleBackToList = () => {
    setSelectedVehicle(null);
  };

  if (selectedVehicle) {
    return (
      <div className="space-y-6">
        {/* En-tête avec bouton retour */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Disponibilité - {selectedVehicle.brand} {selectedVehicle.model}
            </h1>
            <p className="text-gray-600 mt-1">
              Plaque: {selectedVehicle.licensePlate} • {selectedVehicle.location.city}
            </p>
          </div>
        </div>

        {/* Calendrier de disponibilité */}
        <AvailabilityCalendar vehicleId={selectedVehicle.id} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Disponibilité des véhicules</h1>
          <p className="text-gray-600 mt-1">
            Sélectionnez un véhicule pour voir son calendrier de disponibilité ({pagination.total} véhicules)
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/vehicles">
            <Car className="mr-2 h-4 w-4" />
            Voir tous les véhicules
          </Link>
        </Button>
      </div>

      {/* Filtres */}
      <VehiclesFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        locations={initialLocations}
        brands={initialBrands}
      />

      {/* Liste des véhicules */}
      {isLoading || isPending ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Chargement des véhicules...</p>
            </div>
          </CardContent>
        </Card>
      ) : vehicles.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-gray-900">Aucun véhicule trouvé</p>
              <p className="text-sm text-muted-foreground mt-1">
                Essayez de modifier vos filtres de recherche
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {vehicles.map((vehicle) => (
              <Card 
                key={vehicle.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleVehicleSelect(vehicle)}
              >
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-gray-100">
                    {vehicle.images && vehicle.images.length > 0 ? (
                      <Image
                        src={vehicle.images[0]}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Car className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {vehicle.licensePlate} • {vehicle.location.city}
                    </p>
                    <Button className="w-full mt-4" variant="outline">
                      <Calendar className="mr-2 h-4 w-4" />
                      Voir disponibilité
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

