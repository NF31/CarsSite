import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { MaintenanceRecord } from "@/actions/admin/vehicles/get-maintenance";
import { STATUS_LABELS, STATUS_CLASSES, TYPE_LABELS, CURRENCY_FORMATTER } from "../constants";
import { cn } from "@/lib/utils";
import { ActionButtons } from "./ActionButtons";
import type { MaintenanceTableProps } from "../types";

interface MaintenanceCardProps {
  maintenance: MaintenanceRecord;
  onEdit: MaintenanceTableProps["onEdit"];
  onViewDetails: MaintenanceTableProps["onViewDetails"];
  onStatusChange: MaintenanceTableProps["onStatusChange"];
  onRequestCancel: MaintenanceTableProps["onRequestCancel"];
  isLoading?: boolean;
  actionLoadingId?: string | null;
}

export function MaintenanceCard({
  maintenance,
  onEdit,
  onViewDetails,
  onStatusChange,
  onRequestCancel,
  isLoading,
  actionLoadingId,
}: MaintenanceCardProps) {
  const start = new Date(maintenance.startDate);
  const end = new Date(maintenance.endDate);

  return (
    <Card className="border border-gray-200 shadow-sm bg-white p-4 space-y-3 w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">
              {maintenance.vehicle.brand} {maintenance.vehicle.model}
            </h3>
            <Badge variant="outline" className="text-[10px]">
              {maintenance.vehicle.licensePlate}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Durée : {maintenance.durationHours} heure{maintenance.durationHours > 1 ? "s" : ""}
          </p>
        </div>
        <Badge className={cn("text-xs", STATUS_CLASSES[maintenance.status])}>
          {STATUS_LABELS[maintenance.status]}
        </Badge>
      </div>

      <div className="space-y-1 text-sm text-gray-700">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          {format(start, "dd MMM yyyy HH:mm", { locale: fr })} →{" "}
          {format(end, "dd MMM yyyy HH:mm", { locale: fr })}
        </div>
        <div>
          <span className="font-medium">Type :</span> {TYPE_LABELS[maintenance.type]}
        </div>
        <div>
          <span className="font-medium">Coût :</span> {CURRENCY_FORMATTER.format(maintenance.cost)}
        </div>
        {maintenance.isOverdue && (
          <div className="text-xs font-semibold text-amber-600">Maintenance en retard</div>
        )}
        {maintenance.notes && (
          <div className="text-xs text-muted-foreground">Notes : {maintenance.notes}</div>
        )}
      </div>

      <ActionButtons
        maintenance={maintenance}
        onEdit={onEdit}
        onViewDetails={onViewDetails}
        onStatusChange={onStatusChange}
        onRequestCancel={onRequestCancel}
        isLoading={isLoading}
        actionLoadingId={actionLoadingId}
        compact
      />
    </Card>
  );
}

