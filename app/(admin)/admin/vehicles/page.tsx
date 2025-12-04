import { VehiclesPageClient } from "./VehiclesPageClient";
import { getLocationsAction } from "@/actions/admin/vehicles/get-locations";
import { getBrandsAction } from "@/actions/admin/vehicles/get-brands";
import prisma from "@/lib/prisma";
import { fixVehicleStatusesAction } from "@/actions/admin/vehicles/fix-vehicle-statuses";

export default async function AdminVehiclesPage() {
  // Charger les locations et marques côté serveur
  const [locationsResult, brandsResult] = await Promise.all([
    getLocationsAction(),
    getBrandsAction(),
  ]);

  const locations = locationsResult.success ? locationsResult.data : [];
  const brands = brandsResult.success ? brandsResult.data : [];

  // Logs serveur pour voir les statuts de tous les véhicules
  console.log("🚗 [ADMIN VÉHICULES] ===== STATUTS DES VÉHICULES =====");
  
  const allVehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      brand: true,
      model: true,
      licensePlate: true,
      status: true,
      category: true,
      location: {
        select: {
          city: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalVehicles = allVehicles.length;
  const availableVehicles = allVehicles.filter(v => v.status === "AVAILABLE").length;
  const reservedVehicles = allVehicles.filter(v => v.status === "RESERVED").length;
  const maintenanceVehicles = allVehicles.filter(v => v.status === "MAINTENANCE").length;
  const unavailableVehicles = allVehicles.filter(v => v.status === "UNAVAILABLE").length;

  console.log("📊 [ADMIN VÉHICULES] Statistiques AVANT correction:");
  console.log(`  - Total véhicules: ${totalVehicles}`);
  console.log(`  - AVAILABLE: ${availableVehicles}`);
  console.log(`  - RESERVED: ${reservedVehicles}`);
  console.log(`  - MAINTENANCE: ${maintenanceVehicles}`);
  console.log(`  - UNAVAILABLE: ${unavailableVehicles}`);
  console.log("");
  console.log("🚗 [ADMIN VÉHICULES] Liste détaillée des véhicules:");
  allVehicles.forEach((vehicle, index) => {
    console.log(`  ${index + 1}. ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`);
    console.log(`     Statut: ${vehicle.status} | Catégorie: ${vehicle.category} | Localisation: ${vehicle.location.city} (${vehicle.location.name})`);
  });
  
  // Corriger automatiquement les statuts si nécessaire
  if (reservedVehicles > 0 || unavailableVehicles > 0) {
    console.log("");
    console.log("🔧 [ADMIN VÉHICULES] Correction automatique des statuts...");
    const fixResult = await fixVehicleStatusesAction();
    if (fixResult.success && fixResult.data) {
      console.log(`✅ [ADMIN VÉHICULES] ${fixResult.data.updated} véhicule(s) remis en AVAILABLE`);
      if (fixResult.data.vehicles.length > 0) {
        fixResult.data.vehicles.forEach(v => {
          console.log(`   - ${v.brand} ${v.model} (${v.licensePlate}) : ${v.oldStatus} → ${v.newStatus}`);
        });
      }
    }
  }
  
  console.log("🚗 [ADMIN VÉHICULES] =====================================");

  return <VehiclesPageClient initialLocations={locations} initialBrands={brands} />;
}
