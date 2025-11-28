import { memo } from "react";
import { AlertTriangle, Plus, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MaintenanceHeaderProps {
  vehiclesError?: string;
  isPending: boolean;
  hasVehicles: boolean;
  onRefresh: () => void;
  onCreate: () => void;
}

export const MaintenanceHeader = memo(function MaintenanceHeader({
  vehiclesError,
  isPending,
  hasVehicles,
  onRefresh,
  onCreate,
}: MaintenanceHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Maintenance des véhicules</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Planifiez, suivez et clôturez les interventions de maintenance de votre flotte.
        </p>
        {vehiclesError && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            {vehiclesError}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={onRefresh}>
          <RefreshCcw className={cn("h-4 w-4 mr-2", isPending && "animate-spin")} />
          Rafraîchir
        </Button>
        <Button type="button" onClick={onCreate} disabled={!hasVehicles}>
          <Plus className="h-4 w-4 mr-2" />
          Planifier une maintenance
        </Button>
      </div>
    </div>
  );
});

