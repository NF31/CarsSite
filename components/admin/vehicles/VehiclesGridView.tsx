"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { MoreVertical, Eye, Edit, Trash2, XCircle, Image as ImageIcon, Car, Gauge, Users, Fuel, Calendar, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { VehicleCategory, TransmissionType, FuelType } from "@prisma/client";
import type { VehicleStatus } from "@/lib/types/vehicle-status";
import { DeleteVehicleDialog } from "./DeleteVehicleDialog";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  mileage: number;
  category: VehicleCategory;
  seats: number;
  transmission: TransmissionType;
  fuelType: FuelType;
  color: string;
  status: VehicleStatus;
  pricePerDay: number;
  pricePerWeek: number | null;
  pricePerMonth: number | null;
  deposit: number;
  location: {
    id: string;
    name: string;
    city: string;
  };
  features: string[];
  images: string[];
  description: string | null;
  _count: {
    bookings: number;
    reviews: number;
  };
}

interface VehiclesGridViewProps {
  vehicles: Vehicle[];
  startIndex?: number;
}

const statusLabels: Record<VehicleStatus, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Réservé",
  MAINTENANCE: "Maintenance",
  UNAVAILABLE: "Indisponible",
};

const statusColors: Record<VehicleStatus, string> = {
  AVAILABLE: "bg-green-100 text-green-800 border-green-300",
  RESERVED: "bg-blue-100 text-blue-800 border-blue-300",
  MAINTENANCE: "bg-orange-100 text-orange-800 border-orange-300",
  UNAVAILABLE: "bg-red-100 text-red-800 border-red-300",
};

const categoryLabels: Record<VehicleCategory, string> = {
  ECONOMY: "Économique",
  COMPACT: "Compact",
  MID_SIZE: "Moyenne",
  FULL_SIZE: "Grande",
  SUV: "SUV",
  LUXURY: "Luxe",
  VAN: "Utilitaire",
};

const fuelTypeLabels: Record<string, string> = {
  PETROL: "Essence",
  DIESEL: "Diesel",
  ELECTRIC: "Électrique",
  HYBRID: "Hybride",
  LPG: "GPL",
};

const transmissionLabels: Record<string, string> = {
  MANUAL: "Manuelle",
  AUTOMATIC: "Automatique",
};

export function VehiclesGridView({ vehicles, startIndex = 0 }: VehiclesGridViewProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const handleDeleteClick = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Car className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-gray-900">Aucun véhicule trouvé</p>
        <p className="text-sm text-muted-foreground mt-1">
          Essayez de modifier vos filtres de recherche
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {vehicles.map((vehicle, index) => (
        <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
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
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
            {/* Numéro de ligne */}
            <div className="absolute top-2 left-2 z-10">
              <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 text-[10px] sm:text-xs font-bold shadow-sm border border-gray-300">
                {startIndex + index + 1}
              </span>
            </div>
            {/* Statut */}
            <div className="absolute top-2 right-2 z-10">
              <Badge className={`${statusColors[vehicle.status]} text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5`}>
                {statusLabels[vehicle.status]}
              </Badge>
            </div>
            {/* Menu actions */}
            <div className="absolute bottom-2 right-2 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 bg-white/90 hover:bg-white shadow-sm">
                    <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/vehicles/${vehicle.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir détails
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/vehicles/edit/${vehicle.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <XCircle className="mr-2 h-4 w-4" />
                    Marquer indisponible
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(vehicle)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
            <div className="space-y-2 sm:space-y-3 flex-1">
              {/* En-tête véhicule */}
              <div>
                <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-1">
                  {vehicle.brand} {vehicle.model}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">{vehicle.year}</p>
                  <span className="text-muted-foreground">•</span>
                  <p className="text-xs sm:text-sm text-muted-foreground font-mono">{vehicle.licensePlate}</p>
                </div>
                <div className="mt-1.5">
                  <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0">
                    {categoryLabels[vehicle.category]}
                  </Badge>
                </div>
              </div>

              {/* Caractéristiques */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground border-t pt-2">
                <div className="flex items-center gap-1">
                  <Gauge className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  <span className="truncate">{vehicle.mileage.toLocaleString()} km</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  <span>{vehicle.seats} places</span>
                </div>
                <div className="flex items-center gap-1">
                  <Fuel className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  <span className="truncate">{fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="truncate">{transmissionLabels[vehicle.transmission] || vehicle.transmission}</span>
                </div>
              </div>

              {/* Tarifs */}
              <div className="space-y-1 border-t pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Prix/jour</span>
                  <span className="font-semibold text-sm sm:text-base text-primary">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    }).format(vehicle.pricePerDay)}
                  </span>
                </div>
                {vehicle.pricePerWeek && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Prix/semaine</span>
                    <span className="text-xs sm:text-sm font-medium">
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      }).format(vehicle.pricePerWeek)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Caution</span>
                  <span className="text-xs sm:text-sm font-medium">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    }).format(vehicle.deposit)}
                  </span>
                </div>
              </div>

              {/* Localisation et activité */}
              <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground border-t pt-2 mt-auto">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{vehicle.location.city}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span>{vehicle._count.bookings}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {vehicleToDelete && (
        <DeleteVehicleDialog
          vehicle={vehicleToDelete}
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) {
              setVehicleToDelete(null);
            }
          }}
        />
      )}
    </div>
  );
}

