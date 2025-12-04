import { Send, RotateCcw, CheckCircle2, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaintenanceStatus } from "@/lib/types/maintenance-status";
import { MaintenanceType } from "@/lib/types/maintenance-type";
import type { MaintenanceRecord } from "@/actions/admin/vehicles/get-maintenance";
import { cn } from "@/lib/utils";
import { getMaintenancePermissions } from "../utils";

interface ActionButtonsProps {
  maintenance: MaintenanceRecord;
  onEdit: (maintenance: MaintenanceRecord) => void;
  onViewDetails: (maintenance: MaintenanceRecord) => void;
  onStatusChange: (maintenance: MaintenanceRecord, status: MaintenanceStatus) => void;
  onRequestCancel: (maintenance: MaintenanceRecord) => void;
  isLoading?: boolean;
  actionLoadingId?: string | null;
  compact?: boolean;
}

export function ActionButtons({
  maintenance,
  onEdit,
  onViewDetails,
  onStatusChange,
  onRequestCancel,
  isLoading,
  actionLoadingId,
  compact = false,
}: ActionButtonsProps) {
  const isActionLoading = actionLoadingId === maintenance.id;
  const disabled = isActionLoading || isLoading;
  const permissions = getMaintenancePermissions(maintenance);
  const isBlocked = maintenance.type === MaintenanceType.BLOCKED;

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
          disabled={disabled || !permissions.canStart}
          onClick={() => onStatusChange(maintenance, MaintenanceStatus.IN_PROGRESS)}
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
          disabled={disabled || !permissions.canReplan}
          onClick={() => onStatusChange(maintenance, MaintenanceStatus.SCHEDULED)}
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
          disabled={disabled || !permissions.canComplete}
          onClick={() => onStatusChange(maintenance, MaintenanceStatus.COMPLETED)}
          className="h-8"
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          Terminer
        </Button>
      )}
      {permissions.canCancel && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !permissions.canCancel}
          onClick={() => onRequestCancel(maintenance)}
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
        disabled={isLoading || !permissions.canEdit}
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
}

