import type { TransmissionType } from "@/lib/types/transmission-type";
import type { FuelType } from "@/lib/types/fuel-type";
import type { VehicleCategory } from "@/lib/types/vehicle-category";
import type { VehicleStatus } from "@/lib/types/vehicle-status";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  mileage: number;
  category: VehicleCategory;
  seats: number;
  transmission: TransmissionType;
  fuelType: FuelType;
  color: string;
  pricePerDay: number;
  pricePerWeek: number | null;
  pricePerMonth: number | null;
  deposit: number;
  status: VehicleStatus;
  location: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
  features: string[];
  images: string[];
  description: string | null;
  _count: {
    bookings: number;
    reviews: number;
  };
}

export interface VehiclesListViewProps {
  vehicles: Vehicle[];
  startIndex?: number;
}

