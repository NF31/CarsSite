"use client";

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
import { MoreVertical, Eye, Edit, Trash2, XCircle, Image as ImageIcon, Car } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { VehicleCategory, VehicleStatus } from "@prisma/client";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  category: VehicleCategory;
  status: VehicleStatus;
  pricePerDay: number;
  location: {
    id: string;
    name: string;
    city: string;
  };
  images: string[];
  _count: {
    bookings: number;
    reviews: number;
  };
}

interface VehiclesGridViewProps {
  vehicles: Vehicle[];
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

export function VehiclesGridView({ vehicles }: VehiclesGridViewProps) {
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {vehicles.map((vehicle) => (
        <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 hover:bg-white">
                    <MoreVertical className="h-4 w-4" />
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
                    <Link href={`/admin/vehicles/${vehicle.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <XCircle className="mr-2 h-4 w-4" />
                    Marquer indisponible
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="absolute top-2 left-2">
              <Badge className={statusColors[vehicle.status]}>
                {statusLabels[vehicle.status]}
              </Badge>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div>
                <h3 className="font-semibold text-lg leading-tight">
                  {vehicle.brand} {vehicle.model}
                </h3>
                <p className="text-sm text-muted-foreground">{vehicle.year}</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{categoryLabels[vehicle.category]}</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  }).format(vehicle.pricePerDay)}
                  <span className="text-xs text-muted-foreground">/jour</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>{vehicle.location.city}</span>
                <span>{vehicle._count.bookings} réservations</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

