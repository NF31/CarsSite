import { VehiclesPageClient } from "./VehiclesPageClient";
import { getLocationsAction } from "@/actions/admin/vehicles/get-locations";
import { getBrandsAction } from "@/actions/admin/vehicles/get-brands";

export default async function AdminVehiclesPage() {
  // Charger les locations et marques côté serveur
  const [locationsResult, brandsResult] = await Promise.all([
    getLocationsAction(),
    getBrandsAction(),
  ]);

  const locations = locationsResult.success ? locationsResult.data : [];
  const brands = brandsResult.success ? brandsResult.data : [];

  return <VehiclesPageClient initialLocations={locations} initialBrands={brands} />;
}
