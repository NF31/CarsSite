import { useState } from "react";
import type { Vehicle } from "../types";

export function useDeleteDialog() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const handleDeleteClick = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  const handleClose = () => {
    setDeleteDialogOpen(false);
    setVehicleToDelete(null);
  };

  return {
    deleteDialogOpen,
    vehicleToDelete,
    handleDeleteClick,
    handleClose,
    setDeleteDialogOpen,
  };
}

