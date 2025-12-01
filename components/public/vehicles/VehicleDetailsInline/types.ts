export interface VehicleDetailsInlineProps {
  vehicleId: string | null;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  pickup?: string;
  returnLocation?: string;
  onClose: () => void;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  transmission: string;
  fuelType: string;
  color: string;
  seats: number;
  mileage?: number;
  pricePerDay: number;
  pricePerWeek?: number | null;
  pricePerMonth?: number | null;
  deposit: number;
  rating: number;
  reviewCount: number;
  images: string[];
  features?: string[];
  description?: string;
  location: {
    name: string;
    city: string;
    address?: string | null;
  };
}

export interface PriceCalculation {
  totalAmount: number | null;
  numberOfDays: number | null;
}

