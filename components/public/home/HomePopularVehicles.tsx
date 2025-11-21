import { prisma } from "@/lib/prisma";
import { HomeVehicleCard } from "./HomeVehicleCard";

async function getPopularVehicles() {
  try {
    // Récupérer tous les véhicules sans filtre de statut pour avoir plus de résultats
    const vehicles = await prisma.vehicle.findMany({
      include: {
        location: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
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
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
    });

    console.log(`[HomePopularVehicles] Found ${vehicles.length} vehicles`);

    return vehicles.map((vehicle) => {
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
    });
  } catch (error) {
    console.error("Error fetching popular vehicles:", error);
    return [];
  }
}

export async function HomePopularVehicles() {
  const vehicles = await getPopularVehicles();

  console.log(`[HomePopularVehicles] Rendering ${vehicles.length} vehicles`);

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Aucun véhicule disponible pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
      {vehicles.map((vehicle) => (
        <HomeVehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
