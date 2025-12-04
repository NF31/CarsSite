"use client";

import { useState } from "react";
import { DeleteVehicleDialog } from "@/components/admin/vehicles/DeleteVehicleDialog";
import type { TransmissionType, FuelType } from "@prisma/client";
import type { VehicleCategory } from "@/lib/types/vehicle-category";
import type { VehicleStatus } from "@/lib/types/vehicle-status";
import { useVehicleImageGallery } from "./hooks";
import {
  VehicleDetailsHeader,
  VehicleImageGallery,
  VehicleGeneralInfo,
  VehicleDescription,
  VehicleFeatures,
  VehiclePricing,
  VehicleStats,
  VehicleMetadata,
} from "./components";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  mileage: number;
  category: string;
  seats: number;
  transmission: string;
  fuelType: string;
  color: string;
  pricePerDay: number;
  pricePerWeek: number | null;
  pricePerMonth: number | null;
  deposit: number;
  status: string;
  location: {
    id: string;
    name: string;
    city: string;
    address?: string;
  };
  features: string[];
  images: string[];
  imagePublicIds: string[];
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    bookings: number;
    reviews: number;
  };
}

interface VehicleDetailsPageClientProps {
  vehicle: Vehicle;
}

export function VehicleDetailsPageClient({ vehicle }: VehicleDetailsPageClientProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { selectedImageIndex, selectImage } = useVehicleImageGallery(vehicle.images || []);

  return (
    <div className="space-y-6">
      <VehicleDetailsHeader
        vehicleId={vehicle.id}
        brand={vehicle.brand}
        model={vehicle.model}
        year={vehicle.year}
        licensePlate={vehicle.licensePlate}
        onDeleteClick={() => setDeleteDialogOpen(true)}
      />

      <VehicleImageGallery
        images={vehicle.images || []}
        brand={vehicle.brand}
        model={vehicle.model}
        selectedImageIndex={selectedImageIndex}
        onImageSelect={selectImage}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <VehicleGeneralInfo
            status={vehicle.status}
            category={vehicle.category}
            mileage={vehicle.mileage}
            seats={vehicle.seats}
            fuelType={vehicle.fuelType}
            transmission={vehicle.transmission}
            color={vehicle.color}
            location={vehicle.location}
          />

          <VehicleDescription description={vehicle.description || ""} />

          <VehicleFeatures features={vehicle.features || []} />
        </div>

        <div className="space-y-6">
          <VehiclePricing
            pricePerDay={vehicle.pricePerDay}
            pricePerWeek={vehicle.pricePerWeek}
            pricePerMonth={vehicle.pricePerMonth}
            deposit={vehicle.deposit}
          />

          <VehicleStats
            bookingsCount={vehicle._count.bookings}
            reviewsCount={vehicle._count.reviews}
          />

          <VehicleMetadata createdAt={vehicle.createdAt} updatedAt={vehicle.updatedAt} />
        </div>
      </div>

      <DeleteVehicleDialog
        vehicle={{
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          licensePlate: vehicle.licensePlate,
          mileage: vehicle.mileage,
          category: vehicle.category as VehicleCategory,
          seats: vehicle.seats,
          transmission: vehicle.transmission as TransmissionType,
          fuelType: vehicle.fuelType as FuelType,
          color: vehicle.color,
          status: vehicle.status as VehicleStatus,
          pricePerDay: vehicle.pricePerDay,
          pricePerWeek: vehicle.pricePerWeek,
          pricePerMonth: vehicle.pricePerMonth,
          deposit: vehicle.deposit,
          location: vehicle.location,
          features: vehicle.features,
          images: vehicle.images,
          description: vehicle.description,
          _count: vehicle._count,
        }}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}

