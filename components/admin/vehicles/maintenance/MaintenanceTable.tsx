"use client";

import type { MaintenanceTableProps } from "./MaintenanceTable/types";
import {
  LoadingState,
  EmptyState,
  MaintenanceCard,
  MaintenanceTableDesktop,
} from "./MaintenanceTable/components";

export function MaintenanceTable({
  maintenances,
  onEdit,
  onViewDetails,
  onStatusChange,
  onRequestCancel,
  isLoading,
  actionLoadingId,
}: MaintenanceTableProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (!maintenances || maintenances.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4 w-full">
      {/* Vue mobile / tablette */}
      <div className="grid gap-4 xl:hidden">
        {maintenances.map((maintenance) => (
          <MaintenanceCard
            key={maintenance.id}
            maintenance={maintenance}
            onEdit={onEdit}
            onViewDetails={onViewDetails}
            onStatusChange={onStatusChange}
            onRequestCancel={onRequestCancel}
            isLoading={isLoading}
            actionLoadingId={actionLoadingId}
          />
        ))}
      </div>

      {/* Vue bureau */}
      <MaintenanceTableDesktop
        maintenances={maintenances}
        onEdit={onEdit}
        onViewDetails={onViewDetails}
        onStatusChange={onStatusChange}
        onRequestCancel={onRequestCancel}
        isLoading={isLoading}
        actionLoadingId={actionLoadingId}
      />
    </div>
  );
}

// Ré-exporter MaintenanceCancelDialog pour compatibilité
export { MaintenanceCancelDialog } from "./MaintenanceTable/components";
