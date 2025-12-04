import type { MaintenanceRecord } from "@/actions/admin/vehicles/get-maintenance";
import type { MaintenanceStatus } from "@/lib/types/maintenance-status";

export interface MaintenanceTableProps {
  maintenances: MaintenanceRecord[];
  onEdit: (maintenance: MaintenanceRecord) => void;
  onViewDetails: (maintenance: MaintenanceRecord) => void;
  onStatusChange: (maintenance: MaintenanceRecord, status: MaintenanceStatus) => void;
  onRequestCancel: (maintenance: MaintenanceRecord) => void;
  isLoading?: boolean;
  actionLoadingId?: string | null;
}

export interface MaintenanceCancelDialogProps {
  maintenance: MaintenanceRecord | null;
  onConfirm: () => void;
  onDismiss: () => void;
}

