"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Car, Calendar, Gauge, Users, Fuel, Settings, MapPin, Euro, Shield, Image as ImageIcon, FileText } from "lucide-react";
import Image from "next/image";
import { deleteVehicleAction } from "@/actions/admin/vehicles/delete-vehicle";
import type { VehicleCategory, VehicleStatus, TransmissionType, FuelType } from "@prisma/client";

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
  pricePerDay: number;
  pricePerWeek: number | null;
  pricePerMonth: number | null;
  deposit: number;
  status: VehicleStatus;
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

interface DeleteVehicleDialogProps {
  vehicle: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryLabels: Record<VehicleCategory, string> = {
  ECONOMY: "Économique",
  COMPACT: "Compact",
  MID_SIZE: "Moyenne",
  FULL_SIZE: "Grande",
  SUV: "SUV",
  LUXURY: "Luxe",
  VAN: "Utilitaire",
};

const statusLabels: Record<VehicleStatus, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Réservé",
  MAINTENANCE: "En maintenance",
  UNAVAILABLE: "Indisponible",
};

const transmissionLabels: Record<TransmissionType, string> = {
  MANUAL: "Manuelle",
  AUTOMATIC: "Automatique",
};

const fuelTypeLabels: Record<FuelType, string> = {
  PETROL: "Essence",
  DIESEL: "Diesel",
  ELECTRIC: "Électrique",
  HYBRID: "Hybride",
};

export function DeleteVehicleDialog({
  vehicle,
  open,
  onOpenChange,
}: DeleteVehicleDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteVehicleAction(vehicle.id);

      if (result.success) {
        // Rediriger vers la liste avec message de succès
        router.push("/admin/vehicles?success=vehicle-deleted");
        router.refresh();
      } else {
        setError(result.error || "Erreur lors de la suppression");
        setIsDeleting(false);
      }
    } catch (err) {
      setError("Une erreur inattendue s'est produite");
      setIsDeleting(false);
    }
  };

  const mainImage = vehicle.images[0];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Confirmer la suppression du véhicule
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Vous êtes sur le point de supprimer définitivement ce véhicule. Cette action est irréversible.
            {vehicle._count.bookings > 0 && (
              <span className="block mt-2 text-destructive font-semibold">
                ⚠️ Ce véhicule a {vehicle._count.bookings} réservation(s) active(s) et ne peut pas être supprimé.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6 py-4">
          {/* Image principale */}
          {mainImage && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
              <Image
                src={mainImage}
                alt={`${vehicle.brand} ${vehicle.model}`}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Car className="h-5 w-5" />
                Informations générales
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Marque :</span>
                  <span className="font-medium">{vehicle.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modèle :</span>
                  <span className="font-medium">{vehicle.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Année :</span>
                  <span className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {vehicle.year}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plaque d'immatriculation :</span>
                  <span className="font-medium font-mono">{vehicle.licensePlate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kilométrage :</span>
                  <span className="font-medium flex items-center gap-1">
                    <Gauge className="h-4 w-4" />
                    {vehicle.mileage.toLocaleString()} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Couleur :</span>
                  <span className="font-medium">{vehicle.color}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Caractéristiques
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Catégorie :</span>
                  <Badge variant="secondary">{categoryLabels[vehicle.category]}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Places :</span>
                  <span className="font-medium flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {vehicle.seats}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transmission :</span>
                  <span className="font-medium">{transmissionLabels[vehicle.transmission]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carburant :</span>
                  <span className="font-medium flex items-center gap-1">
                    <Fuel className="h-4 w-4" />
                    {fuelTypeLabels[vehicle.fuelType]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut :</span>
                  <Badge
                    variant={
                      vehicle.status === "AVAILABLE"
                        ? "default"
                        : vehicle.status === "RESERVED"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {statusLabels[vehicle.status]}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tarification */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Tarification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Prix/jour :</span>
                <span className="font-semibold">{vehicle.pricePerDay.toFixed(2)} €</span>
              </div>
              {vehicle.pricePerWeek && (
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Prix/semaine :</span>
                  <span className="font-semibold">{vehicle.pricePerWeek.toFixed(2)} €</span>
                </div>
              )}
              {vehicle.pricePerMonth && (
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Prix/mois :</span>
                  <span className="font-semibold">{vehicle.pricePerMonth.toFixed(2)} €</span>
                </div>
              )}
            </div>
            <div className="flex justify-between p-3 bg-muted rounded-lg">
              <span className="text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Caution :
              </span>
              <span className="font-semibold">{vehicle.deposit.toFixed(2)} €</span>
            </div>
          </div>

          <Separator />

          {/* Localisation */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localisation
            </h3>
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="font-medium">{vehicle.location.name}</div>
              <div className="text-muted-foreground">{vehicle.location.city}</div>
            </div>
          </div>

          {/* Équipements */}
          {vehicle.features.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Équipements</h3>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((feature, index) => (
                    <Badge key={index} variant="outline">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Description */}
          {vehicle.description && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </h3>
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  {vehicle.description}
                </p>
              </div>
            </>
          )}

          {/* Images */}
          {vehicle.images.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Images ({vehicle.images.length})
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {vehicle.images.slice(0, 8).map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-video rounded-lg overflow-hidden border"
                    >
                      <Image
                        src={image}
                        alt={`${vehicle.brand} ${vehicle.model} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                  {vehicle.images.length > 8 && (
                    <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">
                        +{vehicle.images.length - 8}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Statistiques */}
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{vehicle._count.bookings}</div>
              <div className="text-muted-foreground">Réservation(s)</div>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{vehicle._count.reviews}</div>
              <div className="text-muted-foreground">Avis</div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || vehicle._count.bookings > 0}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Suppression..." : "Supprimer définitivement"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

