"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Gauge,
  Users,
  Fuel,
  Palette,
  Euro,
  Shield,
  FileText,
  Image as ImageIcon,
  Car,
  Star,
  CheckCircle2,
  XCircle,
  Wrench,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DeleteVehicleDialog } from "@/components/admin/vehicles/DeleteVehicleDialog";
import type { VehicleCategory, VehicleStatus, TransmissionType, FuelType } from "@prisma/client";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  mileage: number;
  category: string;
  seats: number;
  transmission: string;
  fuelType: string;
  color: string;
  pricePerDay: number;
  pricePerWeek: number | null;
  pricePerMonth: number | null;
  deposit: number;
  status: string;
  location: {
    id: string;
    name: string;
    city: string;
    address?: string;
  };
  features: string[];
  images: string[];
  imagePublicIds: string[];
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    bookings: number;
    reviews: number;
  };
}

interface VehicleDetailsPageClientProps {
  vehicle: Vehicle;
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

const statusIcons: Record<VehicleStatus, typeof CheckCircle2> = {
  AVAILABLE: CheckCircle2,
  RESERVED: Calendar,
  MAINTENANCE: Wrench,
  UNAVAILABLE: XCircle,
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

const fuelTypeLabels: Record<FuelType, string> = {
  PETROL: "Essence",
  DIESEL: "Diesel",
  ELECTRIC: "Électrique",
  HYBRID: "Hybride",
  LPG: "GPL",
};

const transmissionLabels: Record<TransmissionType, string> = {
  MANUAL: "Manuelle",
  AUTOMATIC: "Automatique",
};

export function VehicleDetailsPageClient({ vehicle }: VehicleDetailsPageClientProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const StatusIcon = statusIcons[vehicle.status as VehicleStatus] || AlertCircle;

  return (
    <div className="space-y-6">
      {/* En-tête avec boutons d'action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-sm text-gray-600 sm:text-base">
              {vehicle.year} • {vehicle.licensePlate}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              router.push(`/admin/vehicles/availability?vehicleId=${vehicle.id}`);
            }}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Disponibilité
          </Button>
          <Link href={`/admin/vehicles/edit/${vehicle.id}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          </Link>
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Image principale et galerie */}
      {vehicle.images && vehicle.images.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
              <Image
                src={vehicle.images[selectedImageIndex]}
                alt={`${vehicle.brand} ${vehicle.model} - Image ${selectedImageIndex + 1}`}
                fill
                className="object-cover"
                priority
              />
              {/* Indicateur d'image */}
              {vehicle.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {vehicle.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`h-2 w-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white ${
                        index === selectedImageIndex
                          ? "bg-white w-7"
                          : "bg-white/50 hover:bg-white/75"
                      }`}
                      aria-label={`Image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
            {/* Miniatures */}
            {vehicle.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 p-4 sm:grid-cols-6 lg:grid-cols-8">
                {vehicle.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-video overflow-hidden rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      index === selectedImageIndex
                        ? "border-primary"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${vehicle.brand} ${vehicle.model} - Miniature ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ImageIcon className="h-8 w-8" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Aucune image disponible</p>
              <p className="text-sm">Ajoutez des images dans la page de modification du véhicule.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <StatusIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge className={statusColors[vehicle.status as VehicleStatus]}>
                      {statusLabels[vehicle.status as VehicleStatus]}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Catégorie</p>
                    <p className="font-semibold">
                      {categoryLabels[vehicle.category as VehicleCategory]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Gauge className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kilométrage</p>
                    <p className="font-semibold">{vehicle.mileage.toLocaleString()} km</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Places</p>
                    <p className="font-semibold">{vehicle.seats} places</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Fuel className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Carburant</p>
                    <p className="font-semibold">
                      {fuelTypeLabels[vehicle.fuelType as FuelType] || vehicle.fuelType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transmission</p>
                    <p className="font-semibold">
                      {transmissionLabels[vehicle.transmission as TransmissionType] || vehicle.transmission}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Couleur</p>
                    <p className="font-semibold">{vehicle.color}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Localisation</p>
                    <p className="font-semibold">{vehicle.location.city}</p>
                    <p className="text-sm text-muted-foreground">{vehicle.location.name}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {vehicle.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{vehicle.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Équipements */}
          {vehicle.features && vehicle.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Équipements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((feature, index) => (
                    <Badge key={index} variant="outline">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Tarifs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Tarification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Prix par jour</span>
                  <span className="text-2xl font-bold text-primary">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    }).format(vehicle.pricePerDay)}
                  </span>
                </div>
                {vehicle.pricePerWeek && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Prix par semaine</span>
                    <span className="text-lg font-semibold">
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      }).format(vehicle.pricePerWeek)}
                    </span>
                  </div>
                )}
                {vehicle.pricePerMonth && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Prix par mois</span>
                    <span className="text-lg font-semibold">
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      }).format(vehicle.pricePerMonth)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    Caution
                  </span>
                  <span className="text-lg font-semibold">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    }).format(vehicle.deposit)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Réservations
                </span>
                <span className="text-2xl font-bold">{vehicle._count.bookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Avis
                </span>
                <span className="text-2xl font-bold">{vehicle._count.reviews}</span>
              </div>
            </CardContent>
          </Card>

          {/* Informations de création */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créé le</span>
                <span className="font-medium">
                  {format(new Date(vehicle.createdAt), "dd MMMM yyyy", { locale: fr })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modifié le</span>
                <span className="font-medium">
                  {format(new Date(vehicle.updatedAt), "dd MMMM yyyy", { locale: fr })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de suppression */}
      <DeleteVehicleDialog
        vehicle={{
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          licensePlate: vehicle.licensePlate,
          mileage: vehicle.mileage,
          category: vehicle.category as VehicleCategory,
          seats: vehicle.seats,
          transmission: vehicle.transmission as TransmissionType,
          fuelType: vehicle.fuelType as FuelType,
          color: vehicle.color,
          status: vehicle.status as VehicleStatus,
          pricePerDay: vehicle.pricePerDay,
          pricePerWeek: vehicle.pricePerWeek,
          pricePerMonth: vehicle.pricePerMonth,
          deposit: vehicle.deposit,
          location: vehicle.location,
          features: vehicle.features,
          images: vehicle.images,
          description: vehicle.description,
          _count: vehicle._count,
        }}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}

