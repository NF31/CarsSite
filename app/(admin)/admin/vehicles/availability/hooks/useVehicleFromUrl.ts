import { useState, useEffect, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { getVehicleByIdAction } from "@/actions/admin/vehicles";
import type { VehicleCategory, VehicleStatus } from "@prisma/client";

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

export function useVehicleFromUrl() {
  const searchParams = useSearchParams();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const vehicleIdFromUrl = searchParams.get("vehicleId");
    if (vehicleIdFromUrl && !selectedVehicle) {
      startTransition(async () => {
        try {
          const vehicleResult = await getVehicleByIdAction(vehicleIdFromUrl);
          if (vehicleResult.success && vehicleResult.data) {
            const vehicle: Vehicle = {
              id: vehicleResult.data.id,
              brand: vehicleResult.data.brand,
              model: vehicleResult.data.model,
              year: vehicleResult.data.year,
              licensePlate: vehicleResult.data.licensePlate,
              mileage: vehicleResult.data.mileage,
              category: vehicleResult.data.category as VehicleCategory,
              seats: vehicleResult.data.seats,
              transmission: vehicleResult.data.transmission,
              fuelType: vehicleResult.data.fuelType,
              color: vehicleResult.data.color,
              pricePerDay: vehicleResult.data.pricePerDay,
              pricePerWeek: vehicleResult.data.pricePerWeek,
              pricePerMonth: vehicleResult.data.pricePerMonth,
              deposit: vehicleResult.data.deposit,
              status: vehicleResult.data.status as VehicleStatus,
              locationId: vehicleResult.data.locationId,
              location: {
                id: vehicleResult.data.location.id,
                name: vehicleResult.data.location.name,
                city: vehicleResult.data.location.city,
                address: vehicleResult.data.location.address || "",
              },
              features: vehicleResult.data.features,
              images: vehicleResult.data.images,
              description: vehicleResult.data.description,
              createdAt: new Date(vehicleResult.data.createdAt),
              updatedAt: new Date(vehicleResult.data.updatedAt),
              _count: vehicleResult.data._count,
            };
            setSelectedVehicle(vehicle);
          }
        } catch (error) {
          console.error("Error loading vehicle from URL:", error);
        }
      });
    }
  }, [searchParams, selectedVehicle]);

  return {
    selectedVehicle,
    setSelectedVehicle,
    isPending,
  };
}

export type { Vehicle };

