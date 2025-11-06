"use client";

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
import { MoreVertical, Eye, Edit, Trash2, XCircle, Image as ImageIcon, Gauge, Users, Fuel, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { VehicleCategory, VehicleStatus } from "@prisma/client";

interface Vehicle {
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
  location: {
    id: string;
    name: string;
    address: string;
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

interface VehiclesListViewProps {
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

const transmissionLabels: Record<string, string> = {
  MANUAL: "Manuelle",
  AUTOMATIC: "Automatique",
};

const fuelTypeLabels: Record<string, string> = {
  PETROL: "Essence",
  DIESEL: "Diesel",
  ELECTRIC: "Électrique",
  HYBRID: "Hybride",
};

export function VehiclesListView({ vehicles, startIndex = 0 }: VehiclesListViewProps) {
  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-gray-900">Aucun véhicule trouvé</p>
        <p className="text-sm text-muted-foreground mt-1">
          Essayez de modifier vos filtres de recherche
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Vue mobile : cartes détaillées */}
      <div className="block lg:hidden space-y-4">
        {vehicles.map((vehicle, index) => (
          <div
            key={vehicle.id}
            className="border rounded-lg p-3 sm:p-4 bg-white hover:shadow-lg transition-shadow"
          >
            {/* Numéro de ligne pour mobile */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
              <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 text-[10px] sm:text-xs font-bold shadow-sm border border-gray-300">
                {startIndex + index + 1}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
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
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <div className="relative h-20 w-28 sm:h-24 sm:w-32 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {vehicle.images && vehicle.images.length > 0 ? (
                  <Image
                    src={vehicle.images[0]}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  <div className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                    {vehicle.brand} {vehicle.model}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {vehicle.year} • {vehicle.licensePlate}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
                  <Badge className={`${statusColors[vehicle.status]} text-xs`}>
                    {statusLabels[vehicle.status]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{categoryLabels[vehicle.category]}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mb-2">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Kilométrage:</span>
                    <span className="font-medium">{vehicle.mileage.toLocaleString()} km</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Places:</span>
                    <span className="font-medium">{vehicle.seats}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Fuel className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Carburant:</span>
                    <span className="font-medium truncate">{fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Transmission:</span>
                    <span className="font-medium truncate">{transmissionLabels[vehicle.transmission] || vehicle.transmission}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm border-t pt-2">
                  <div>
                    <span className="text-muted-foreground">Prix/jour:</span>{" "}
                    <span className="font-semibold text-primary">
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      }).format(vehicle.pricePerDay)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Localisation:</span>{" "}
                    <span className="font-medium truncate">{vehicle.location.city}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Caution:</span>{" "}
                    <span className="font-medium">
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      }).format(vehicle.deposit)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Réservations:</span>{" "}
                    <span className="font-medium">{vehicle._count.bookings}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vue tablette : tableau compact */}
      <div className="hidden lg:block xl:hidden border rounded-lg overflow-hidden bg-white shadow-sm">
        <table className="w-full table-fixed">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-2 lg:px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-12 lg:w-16">
                  <span className="text-gray-500">#</span>
                </th>
                <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20 lg:w-24">
                  Photo
                </th>
                <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[20%]">
                  Véhicule
                </th>
                <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[15%] hidden lg:table-cell">
                  Caract.
                </th>
                <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[10%]">
                  Statut
                </th>
                <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[12%]">
                  Tarifs
                </th>
                <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[12%] hidden lg:table-cell">
                  Localisation
                </th>
                <th className="px-2 lg:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[8%] hidden lg:table-cell">
                  Activité
                </th>
                <th className="px-2 lg:px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-[8%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicles.map((vehicle, index) => (
                <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 lg:px-3 py-3 whitespace-nowrap text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 text-[10px] lg:text-xs font-semibold shadow-sm border border-gray-300">
                      {startIndex + index + 1}
                    </span>
                  </td>
                  <td className="px-2 lg:px-3 py-3 whitespace-nowrap">
                    <div className="relative h-12 w-16 lg:h-14 lg:w-20 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                      {vehicle.images && vehicle.images.length > 0 ? (
                        <Image
                          src={vehicle.images[0]}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 lg:px-3 py-3">
                    <div>
                      <div className="font-semibold text-gray-900 text-xs lg:text-sm truncate">
                        {vehicle.brand} {vehicle.model}
                      </div>
                      <div className="text-[10px] lg:text-xs text-muted-foreground mt-0.5 truncate">
                        {vehicle.year} • {vehicle.licensePlate}
                      </div>
                      <div className="mt-1 hidden lg:block">
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {categoryLabels[vehicle.category]}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 lg:px-3 py-3 hidden lg:table-cell">
                    <div className="space-y-0.5 text-[10px] lg:text-xs">
                      <div className="flex items-center gap-1">
                        <Gauge className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-muted-foreground" />
                        <span className="text-gray-700">{vehicle.mileage.toLocaleString()} km</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-muted-foreground" />
                        <span className="text-gray-700">{vehicle.seats} places</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Fuel className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-muted-foreground" />
                        <span className="text-gray-700 truncate">{fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 lg:px-3 py-3 whitespace-nowrap">
                    <Badge className={`${statusColors[vehicle.status]} text-[10px] lg:text-xs px-1.5 lg:px-2 py-0.5`}>
                      {statusLabels[vehicle.status]}
                    </Badge>
                  </td>
                  <td className="px-2 lg:px-3 py-3">
                    <div className="space-y-0.5">
                      <div className="text-[10px] lg:text-xs font-semibold text-primary">
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        }).format(vehicle.pricePerDay)}
                        <span className="text-[8px] lg:text-[10px] text-muted-foreground font-normal">/j</span>
                      </div>
                      <div className="text-[8px] lg:text-[10px] text-muted-foreground hidden lg:block">
                        Caution: {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        }).format(vehicle.deposit)}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 lg:px-3 py-3 hidden lg:table-cell">
                    <div className="text-[10px] lg:text-xs">
                      <div className="font-medium text-gray-900 truncate">{vehicle.location.city}</div>
                    </div>
                  </td>
                  <td className="px-2 lg:px-3 py-3 hidden lg:table-cell">
                    <div className="text-[10px] lg:text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-muted-foreground" />
                        <span className="text-gray-700">{vehicle._count.bookings}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 lg:px-3 py-3 text-right whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 lg:h-7 lg:w-7">
                          <MoreVertical className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {/* Vue desktop large : tableau complet */}
      <div className="hidden xl:block border rounded-lg overflow-hidden bg-white shadow-sm">
        <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                  <span className="text-gray-500">#</span>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Photo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Véhicule
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Caractéristiques
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tarifs
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Activité
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicles.map((vehicle, index) => (
                <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center justify-center w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 text-xs xl:text-sm font-bold shadow-sm border border-gray-300">
                      {startIndex + index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative h-16 w-24 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                      {vehicle.images && vehicle.images.length > 0 ? (
                        <Image
                          src={vehicle.images[0]}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-gray-900 text-base">
                        {vehicle.brand} {vehicle.model}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {vehicle.year} • {vehicle.licensePlate}
                      </div>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          {categoryLabels[vehicle.category]}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                        <span className="text-gray-700">{vehicle.mileage.toLocaleString()} km</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-gray-700">{vehicle.seats} places</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-muted-foreground" />
                        <span className="text-gray-700">{fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType}</span>
                      </div>
                      <div className="text-gray-700">
                        {transmissionLabels[vehicle.transmission] || vehicle.transmission}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={statusColors[vehicle.status]}>
                      {statusLabels[vehicle.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-primary">
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        }).format(vehicle.pricePerDay)}
                        <span className="text-xs text-muted-foreground font-normal">/jour</span>
                      </div>
                      {vehicle.pricePerWeek && (
                        <div className="text-xs text-muted-foreground">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(vehicle.pricePerWeek)}
                          /semaine
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Caution: {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        }).format(vehicle.deposit)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{vehicle.location.city}</div>
                      <div className="text-muted-foreground text-xs">{vehicle.location.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-gray-700">{vehicle._count.bookings} réservations</span>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {vehicle._count.reviews} avis
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </>
  );
}
