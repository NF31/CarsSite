import { Metadata } from "next";
import dynamic from "next/dynamic";
import { getPublicVehiclesAction } from "@/actions/public/vehicles";
import { VehiclesPageClient } from "./VehiclesPageClient";
import { VehiclesSort } from "@/components/public/vehicles/VehiclesSort";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Lazy load VehiclesSearchBar (Google Maps est lourd)
// Note: Le composant lui-même gère déjà le chargement conditionnel de Google Maps
const VehiclesSearchBar = dynamic(
  () => import("@/components/public/vehicles/VehiclesSearchBar").then((mod) => ({ default: mod.VehiclesSearchBar })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[120px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-xs text-muted-foreground">Chargement de la recherche...</p>
        </div>
      </div>
    ),
  }
);

interface VehiclesPageProps {
  searchParams: Promise<{
    category?: string;
    pickup?: string;
    pickupPlaceId?: string;
    returnLocation?: string;
    returnPlaceId?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    locationId?: string;
    transmission?: string;
    minSeats?: string;
    maxPrice?: string;
    fuelType?: string;
    sortBy?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: VehiclesPageProps): Promise<Metadata> {
  const params = await searchParams;
  
  // Si on a des critères de recherche, personnaliser le titre
  if (params.startDate && params.endDate) {
    const startDate = new Date(params.startDate).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const endDate = new Date(params.endDate).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const title = `Véhicules disponibles du ${startDate} au ${endDate} - CarRental`;
    const description = `Trouvez votre véhicule de location du ${startDate} au ${endDate}. ${params.pickup ? `Retrait à ${params.pickup}. ` : ""}Large choix de véhicules disponibles.`;
    
    return {
      title,
      description,
      robots: {
        index: true,
        follow: true,
      },
      openGraph: {
        title,
        description,
        type: "website",
      },
    };
  }
  
  // Par défaut (sans recherche), titre simple
  return {
    title: "Véhicules - CarRental",
    description: "Découvrez notre catalogue de véhicules disponibles à la location.",
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: "Véhicules - CarRental",
      description: "Découvrez notre catalogue de véhicules disponibles à la location.",
      type: "website",
    },
  };
}

export default async function VehiclesPage({
  searchParams,
}: VehiclesPageProps) {
  // Await searchParams (Next.js 15)
  const params = await searchParams;

  // Debug: Afficher tous les paramètres reçus (uniquement en développement)
  if (process.env.NODE_ENV === "development") {
    console.log("[VehiclesPage] All search params:", {
      category: params.category,
      pickup: params.pickup,
      pickupPlaceId: params.pickupPlaceId,
      returnLocation: params.returnLocation,
      returnPlaceId: params.returnPlaceId,
      startDate: params.startDate,
      endDate: params.endDate,
      startTime: params.startTime,
      endTime: params.endTime,
    });
  }

  // Extraire les paramètres de recherche
  const category =
    params.category === "cars" ||
    params.category === "utility" ||
    params.category === "subscription"
      ? params.category
      : undefined;

  const pickupPlaceId = params.pickupPlaceId;
  const pickup = params.pickup?.trim() || ""; // Adresse de retrait saisie
  const returnPlaceId = params.returnPlaceId;
  const returnLocation = params.returnLocation?.trim() || ""; // Adresse de retour saisie
  const startDate = params.startDate;
  const endDate = params.endDate;
  const startTime = params.startTime || "";
  const endTime = params.endTime || "";
  const transmission = params.transmission === "MANUAL" || params.transmission === "AUTOMATIC" ? params.transmission : undefined;
  const minSeats = params.minSeats ? parseInt(params.minSeats, 10) : undefined;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : undefined;
  const fuelType = params.fuelType === "PETROL" || params.fuelType === "DIESEL" || params.fuelType === "ELECTRIC" || params.fuelType === "HYBRID" ? params.fuelType : undefined;
  const sortBy = params.sortBy === "price_asc" || params.sortBy === "price_desc" || params.sortBy === "newest" || params.sortBy === "oldest" ? params.sortBy : undefined;
  const page = parseInt(params.page || "1", 10);

  // Récupérer les véhicules disponibles
  const result = await getPublicVehiclesAction({
    category,
    pickupPlaceId,
    returnPlaceId,
    startDate,
    endDate,
    startTime,
    endTime,
    transmission,
    minSeats,
    maxPrice,
    fuelType,
    sortBy,
    page,
    limit: 12,
  });

  const vehicles = result.success && result.data ? result.data.vehicles : [];
  const total = result.success && result.data ? result.data.total : 0;
  const totalPages = result.success && result.data ? result.data.totalPages : 1;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 w-full max-w-full">
          {/* Widget de recherche modifiable - style Sixt */}
          <VehiclesSearchBar
            initialPickup={pickup}
            initialPickupPlaceId={pickupPlaceId}
            initialReturnLocation={returnLocation}
            initialReturnPlaceId={returnPlaceId}
            initialStartDate={startDate}
            initialEndDate={endDate}
            initialStartTime={startTime}
            initialEndTime={endTime}
            initialCategory={category}
          />
        </div>
      </div>

      <div className="container px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* En-tête avec nombre de résultats et tri */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                {total} véhicule{total > 1 ? "s" : ""} disponible{total > 1 ? "s" : ""}
              </h1>
              {startDate && endDate && startTime && endTime && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                  {new Date(startDate).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  {startTime} - {new Date(endDate).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  {endTime}
                </p>
              )}
            </div>
            {vehicles.length > 0 && (
              <div className="w-full sm:w-auto">
                <VehiclesSort />
              </div>
            )}
          </div>
        </div>

        {/* Résultats */}
        {vehicles.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              Aucun véhicule trouvé
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">
              Aucun véhicule ne correspond à vos critères de recherche.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center px-4">
              {/* Réinitialiser les filtres uniquement */}
              {(transmission || minSeats || maxPrice || fuelType) && (
                <Button asChild variant="default">
                  <Link
                    href={`/vehicles?${new URLSearchParams({
                      ...(category && { category }),
                      ...(pickup && { pickup }),
                      ...(pickupPlaceId && { pickupPlaceId }),
                      ...(returnLocation && { returnLocation }),
                      ...(returnPlaceId && { returnPlaceId }),
                      ...(startDate && { startDate }),
                      ...(endDate && { endDate }),
                      ...(startTime && { startTime }),
                      ...(endTime && { endTime }),
                    }).toString()}`}
                  >
                    Réinitialiser les filtres
                  </Link>
                </Button>
              )}
              {/* Modifier la recherche complète */}
              <Button asChild variant="outline">
                <Link href="/">Modifier la recherche</Link>
              </Button>
            </div>
          </div>
        ) : (
          <VehiclesPageClient
            vehicles={vehicles}
            total={total}
            totalPages={totalPages}
            page={page}
            category={category}
            pickup={pickup}
            pickupPlaceId={pickupPlaceId}
            returnLocation={returnLocation}
            returnPlaceId={returnPlaceId}
            startDate={startDate}
            endDate={endDate}
            startTime={startTime}
            endTime={endTime}
            transmission={transmission}
            minSeats={minSeats}
            maxPrice={maxPrice}
            fuelType={fuelType}
            sortBy={sortBy}
          />
        )}
      </div>
    </div>
  );
}

