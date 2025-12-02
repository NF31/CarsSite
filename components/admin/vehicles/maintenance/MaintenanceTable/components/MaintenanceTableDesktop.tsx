import { CalendarDays, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { MaintenanceType } from "@prisma/client";
import type { MaintenanceRecord } from "@/actions/admin/vehicles/get-maintenance";
import { STATUS_LABELS, STATUS_CLASSES, TYPE_LABELS, CURRENCY_FORMATTER } from "../constants";
import { cn } from "@/lib/utils";
import { ActionButtons } from "./ActionButtons";
import type { MaintenanceTableProps } from "../types";

interface MaintenanceTableDesktopProps {
  maintenances: MaintenanceRecord[];
  onEdit: MaintenanceTableProps["onEdit"];
  onViewDetails: MaintenanceTableProps["onViewDetails"];
  onStatusChange: MaintenanceTableProps["onStatusChange"];
  onRequestCancel: MaintenanceTableProps["onRequestCancel"];
  isLoading?: boolean;
  actionLoadingId?: string | null;
}

export function MaintenanceTableDesktop({
  maintenances,
  onEdit,
  onViewDetails,
  onStatusChange,
  onRequestCancel,
  isLoading,
  actionLoadingId,
}: MaintenanceTableDesktopProps) {
  return (
    <div className="hidden xl:block">
      <div className="rounded-lg border border-gray-200 shadow-sm bg-white">
        <table className="w-full table-auto table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-[28%] px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Véhicule
              </th>
              <th className="w-[12%] px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Type
              </th>
              <th className="w-[12%] px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Statut
              </th>
              <th className="w-[16%] px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Durée
              </th>
              <th className="w-[12%] px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Coût
              </th>
              <th className="w-[20%] min-w-[220px] px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {maintenances.map((maintenance) => {
              const start = new Date(maintenance.startDate);
              const end = new Date(maintenance.endDate);
              const isBlocked = maintenance.type === MaintenanceType.BLOCKED;

              return (
                <tr key={maintenance.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">
                          {maintenance.vehicle.brand} {maintenance.vehicle.model}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {maintenance.vehicle.licensePlate}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {format(start, "dd MMM yyyy HH:mm", { locale: fr })} →{" "}
                        {format(end, "dd MMM yyyy HH:mm", { locale: fr })}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {maintenance.durationHours} heure{maintenance.durationHours > 1 ? "s" : ""}
                        {maintenance.isOverdue && (
                          <span className="text-amber-600 font-semibold ml-2">En retard</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      className={cn(
                        "text-xs font-medium",
                        isBlocked
                          ? "bg-slate-200 text-slate-700 border-slate-300"
                          : "bg-primary/10 text-primary border-primary/30"
                      )}
                    >
                      {TYPE_LABELS[maintenance.type]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={cn("text-xs", STATUS_CLASSES[maintenance.status])}>
                      {STATUS_LABELS[maintenance.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{maintenance.durationHours} h</div>
                    <div className="text-xs text-muted-foreground">
                      Créée le {format(new Date(maintenance.createdAt), "dd MMM yyyy", { locale: fr })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {CURRENCY_FORMATTER.format(maintenance.cost)}
                    </div>
                    {maintenance.notes && (
                      <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {maintenance.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ActionButtons
                      maintenance={maintenance}
                      onEdit={onEdit}
                      onViewDetails={onViewDetails}
                      onStatusChange={onStatusChange}
                      onRequestCancel={onRequestCancel}
                      isLoading={isLoading}
                      actionLoadingId={actionLoadingId}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

