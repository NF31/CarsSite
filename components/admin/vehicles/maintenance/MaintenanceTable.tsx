"use client";

import type { MaintenanceRecord } from "@/actions/admin/vehicles/get-maintenance";
import { MaintenanceStatus, MaintenanceType } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CalendarDays,
  Clock,
  ClipboardList,
  Send,
  CheckCircle2,
  RotateCcw,
  Eye,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MaintenanceTableProps {
  maintenances: MaintenanceRecord[];
  onEdit: (maintenance: MaintenanceRecord) => void;
  onViewDetails: (maintenance: MaintenanceRecord) => void;
  onStatusChange: (maintenance: MaintenanceRecord, status: MaintenanceStatus) => void;
  isLoading?: boolean;
  actionLoadingId?: string | null;
}

const statusLabels: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.SCHEDULED]: "Planifiée",
  [MaintenanceStatus.IN_PROGRESS]: "En cours",
  [MaintenanceStatus.COMPLETED]: "Terminée",
  [MaintenanceStatus.CANCELLED]: "Annulée",
};

const statusClasses: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.SCHEDULED]: "bg-amber-100 text-amber-800 border-amber-200",
  [MaintenanceStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800 border-blue-200",
  [MaintenanceStatus.COMPLETED]: "bg-emerald-100 text-emerald-700 border-emerald-200",
  [MaintenanceStatus.CANCELLED]: "bg-gray-200 text-gray-600 border-gray-300",
};

const typeLabels: Record<MaintenanceType, string> = {
  [MaintenanceType.SERVICE]: "Entretien",
  [MaintenanceType.REPAIR]: "Réparation",
  [MaintenanceType.INSPECTION]: "Inspection",
  [MaintenanceType.BLOCKED]: "Blocage",
};

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function MaintenanceTable({
  maintenances,
  onEdit,
  onViewDetails,
  onStatusChange,
  isLoading,
  actionLoadingId,
}: MaintenanceTableProps) {
  const renderActionButtons = (maintenance: MaintenanceRecord, compact = false) => {
    const isActionLoading = actionLoadingId === maintenance.id;
    const disabled = isActionLoading || isLoading;
    const isBlocked = maintenance.type === MaintenanceType.BLOCKED;
    const now = new Date();
    const start = new Date(maintenance.startDate);
    const end = new Date(maintenance.endDate);
    const periodEnded = end < now;
    const periodStarted = start <= now;

    const canStart =
      maintenance.status === MaintenanceStatus.SCHEDULED &&
      !isBlocked &&
      periodStarted &&
      !periodEnded;
    const canReplan =
      maintenance.status === MaintenanceStatus.CANCELLED && !periodEnded;
    const canComplete =
      maintenance.status === MaintenanceStatus.IN_PROGRESS && !periodEnded;
    const canCancel =
      maintenance.status !== MaintenanceStatus.COMPLETED &&
      maintenance.status !== MaintenanceStatus.CANCELLED &&
      !periodEnded;
    const canEdit = !periodEnded;

    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          compact && "justify-start"
        )}
      >
        {maintenance.status === MaintenanceStatus.SCHEDULED && !isBlocked && (
          <Button
            type="button"
            size="sm"
            variant="default"
            disabled={disabled || !canStart}
            onClick={() =>
              onStatusChange(maintenance, MaintenanceStatus.IN_PROGRESS)
            }
            className="h-8"
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            Démarrer
          </Button>
        )}
        {maintenance.status === MaintenanceStatus.CANCELLED && (
          <Button
            type="button"
            size="sm"
            variant="default"
            disabled={disabled || !canReplan}
            onClick={() =>
              onStatusChange(maintenance, MaintenanceStatus.SCHEDULED)
            }
            className="h-8"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Replanifier
          </Button>
        )}
        {maintenance.status === MaintenanceStatus.IN_PROGRESS && (
          <Button
            type="button"
            size="sm"
            variant="default"
            disabled={disabled || !canComplete}
            onClick={() =>
              onStatusChange(maintenance, MaintenanceStatus.COMPLETED)
            }
            className="h-8"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Terminer
          </Button>
        )}
        {canCancel && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || !canCancel}
            onClick={() =>
              onStatusChange(maintenance, MaintenanceStatus.CANCELLED)
            }
            className="h-8"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Annuler
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onEdit(maintenance)}
          className="h-8"
          disabled={isLoading || !canEdit}
        >
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Modifier
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onViewDetails(maintenance)}
          className="h-8"
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          Détails
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <div className="p-10 flex flex-col gap-4">
          <div className="h-6 w-64 bg-muted animate-pulse rounded" />
          <div className="h-32 w-full bg-muted animate-pulse rounded" />
        </div>
      </Card>
    );
  }

  if (!maintenances || maintenances.length === 0) {
    return (
      <Card className="border border-dashed border-gray-200 shadow-none bg-white">
        <div className="p-10 flex flex-col items-center text-center gap-3 text-muted-foreground">
          <ClipboardList className="h-10 w-10" />
          <p className="font-semibold text-gray-900">
            Aucune maintenance trouvée avec les filtres actuels
          </p>
          <p className="text-sm">
            Ajustez vos filtres ou planifiez une nouvelle intervention pour un véhicule.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Vue mobile / tablette */}
      <div className="grid gap-4 xl:hidden">
        {maintenances.map((maintenance) => {
          const start = new Date(maintenance.startDate);
          const end = new Date(maintenance.endDate);

          return (
            <Card
              key={maintenance.id}
              className="border border-gray-200 shadow-sm bg-white p-4 space-y-3 w-full"
            >
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
                <Badge className={cn("text-xs", statusClasses[maintenance.status])}>
                  {statusLabels[maintenance.status]}
                </Badge>
              </div>

              <div className="space-y-1 text-sm text-gray-700">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {format(start, "dd MMM yyyy HH:mm", { locale: fr })} →{" "}
                  {format(end, "dd MMM yyyy HH:mm", { locale: fr })}
                </div>
                <div>
                  <span className="font-medium">Type :</span>{" "}
                  {typeLabels[maintenance.type]}
                </div>
                <div>
                  <span className="font-medium">Coût :</span>{" "}
                  {currencyFormatter.format(maintenance.cost)}
                </div>
                {maintenance.isOverdue && (
                  <div className="text-xs font-semibold text-amber-600">
                    Maintenance en retard
                  </div>
                )}
                {maintenance.notes && (
                  <div className="text-xs text-muted-foreground">
                    Notes : {maintenance.notes}
                  </div>
                )}
              </div>

              {renderActionButtons(maintenance, true)}
            </Card>
          );
        })}
      </div>

      {/* Vue bureau */}
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
                        <span className="text-amber-600 font-semibold ml-2">
                          En retard
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    className={cn(
                      "text-xs font-medium",
                      maintenance.type === MaintenanceType.BLOCKED
                        ? "bg-slate-200 text-slate-700 border-slate-300"
                        : "bg-primary/10 text-primary border-primary/30"
                    )}
                  >
                    {typeLabels[maintenance.type]}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={cn("text-xs", statusClasses[maintenance.status])}>
                    {statusLabels[maintenance.status]}
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
                    {currencyFormatter.format(maintenance.cost)}
                  </div>
                  {maintenance.notes && (
                    <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {maintenance.notes}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderActionButtons(maintenance)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
        </div>
      </div>
    </div>
  );
}

