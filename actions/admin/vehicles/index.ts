export { getVehiclesAction, type GetVehiclesFilters, type GetVehiclesResult } from "./actions";
export { getLocationsAction } from "./get-locations";
export { getBrandsAction } from "./get-brands";
export { createVehicleAction, type CreateVehicleResult } from "./create";
export { updateVehicleAction, type UpdateVehicleResult } from "./update";
export { getVehicleByIdAction, type GetVehicleByIdResult } from "./get-by-id";
export { uploadImageAction, type UploadImageResult } from "./upload-image";
export { deleteImageAction, deleteImagesAction, deleteImageByPublicIdAction, cleanupEmptyFolder, extractPublicIdFromUrl, type DeleteImageResult } from "./delete-image";
export { moveImageAction, moveImagesAction, type MoveImageResult } from "./move-images";
export { deleteVehicleAction, type DeleteVehicleResult } from "./delete-vehicle";
export { getVehicleAvailabilityAction, type GetVehicleAvailabilityResult, type VehicleAvailabilityItem, type VehicleAvailabilityData, type VehicleMaintenance } from "./get-availability";
export { blockVehicleDatesAction, unblockVehicleDatesAction, updateBlockedDatesAction, type BlockDatesResult } from "./block-dates";
export {
  getMaintenanceDashboardAction,
  type GetMaintenanceFilters,
  type GetMaintenanceDashboardResult,
  type MaintenanceSummary,
} from "./get-maintenance";
export {
  serializeMaintenanceRecord,
  type MaintenanceRecord,
  type MaintenanceVehicleInfo,
} from "@/lib/maintenance/serialization";
export { getMaintenanceVehicleOptionsAction, type GetMaintenanceVehicleOptionsResult, type MaintenanceVehicleOption } from "./get-maintenance-vehicles";
export { createMaintenanceAction, type CreateMaintenanceResult } from "./create-maintenance";
export { updateMaintenanceAction, type UpdateMaintenanceResult } from "./update-maintenance";

