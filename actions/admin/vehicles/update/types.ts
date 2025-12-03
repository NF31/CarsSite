export interface UpdateVehicleResult {
  success: boolean;
  data?: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
  };
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

