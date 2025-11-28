import { memo } from "react";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MaintenanceStatus } from "@prisma/client";
import type { MaintenanceRecord } from "@/actions/admin/vehicles/get-maintenance";

const statusLabels: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.SCHEDULED]: "Planifiée",
  [MaintenanceStatus.IN_PROGRESS]: "En cours",
  [MaintenanceStatus.COMPLETED]: "Terminée",
  [MaintenanceStatus.CANCELLED]: "Annulée",
};

interface MaintenanceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance: MaintenanceRecord | null;
}

export const MaintenanceDetailsDialog = memo(function MaintenanceDetailsDialog({
  open,
  onOpenChange,
  maintenance,
}: MaintenanceDetailsDialogProps) {
  if (!maintenance) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Détails de la maintenance</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="space-y-1">
            <p className="font-semibold text-gray-900">
              {maintenance.vehicle.brand} {maintenance.vehicle.model}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{maintenance.vehicle.licensePlate}</Badge>
              <Badge variant="outline">Statut : {statusLabels[maintenance.status]}</Badge>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground">Horaires</p>
            <p className="font-medium text-gray-900">
              {format(new Date(maintenance.startDate), "dd MMM yyyy HH:mm", {
                locale: fr,
              })}{" "}
              →{" "}
              {format(new Date(maintenance.endDate), "dd MMM yyyy HH:mm", {
                locale: fr,
              })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Description</p>
            <p className="text-gray-800 whitespace-pre-wrap">
              {maintenance.description ?? "Aucune description"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Notes internes</p>
            <p className="text-gray-800 whitespace-pre-wrap">
              {maintenance.notes ?? "Pas de notes"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Créé le{" "}
            {format(new Date(maintenance.createdAt), "dd MMM yyyy HH:mm", {
              locale: fr,
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

