import { useState, useCallback } from "react";
import type { EventDetails } from "@/components/admin/vehicles/EventDetailsDialog";

export function useCalendarDialogs() {
  const [selectedDates, setSelectedDates] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isUnblockDialogOpen, setIsUnblockDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEventDetailsDialogOpen, setIsEventDetailsDialogOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<{
    id: string;
    startDate: Date;
    endDate: Date;
    reason?: string | null;
  } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<{
    title: string;
    startDate: Date;
    endDate: Date;
    type: "BOOKING" | "MAINTENANCE" | "MERGED_BLOCKS";
    details?: EventDetails;
  } | null>(null);

  const openBlockDialog = useCallback((start: Date, end: Date) => {
    setSelectedDates({ start, end });
    setIsBlockDialogOpen(true);
  }, []);

  const closeBlockDialog = useCallback(() => {
    setIsBlockDialogOpen(false);
    setSelectedDates({ start: null, end: null });
  }, []);

  const openUnblockDialog = useCallback((maintenance: {
    id: string;
    startDate: Date;
    endDate: Date;
    reason?: string | null;
  }) => {
    setSelectedMaintenance(maintenance);
    setIsUnblockDialogOpen(true);
  }, []);

  const closeUnblockDialog = useCallback(() => {
    setIsUnblockDialogOpen(false);
    setSelectedMaintenance(null);
  }, []);

  const openEditDialog = useCallback(() => {
    setIsEditDialogOpen(true);
  }, []);

  const closeEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
  }, []);

  const openEventDetailsDialog = useCallback((event: {
    title: string;
    startDate: Date;
    endDate: Date;
    type: "BOOKING" | "MAINTENANCE" | "MERGED_BLOCKS";
    details?: EventDetails;
  }) => {
    setSelectedEvent(event);
    setIsEventDetailsDialogOpen(true);
  }, []);

  const closeEventDetailsDialog = useCallback(() => {
    setIsEventDetailsDialogOpen(false);
    setSelectedEvent(null);
  }, []);

  return {
    selectedDates,
    isBlockDialogOpen,
    isUnblockDialogOpen,
    isEditDialogOpen,
    isEventDetailsDialogOpen,
    selectedMaintenance,
    selectedEvent,
    openBlockDialog,
    closeBlockDialog,
    openUnblockDialog,
    closeUnblockDialog,
    openEditDialog,
    closeEditDialog,
    openEventDetailsDialog,
    closeEventDetailsDialog,
    setSelectedMaintenance,
  };
}

