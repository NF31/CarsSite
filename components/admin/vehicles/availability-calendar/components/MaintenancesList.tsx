import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface MaintenancesListProps {
  maintenances: Array<{
    id: string;
    type: string;
    status: string;
    startDate: Date | string;
    endDate: Date | string;
    description?: string | null;
  }>;
}

export const MaintenancesList = memo(function MaintenancesList({
  maintenances,
}: MaintenancesListProps) {
  if (!maintenances || maintenances.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-4 border-t">
      <h3 className="font-semibold mb-3">Maintenances programmées</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {maintenances.map((maintenance) => (
          <div key={maintenance.id} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Badge
                variant="outline"
                className={
                  maintenance.type === "BLOCKED"
                    ? "bg-gray-100 text-gray-700 border-gray-300"
                    : "bg-orange-50 text-orange-700 border-orange-200"
                }
              >
                {maintenance.type === "BLOCKED" ? "Bloqué" : maintenance.type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {maintenance.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(maintenance.startDate), "dd/MM/yyyy")} -{" "}
              {format(new Date(maintenance.endDate), "dd/MM/yyyy")}
            </p>
            {maintenance.description && (
              <p className="text-xs text-muted-foreground mt-1">{maintenance.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

