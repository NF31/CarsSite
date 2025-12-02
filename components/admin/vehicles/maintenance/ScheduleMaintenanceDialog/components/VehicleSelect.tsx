import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { MaintenanceVehicleOption } from "@/actions/admin/vehicles/get-maintenance-vehicles";
import type { DialogMode } from "../types";

interface VehicleSelectProps {
  vehicleId: string;
  onValueChange: (value: string) => void;
  vehicles: MaintenanceVehicleOption[];
  mode: DialogMode;
  isPending: boolean;
  hasEnded: boolean;
  error?: string[];
}

export function VehicleSelect({
  vehicleId,
  onValueChange,
  vehicles,
  mode,
  isPending,
  hasEnded,
  error,
}: VehicleSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="maintenance-vehicle">Véhicule</Label>
      <Select
        value={vehicleId}
        onValueChange={onValueChange}
        disabled={mode === "edit" || vehicles.length === 0 || isPending || hasEnded}
      >
        <SelectTrigger id="maintenance-vehicle" className="w-full">
          <SelectValue placeholder="Sélectionner un véhicule" />
        </SelectTrigger>
        <SelectContent>
          {vehicles.map((vehicle) => (
            <SelectItem key={vehicle.id} value={vehicle.id}>
              {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
              {vehicle.activeMaintenances > 0
                ? ` • ${vehicle.activeMaintenances} maintenance(s)`
                : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-red-500">{error[0]}</p>}
    </div>
  );
}

