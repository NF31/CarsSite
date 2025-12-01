"use client";

import { DeleteVehicleDialog } from "../DeleteVehicleDialog";
import type { VehiclesListViewProps } from "./types";
import { useDeleteDialog } from "./hooks/use-delete-dialog";
import { EmptyState } from "./components/empty-state";
import { VehicleCard } from "./components/vehicle-card";
import { VehicleTableCompact } from "./components/vehicle-table-compact";
import { VehicleTableFull } from "./components/vehicle-table-full";

export function VehiclesListView({ vehicles, startIndex = 0 }: VehiclesListViewProps) {
  const { deleteDialogOpen, vehicleToDelete, handleDeleteClick, handleClose, setDeleteDialogOpen } =
    useDeleteDialog();

  if (vehicles.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      {/* Vue mobile : cartes détaillées */}
      <div className="block lg:hidden space-y-4">
        {vehicles.map((vehicle, index) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            index={index}
            startIndex={startIndex}
            onDeleteClick={handleDeleteClick}
          />
        ))}
      </div>

      {/* Vue tablette : tableau compact */}
      <VehicleTableCompact vehicles={vehicles} startIndex={startIndex} onDeleteClick={handleDeleteClick} />

      {/* Vue desktop large : tableau complet */}
      <VehicleTableFull vehicles={vehicles} startIndex={startIndex} onDeleteClick={handleDeleteClick} />

      {vehicleToDelete && (
        <DeleteVehicleDialog
          vehicle={vehicleToDelete}
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) {
              handleClose();
            }
          }}
        />
      )}
    </>
  );
}

