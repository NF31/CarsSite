import { memo } from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { BlockDatesDialog } from "@/components/admin/vehicles/BlockDatesDialog";
import { UnblockDatesDialog } from "@/components/admin/vehicles/UnblockDatesDialog";
import { EditBlockedDatesDialog } from "@/components/admin/vehicles/EditBlockedDatesDialog";
import { EventDetailsDialog } from "@/components/admin/vehicles/EventDetailsDialog";
import { ActiveBlocksList } from "./ActiveBlocksList";
import { CalendarInstructions } from "./CalendarInstructions";

interface CalendarHeaderProps {
  vehicleId: string;
  availability: { vehicle?: { brand: string; model: string; licensePlate: string } } | null;
  selectedDates: { start: Date | null; end: Date | null };
  isBlockDialogOpen: boolean;
  onBlockDialogChange: (open: boolean) => void;
  onBlockSuccess: () => void;
  selectedMaintenance: {
    id: string;
    startDate: Date;
    endDate: Date;
    reason?: string | null;
  } | null;
  isUnblockDialogOpen: boolean;
  onUnblockDialogChange: (open: boolean) => void;
  onUnblockConfirm: () => void;
  onEditClick: () => void;
  isEditDialogOpen: boolean;
  onEditDialogChange: (open: boolean) => void;
  onEditSuccess: () => void;
  selectedEvent: {
    title: string;
    startDate: Date;
    endDate: Date;
    type: "BOOKING" | "MAINTENANCE" | "MERGED_BLOCKS";
    details?: Record<string, unknown>;
  } | null;
  isEventDetailsDialogOpen: boolean;
  onEventDetailsDialogChange: (open: boolean) => void;
  onEditBlock: (blockId: string, startDate: Date, endDate: Date, reason?: string | null) => void;
  activeBlocks: Array<{
    id: string;
    startDate: Date | string;
    endDate: Date | string;
    description?: string | null;
  }>;
  onUnblock: (block: {
    id: string;
    startDate: Date;
    endDate: Date;
    reason?: string | null;
  }) => void;
}

export const CalendarHeader = memo(function CalendarHeader({
  vehicleId,
  availability,
  selectedDates,
  isBlockDialogOpen,
  onBlockDialogChange,
  onBlockSuccess,
  selectedMaintenance,
  isUnblockDialogOpen,
  onUnblockDialogChange,
  onUnblockConfirm,
  onEditClick,
  isEditDialogOpen,
  onEditDialogChange,
  onEditSuccess,
  selectedEvent,
  isEventDetailsDialogOpen,
  onEventDetailsDialogChange,
  onEditBlock,
  activeBlocks,
  onUnblock,
}: CalendarHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Calendrier de disponibilité
          {availability?.vehicle && (
            <span className="text-base font-normal text-muted-foreground ml-2">
              - {availability.vehicle.brand} {availability.vehicle.model} ({availability.vehicle.licensePlate})
            </span>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <BlockDatesDialog
            vehicleId={vehicleId}
            selectedStartDate={selectedDates.start || undefined}
            selectedEndDate={selectedDates.end || undefined}
            open={isBlockDialogOpen}
            onOpenChange={onBlockDialogChange}
            onSuccess={onBlockSuccess}
          />
          
          {selectedMaintenance && (
            <>
              <UnblockDatesDialog
                open={isUnblockDialogOpen}
                onOpenChange={onUnblockDialogChange}
                maintenanceId={selectedMaintenance.id}
                startDate={selectedMaintenance.startDate}
                endDate={selectedMaintenance.endDate}
                reason={selectedMaintenance.reason}
                onConfirm={onUnblockConfirm}
                onEdit={onEditClick}
              />
              <EditBlockedDatesDialog
                open={isEditDialogOpen}
                onOpenChange={onEditDialogChange}
                maintenanceId={selectedMaintenance.id}
                currentStartDate={selectedMaintenance.startDate}
                currentEndDate={selectedMaintenance.endDate}
                currentReason={selectedMaintenance.reason}
                onSuccess={onEditSuccess}
              />
            </>
          )}
          
          {selectedEvent && (
            <EventDetailsDialog
              open={isEventDetailsDialogOpen}
              onOpenChange={onEventDetailsDialogChange}
              title={selectedEvent.title}
              startDate={selectedEvent.startDate}
              endDate={selectedEvent.endDate}
              type={selectedEvent.type}
              details={selectedEvent.details}
              onEditBlock={onEditBlock}
            />
          )}
        </div>
      </div>
      
      {/* Instructions et Légende */}
      <div className="mt-4 pt-4 border-t space-y-4">
        <ActiveBlocksList blocks={activeBlocks} onUnblock={onUnblock} />
        <CalendarInstructions />
      </div>
    </CardHeader>
  );
});

