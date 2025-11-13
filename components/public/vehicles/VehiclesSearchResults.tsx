import { getPublicVehiclesAction } from "@/actions/public/vehicles";
import { HomeVehicleCard } from "@/components/public/home/HomeVehicleCard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

interface VehiclesSearchResultsProps {
  filters: {
    category?: "cars" | "utility" | "subscription";
    pickupPlaceId?: string;
    returnPlaceId?: string;
    startDate?: string;
    endDate?: string;
    locationId?: string;
    page?: number;
  };
}

export async function VehiclesSearchResults({
  filters,
}: VehiclesSearchResultsProps) {
  const result = await getPublicVehiclesAction({
    category: filters.category,
    pickupPlaceId: filters.pickupPlaceId,
    returnPlaceId: filters.returnPlaceId,
    startDate: filters.startDate,
    endDate: filters.endDate,
    locationId: filters.locationId,
    page: filters.page || 1,
    limit: 12,
  });

  if (!result.success) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Une erreur s'est produite lors de la recherche de véhicules. Veuillez
          réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  if (!result.data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Aucune donnée disponible. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  const { vehicles, total, page, totalPages } = result.data;

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">
          Aucun véhicule trouvé
        </h2>
        <p className="text-muted-foreground mb-6">
          Aucun véhicule ne correspond à vos critères de recherche. Essayez de
          modifier vos filtres.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Modifier la recherche</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec nombre de résultats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {total} véhicule{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}
          </h2>
          {filters.startDate && filters.endDate && (
            <p className="text-sm text-muted-foreground mt-1">
              Du {new Date(filters.startDate).toLocaleDateString("fr-FR")} au{" "}
              {new Date(filters.endDate).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      </div>

      {/* Grille de véhicules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <HomeVehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          {page > 1 && (
            <Button
              asChild
              variant="outline"
              className="px-4"
            >
              <Link
                href={`/vehicles?${new URLSearchParams({
                  ...(filters.category && { category: filters.category }),
                  ...(filters.pickupPlaceId && { pickupPlaceId: filters.pickupPlaceId }),
                  ...(filters.returnPlaceId && { returnPlaceId: filters.returnPlaceId }),
                  ...(filters.startDate && { startDate: filters.startDate }),
                  ...(filters.endDate && { endDate: filters.endDate }),
                  ...(filters.locationId && { locationId: filters.locationId }),
                  page: String(page - 1),
                }).toString()}`}
              >
                Précédent
              </Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </span>
          {page < totalPages && (
            <Button
              asChild
              variant="outline"
              className="px-4"
            >
              <Link
                href={`/vehicles?${new URLSearchParams({
                  ...(filters.category && { category: filters.category }),
                  ...(filters.pickupPlaceId && { pickupPlaceId: filters.pickupPlaceId }),
                  ...(filters.returnPlaceId && { returnPlaceId: filters.returnPlaceId }),
                  ...(filters.startDate && { startDate: filters.startDate }),
                  ...(filters.endDate && { endDate: filters.endDate }),
                  ...(filters.locationId && { locationId: filters.locationId }),
                  page: String(page + 1),
                }).toString()}`}
              >
                Suivant
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

