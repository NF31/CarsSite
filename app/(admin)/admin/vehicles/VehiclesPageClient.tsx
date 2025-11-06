"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Grid3x3, List, Plus, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getVehiclesAction, type GetVehiclesFilters } from "@/actions/admin/vehicles";
import { VehiclesFilters } from "@/components/admin/vehicles/VehiclesFilters";
import { VehiclesGridView } from "@/components/admin/vehicles/VehiclesGridView";
import { VehiclesListView } from "@/components/admin/vehicles/VehiclesListView";
import { VehiclesPagination } from "@/components/admin/vehicles/VehiclesPagination";
import type { VehicleCategory, VehicleStatus } from "@prisma/client";

type ViewMode = "grid" | "list";

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

interface VehiclesPageClientProps {
  initialLocations: Array<{ id: string; name: string; city: string }>;
  initialBrands: string[];
}

export function VehiclesPageClient({
  initialLocations,
  initialBrands,
}: VehiclesPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<"created" | "updated" | null>(null);

  // Vérifier si un message de succès doit être affiché
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "vehicle-created") {
      setShowSuccess(true);
      setSuccessType("created");
      // Retirer le paramètre de l'URL après affichage
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("success");
      const newUrl = newSearchParams.toString() 
        ? `${window.location.pathname}?${newSearchParams.toString()}`
        : window.location.pathname;
      router.replace(newUrl);
      // Masquer le message après 5 secondes
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessType(null);
      }, 5000);
    } else if (success === "vehicle-updated") {
      setShowSuccess(true);
      setSuccessType("updated");
      // Retirer le paramètre de l'URL après affichage
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("success");
      const newUrl = newSearchParams.toString() 
        ? `${window.location.pathname}?${newSearchParams.toString()}`
        : window.location.pathname;
      router.replace(newUrl);
      // Masquer le message après 5 secondes
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessType(null);
      }, 5000);
    }
  }, [searchParams, router]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filters, setFilters] = useState<GetVehiclesFilters>({
    page: 1,
    limit: 12,
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

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
    setFilters({ ...newFilters, page: 1, limit: 12 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {/* Message de succès */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          <span>
            {successType === "updated" 
              ? "Véhicule modifié avec succès !" 
              : "Véhicule créé avec succès !"}
          </span>
        </div>
      )}
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Véhicules</h1>
          <p className="text-gray-600 mt-1">
            Gérez tous les véhicules de votre flotte ({pagination.total} véhicules)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md p-1 bg-white">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="sr-only">Vue grille</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
              <span className="sr-only">Vue liste</span>
            </Button>
          </div>
          <Button asChild>
            <Link href="/admin/vehicles/add">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un véhicule
            </Link>
          </Button>
        </div>
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
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Chargement des véhicules...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="space-y-6">
              <VehiclesGridView 
                vehicles={vehicles} 
                startIndex={(pagination.page - 1) * pagination.limit}
              />
              
              {/* Pagination pour la vue grid */}
              {vehicles.length > 0 && (
                <VehiclesPagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  hasNext={pagination.hasNext}
                  hasPrev={pagination.hasPrev}
                  startIndex={(pagination.page - 1) * pagination.limit}
                  itemsPerPage={pagination.limit}
                  totalItems={pagination.total}
                />
              )}
            </div>
          ) : (
            <>
              <VehiclesListView 
                vehicles={vehicles} 
                startIndex={(pagination.page - 1) * pagination.limit}
              />

              {/* Pagination pour la vue list */}
              {vehicles.length > 0 && (
                <VehiclesPagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  hasNext={pagination.hasNext}
                  hasPrev={pagination.hasPrev}
                  startIndex={(pagination.page - 1) * pagination.limit}
                  itemsPerPage={pagination.limit}
                  totalItems={pagination.total}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

