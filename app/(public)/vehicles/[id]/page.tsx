import { getPublicVehicleByIdAction } from "@/actions/public/vehicles/get-by-id";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Star,
  Users,
  Gauge,
  Fuel,
  Palette,
  Euro,
  Shield,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface VehicleDetailsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    pickup?: string;
    returnLocation?: string;
  }>;
}

const categoryLabels: Record<string, string> = {
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

export default async function VehicleDetailsPage({
  params,
  searchParams,
}: VehicleDetailsPageProps) {
  const { id } = await params;
  const search = await searchParams;

  const result = await getPublicVehicleByIdAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const vehicle = result.data;
  const mainImage = vehicle.images[0] || "/placeholder-car.jpg";

  // Calculer le montant total si les dates sont fournies
  let totalAmount: number | null = null;
  let numberOfDays: number | null = null;

  if (search.startDate && search.endDate) {
    const startDateStr = search.startDate;
    const endDateStr = search.endDate;
    const startTimeStr = search.startTime || "10:00";
    const endTimeStr = search.endTime || "10:00";

    const [startHours, startMinutes] = startTimeStr.split(":").map(Number);
    const [endHours, endMinutes] = endTimeStr.split(":").map(Number);

    const start = new Date(
      `${startDateStr}T${String(startHours || 10).padStart(2, "0")}:${String(startMinutes || 0).padStart(2, "0")}:00`
    );
    const end = new Date(
      `${endDateStr}T${String(endHours || 10).padStart(2, "0")}:${String(endMinutes || 0).padStart(2, "0")}:00`
    );

    const diffMs = end.getTime() - start.getTime();
    const msPerDay = 1000 * 60 * 60 * 24;
    const exactDays = diffMs / msPerDay;
    numberOfDays = Math.max(exactDays, 1);
    totalAmount = numberOfDays * vehicle.pricePerDay;
  }

  return (
    <div className="container py-8 md:py-12">
      {/* Bouton retour */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/vehicles" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux résultats
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl">
            <Image
              src={mainImage}
              alt={`${vehicle.brand} ${vehicle.model}`}
              fill
              className="object-cover"
              priority
            />
          </div>
          {vehicle.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {vehicle.images.slice(1, 5).map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-video w-full overflow-hidden rounded-lg"
                >
                  <Image
                    src={image}
                    alt={`${vehicle.brand} ${vehicle.model} - Vue ${index + 2}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informations */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-black mb-2">
                  {vehicle.brand} {vehicle.model}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {vehicle.year} • {categoryLabels[vehicle.category] || vehicle.category}
                </p>
              </div>
              {vehicle.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-bold">{vehicle.rating}</span>
                  {vehicle.reviewCount > 0 && (
                    <span className="text-sm text-muted-foreground">
                      ({vehicle.reviewCount} avis)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="secondary">{categoryLabels[vehicle.category] || vehicle.category}</Badge>
              <Badge variant="outline">{transmissionLabels[vehicle.transmission] || vehicle.transmission}</Badge>
              <Badge variant="outline">{fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType}</Badge>
            </div>
          </div>

          {/* Prix */}
          <Card>
            <CardContent className="p-6">
              {totalAmount !== null && numberOfDays !== null ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-primary">
                      {totalAmount.toFixed(2)}€
                    </span>
                    <span className="text-sm text-muted-foreground">
                      pour {numberOfDays % 1 === 0 ? numberOfDays.toFixed(0) : numberOfDays.toFixed(2)} jour{numberOfDays > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.pricePerDay.toFixed(0)}€ par jour
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-primary">
                      {vehicle.pricePerDay.toFixed(0)}€
                    </span>
                    <span className="text-sm text-muted-foreground">par jour</span>
                  </div>
                  {vehicle.pricePerWeek && (
                    <p className="text-sm text-muted-foreground">
                      {vehicle.pricePerWeek.toFixed(0)}€ par semaine
                    </p>
                  )}
                  {vehicle.pricePerMonth && (
                    <p className="text-sm text-muted-foreground">
                      {vehicle.pricePerMonth.toFixed(0)}€ par mois
                    </p>
                  )}
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Caution : {vehicle.deposit.toFixed(0)}€</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Caractéristiques */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">Caractéristiques</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Places</p>
                    <p className="font-semibold">{vehicle.seats}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Transmission</p>
                    <p className="font-semibold">
                      {transmissionLabels[vehicle.transmission] || vehicle.transmission}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Carburant</p>
                    <p className="font-semibold">
                      {fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Couleur</p>
                    <p className="font-semibold">{vehicle.color}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localisation */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">{vehicle.location.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.location.city}
                    {vehicle.location.address && ` • ${vehicle.location.address}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Équipements */}
          {vehicle.features.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Équipements</h3>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {vehicle.description && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {vehicle.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Bouton réserver */}
          <Button size="lg" className="w-full" asChild>
            <Link
              href={`/bookings/new?vehicleId=${vehicle.id}${
                search.startDate ? `&startDate=${search.startDate}` : ""
              }${search.endDate ? `&endDate=${search.endDate}` : ""}${
                search.startTime ? `&startTime=${search.startTime}` : ""
              }${search.endTime ? `&endTime=${search.endTime}` : ""}${
                search.pickup ? `&pickup=${encodeURIComponent(search.pickup)}` : ""
              }${
                search.returnLocation
                  ? `&returnLocation=${encodeURIComponent(search.returnLocation)}`
                  : ""
              }`}
            >
              Réserver maintenant
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

