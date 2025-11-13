"use server";

import { prisma } from "@/lib/prisma";
import type { VehicleCategory } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export interface PublicVehicleSearchFilters {
  category?: "cars" | "utility" | "subscription";
  pickupPlaceId?: string;
  returnPlaceId?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  locationId?: string;
  transmission?: "MANUAL" | "AUTOMATIC";
  minSeats?: number;
  maxPrice?: number;
  fuelType?: "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID";
  sortBy?: "price_asc" | "price_desc" | "newest" | "oldest";
  page?: number;
  limit?: number;
}

export interface PublicVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: VehicleCategory;
  pricePerDay: number;
  images: string[];
  seats: number;
  transmission: string;
  fuelType: string;
  location: {
    id: string;
    name: string;
    city: string;
    address: string;
  };
  rating: number;
  reviewCount: number;
  bookingCount: number;
}

export interface PublicVehiclesResult {
  success: boolean;
  data?: {
    vehicles: PublicVehicle[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

/**
 * Mappe les catégories du widget vers les catégories Prisma
 */
function mapCategoryToVehicleCategories(
  category?: "cars" | "utility" | "subscription"
): VehicleCategory[] | undefined {
  if (!category) return undefined;

  switch (category) {
    case "cars":
      // Toutes les catégories sauf VAN
      return ["ECONOMY", "COMPACT", "MID_SIZE", "FULL_SIZE", "SUV", "LUXURY"];
    case "utility":
      return ["VAN"];
    case "subscription":
      // Pour l'abonnement, on pourrait inclure toutes les catégories ou certaines spécifiques
      // Pour l'instant, on inclut toutes les catégories
      return undefined; // undefined signifie toutes les catégories
    default:
      return undefined;
  }
}

/**
 * Récupère les véhicules disponibles avec les filtres de recherche
 */
export async function getPublicVehiclesAction(
  filters: PublicVehicleSearchFilters = {}
): Promise<PublicVehiclesResult> {
  console.log("🔍 [RECHERCHE VÉHICULES] Début de la recherche publique");
  console.log("📋 [RECHERCHE VÉHICULES] Filtres reçus:", JSON.stringify(filters, null, 2));
  
  try {
    const {
      category,
      pickupPlaceId,
      returnPlaceId,
      startDate,
      endDate,
      startTime,
      endTime,
      locationId,
      transmission,
      minSeats,
      maxPrice,
      fuelType,
      sortBy = "price_asc",
      page = 1,
      limit = 12,
    } = filters;

    // Construire les conditions WHERE
    // Inclure AVAILABLE et RESERVED - le filtrage par dates gère la disponibilité réelle
    // RESERVED signifie qu'il y a une réservation, mais pas forcément sur les dates recherchées
    const where: Prisma.VehicleWhereInput = {
      status: {
        in: ["AVAILABLE", "RESERVED"],
      },
    };
    
    console.log("✅ [RECHERCHE VÉHICULES] Filtre de statut: AVAILABLE et RESERVED (disponibilité gérée par les dates)");

    // Filtrer par catégorie seulement si une catégorie est spécifiée
    const vehicleCategories = mapCategoryToVehicleCategories(category);
    if (vehicleCategories && vehicleCategories.length > 0) {
      where.category = {
        in: vehicleCategories,
      };
      console.log("📂 [RECHERCHE VÉHICULES] Filtre de catégorie appliqué:", vehicleCategories);
    } else {
      console.log("📂 [RECHERCHE VÉHICULES] Aucun filtre de catégorie (toutes les catégories)");
    }
    // Si category est "subscription", on n'applique pas de filtre de catégorie
    // car mapCategoryToVehicleCategories retourne undefined pour "subscription"

    // Filtrer par transmission
    if (transmission) {
      where.transmission = transmission;
      console.log("⚙️ [RECHERCHE VÉHICULES] Filtre de transmission appliqué:", transmission);
    }

    // Filtrer par nombre de places minimum
    if (minSeats) {
      where.seats = {
        gte: minSeats,
      };
      console.log("👥 [RECHERCHE VÉHICULES] Filtre de places minimum appliqué:", minSeats);
    }

    // Filtrer par prix maximum
    if (maxPrice) {
      where.pricePerDay = {
        lte: maxPrice,
      };
      console.log("💰 [RECHERCHE VÉHICULES] Filtre de prix maximum appliqué:", maxPrice);
    }

    // Filtrer par type de carburant
    if (fuelType) {
      where.fuelType = fuelType;
      console.log("⛽ [RECHERCHE VÉHICULES] Filtre de carburant appliqué:", fuelType);
    }

    // Filtrer par localisation si fournie
    // Pour l'instant, on ignore le locationId car il n'est pas encore implémenté
    // TODO: Implémenter le filtrage par locationId une fois que la logique de correspondance avec pickupPlaceId sera faite
    if (locationId) {
      console.log("📍 [RECHERCHE VÉHICULES] LocationId fourni mais non implémenté:", locationId);
    }
    if (pickupPlaceId) {
      console.log("📍 [RECHERCHE VÉHICULES] PickupPlaceId fourni:", pickupPlaceId);
    }
    if (returnPlaceId) {
      console.log("📍 [RECHERCHE VÉHICULES] ReturnPlaceId fourni:", returnPlaceId);
    }

    // Filtrer par disponibilité selon les dates et heures si fournies
    // On vérifie qu'il n'y a pas de réservations ou maintenances qui se chevauchent
    if (startDate && endDate && startTime && endTime) {
      console.log("📅 [RECHERCHE VÉHICULES] Filtrage par dates et heures activé");
      console.log("📅 [RECHERCHE VÉHICULES] Date de début:", startDate, "Heure:", startTime);
      console.log("📅 [RECHERCHE VÉHICULES] Date de fin:", endDate, "Heure:", endTime);
      
      try {
        // Combiner la date avec l'heure pour avoir une date/heure précise
        const [startHours, startMinutes] = startTime.split(":").map(Number);
        const [endHours, endMinutes] = endTime.split(":").map(Number);
        
        // Utiliser l'heure fournie, ou 00:00 par défaut si invalide
        const start = new Date(startDate);
        start.setHours(
          !isNaN(startHours) ? startHours : 0, 
          !isNaN(startMinutes) ? startMinutes : 0, 
          0, 
          0
        );
        
        const end = new Date(endDate);
        end.setHours(
          !isNaN(endHours) ? endHours : 0, 
          !isNaN(endMinutes) ? endMinutes : 0, 
          0, 
          0
        );
        
        // S'assurer que les dates sont valides
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          console.log("📅 [RECHERCHE VÉHICULES] Dates valides, application du filtre de disponibilité");
          
          // Exclure les véhicules qui ont des réservations qui se chevauchent
          // Logique de chevauchement : startDate < end ET endDate > start
          // (même logique que dans check-availability.ts pour être cohérent avec le calendrier admin)
          where.NOT = {
            OR: [
              // Véhicules avec des réservations confirmées/en cours/pending qui se chevauchent
              {
                bookings: {
                  some: {
                    status: {
                      in: ["CONFIRMED", "IN_PROGRESS", "PENDING"],
                    },
                    startDate: {
                      lt: end, // La réservation commence avant la fin de la recherche
                    },
                    endDate: {
                      gt: start, // La réservation se termine après le début de la recherche
                    },
                  },
                },
              },
              // Véhicules avec des maintenances bloquées qui se chevauchent
              {
                maintenances: {
                  some: {
                    status: {
                      in: ["SCHEDULED", "IN_PROGRESS"],
                    },
                    type: "BLOCKED",
                    startDate: {
                      lt: end, // La maintenance commence avant la fin de la recherche
                    },
                    endDate: {
                      gt: start, // La maintenance se termine après le début de la recherche
                    },
                  },
                },
              },
            ],
          };
          
          console.log("📅 [RECHERCHE VÉHICULES] Filtre de disponibilité par dates appliqué");
        } else {
          console.warn("⚠️ [RECHERCHE VÉHICULES] Dates invalides, filtre de disponibilité ignoré");
        }
      } catch (error) {
        console.error("❌ [RECHERCHE VÉHICULES] Erreur lors du filtrage par disponibilité:", error);
        // En cas d'erreur, on ignore le filtre de disponibilité
      }
    } else {
      console.log("📅 [RECHERCHE VÉHICULES] Aucun filtre de dates (startDate ou endDate manquant)");
    }
    
    console.log("🔍 [RECHERCHE VÉHICULES] Clause WHERE finale:", JSON.stringify(where, null, 2));

    // Calculer le skip
    const skip = (page - 1) * limit;
    console.log("📄 [RECHERCHE VÉHICULES] Pagination - Page:", page, "Limit:", limit, "Skip:", skip);

    // Déterminer l'ordre de tri
    let orderBy: Prisma.VehicleOrderByWithRelationInput;
    switch (sortBy) {
      case "price_asc":
        orderBy = { pricePerDay: "asc" };
        break;
      case "price_desc":
        orderBy = { pricePerDay: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      default:
        orderBy = { pricePerDay: "asc" };
    }
    console.log("🔀 [RECHERCHE VÉHICULES] Tri appliqué:", sortBy);

    // Compter les véhicules avant la requête principale pour le debug
    const totalBeforeQuery = await prisma.vehicle.count({ where });
    console.log("🔢 [RECHERCHE VÉHICULES] Total de véhicules correspondant aux critères:", totalBeforeQuery);

    // Récupérer les véhicules
    console.log("🔍 [RECHERCHE VÉHICULES] Exécution de la requête Prisma...");
    const vehicles = await prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    console.log("✅ [RECHERCHE VÉHICULES] Véhicules trouvés:", vehicles.length);

    // Calculer le total
    const total = await prisma.vehicle.count({ where });
    console.log("📊 [RECHERCHE VÉHICULES] Total final:", total);
    
    // TOUJOURS afficher les statistiques pour debug
    const totalVehicles = await prisma.vehicle.count();
    const availableVehicles = await prisma.vehicle.count({ where: { status: "AVAILABLE" } });
    const reservedVehicles = await prisma.vehicle.count({ where: { status: "RESERVED" } });
    const maintenanceVehicles = await prisma.vehicle.count({ where: { status: "MAINTENANCE" } });
    const unavailableVehicles = await prisma.vehicle.count({ where: { status: "UNAVAILABLE" } });
    
    console.log("📊 [RECHERCHE VÉHICULES] ===== STATISTIQUES COMPLÈTES =====");
    console.log("  - Total véhicules en base:", totalVehicles);
    console.log("  - Disponibles (AVAILABLE):", availableVehicles);
    console.log("  - Réservés (RESERVED):", reservedVehicles);
    console.log("  - En maintenance (MAINTENANCE):", maintenanceVehicles);
    console.log("  - Indisponibles (UNAVAILABLE):", unavailableVehicles);
    console.log("📊 [RECHERCHE VÉHICULES] ====================================");

    // Logs détaillés sur les résultats
    if (vehicles.length > 0) {
      console.log("🚗 [RECHERCHE VÉHICULES] Détails des véhicules trouvés:");
      vehicles.forEach((vehicle, index) => {
        console.log(`  ${index + 1}. ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) - Statut: ${vehicle.status} - Catégorie: ${vehicle.category} - Localisation: ${vehicle.location.city}`);
      });
    } else {
      console.warn("⚠️ [RECHERCHE VÉHICULES] AUCUN VÉHICULE TROUVÉ - Analyse des causes...");
      
      // Si aucun véhicule n'est trouvé, vérifier combien de véhicules existent au total
      const totalVehicles = await prisma.vehicle.count();
      const availableVehicles = await prisma.vehicle.count({ where: { status: "AVAILABLE" } });
      const reservedVehicles = await prisma.vehicle.count({ where: { status: "RESERVED" } });
      const maintenanceVehicles = await prisma.vehicle.count({ where: { status: "MAINTENANCE" } });
      const unavailableVehicles = await prisma.vehicle.count({ where: { status: "UNAVAILABLE" } });
      
      console.log("📊 [RECHERCHE VÉHICULES] Statistiques de la base de données:");
      console.log("  - Total véhicules:", totalVehicles);
      console.log("  - Disponibles (AVAILABLE):", availableVehicles);
      console.log("  - Réservés (RESERVED):", reservedVehicles);
      console.log("  - En maintenance (MAINTENANCE):", maintenanceVehicles);
      console.log("  - Indisponibles (UNAVAILABLE):", unavailableVehicles);
      console.log("📂 [RECHERCHE VÉHICULES] Catégorie recherchée:", category);
      console.log("📂 [RECHERCHE VÉHICULES] Catégories de véhicules filtrées:", vehicleCategories || "Toutes");
      
      // Afficher quelques exemples de véhicules avec leurs catégories
      const sampleVehicles = await prisma.vehicle.findMany({
        take: 10,
        select: {
          id: true,
          brand: true,
          model: true,
          licensePlate: true,
          category: true,
          status: true,
          location: {
            select: {
              city: true,
            },
          },
        },
      });
      console.log("🔍 [RECHERCHE VÉHICULES] Exemples de véhicules en base (10 premiers):");
      sampleVehicles.forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.brand} ${v.model} (${v.licensePlate}) - Statut: ${v.status} - Catégorie: ${v.category} - Ville: ${v.location.city}`);
      });
      
      if (vehicleCategories && vehicleCategories.length > 0) {
        const vehiclesWithCategory = await prisma.vehicle.count({
          where: {
            category: { in: vehicleCategories },
            status: "AVAILABLE",
          },
        });
        console.log("📂 [RECHERCHE VÉHICULES] Véhicules AVAILABLE avec la catégorie recherchée:", vehiclesWithCategory);
      }
      
      if (startDate && endDate) {
        const availableWithoutDateFilter = await prisma.vehicle.count({
          where: {
            status: "AVAILABLE",
            ...(vehicleCategories && vehicleCategories.length > 0 ? { category: { in: vehicleCategories } } : {}),
          },
        });
        console.log("📅 [RECHERCHE VÉHICULES] Véhicules AVAILABLE SANS filtre de dates:", availableWithoutDateFilter);
        console.log("📅 [RECHERCHE VÉHICULES] Véhicules exclus par le filtre de dates:", availableWithoutDateFilter - total);
      }
    }

    // Transformer les véhicules en format public
    const publicVehicles: PublicVehicle[] = vehicles.map(
      (vehicle) => {
        const avgRating =
          vehicle.reviews.length > 0
            ? vehicle.reviews.reduce((sum, r) => sum + r.rating, 0) /
              vehicle.reviews.length
            : 0;

        return {
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          category: vehicle.category,
          pricePerDay: vehicle.pricePerDay,
          images: vehicle.images,
          seats: vehicle.seats,
          transmission: vehicle.transmission,
          fuelType: vehicle.fuelType,
          location: vehicle.location,
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: vehicle._count.reviews,
          bookingCount: vehicle._count.bookings,
        };
      }
    );

    // Calculer le nombre total de pages
    const totalPages = Math.ceil(total / limit);
    
    console.log("📄 [RECHERCHE VÉHICULES] Résultat final:");
    console.log("  - Véhicules retournés:", publicVehicles.length);
    console.log("  - Total pages:", totalPages);
    console.log("✅ [RECHERCHE VÉHICULES] Recherche terminée avec succès");

    return {
      success: true,
      data: {
        vehicles: publicVehicles,
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    console.error("❌ [RECHERCHE VÉHICULES] ERREUR lors de la recherche:", error);
    console.error("❌ [RECHERCHE VÉHICULES] Stack trace:", error instanceof Error ? error.stack : "N/A");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

  