import { useCallback } from "react";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { unblockVehicleDatesAction } from "@/actions/admin/vehicles";
import type { EventDetails } from "@/components/admin/vehicles/EventDetailsDialog";

// extendedProps posées par createCalendarEvents
type CalendarEventProps = EventDetails & { type?: string; id: string };

interface UseCalendarHandlersProps {
  openBlockDialog: (start: Date, end: Date) => void;
  openUnblockDialog: (maintenance: {
    id: string;
    startDate: Date;
    endDate: Date;
    reason?: string | null;
  }) => void;
  openEventDetailsDialog: (event: {
    title: string;
    startDate: Date;
    endDate: Date;
    type: "BOOKING" | "MAINTENANCE" | "MERGED_BLOCKS";
    details?: EventDetails;
  }) => void;
  openEditDialog: () => void;
  setSelectedMaintenance: (maintenance: {
    id: string;
    startDate: Date;
    endDate: Date;
    reason?: string | null;
  } | null) => void;
  refreshAvailability: (start: Date, end: Date) => Promise<void>;
  currentViewStart: Date | null;
  currentViewEnd: Date | null;
}

export function useCalendarHandlers({
  openBlockDialog,
  openUnblockDialog,
  openEventDetailsDialog,
  openEditDialog,
  setSelectedMaintenance,
  refreshAvailability,
  currentViewStart,
  currentViewEnd,
}: UseCalendarHandlersProps) {
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    const start = new Date(selectInfo.start);
    const end = new Date(selectInfo.end);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    
    if (start < today) {
      alert("Vous ne pouvez pas sélectionner des dates passées. Veuillez sélectionner une date à partir d'aujourd'hui.");
      selectInfo.view.calendar.unselect();
      return;
    }
    
    if (end.getTime() === start.getTime()) {
      end.setHours(23, 59, 59, 999);
    }
    
    openBlockDialog(start, end);
    selectInfo.view.calendar.unselect();
  }, [openBlockDialog]);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const extendedProps = event.extendedProps as CalendarEventProps;
    
    if (extendedProps.type === "MERGED_BLOCKS") {
      openEventDetailsDialog({
        title: `Dates bloquées (${extendedProps.count} blocages)`,
        startDate: new Date(event.start!),
        endDate: new Date(event.end!),
        type: "MERGED_BLOCKS",
        details: {
          ...extendedProps,
          blocks: extendedProps.blocks,
        },
      });
    } else if (extendedProps.type === "MAINTENANCE" && extendedProps.maintenanceType === "BLOCKED" && extendedProps.status !== "CANCELLED") {
      openUnblockDialog({
        id: extendedProps.id,
        startDate: new Date(event.start!),
        endDate: new Date(event.end!),
        reason: extendedProps.description || null,
      });
    } else {
      openEventDetailsDialog({
        title: event.title,
        startDate: new Date(event.start!),
        endDate: new Date(event.end!),
        type: extendedProps.type === "BOOKING" ? "BOOKING" : "MAINTENANCE",
        details: extendedProps,
      });
    }
  }, [openUnblockDialog, openEventDetailsDialog]);

  const handleUnblockConfirm = useCallback(async (maintenanceId: string) => {
    const result = await unblockVehicleDatesAction(maintenanceId);
    if (result.success) {
      if (currentViewStart && currentViewEnd) {
        await refreshAvailability(currentViewStart, currentViewEnd);
      }
      setSelectedMaintenance(null);
    } else {
      console.error(result.error || "Erreur lors du déblocage");
    }
  }, [refreshAvailability, currentViewStart, currentViewEnd, setSelectedMaintenance]);

  const handleEditSuccess = useCallback(async () => {
    if (currentViewStart && currentViewEnd) {
      await refreshAvailability(currentViewStart, currentViewEnd);
    }
  }, [refreshAvailability, currentViewStart, currentViewEnd]);

  const handleDatesSet = useCallback((arg: { start: Date; end: Date }, isRefreshingRef: React.MutableRefObject<boolean>, lastDatesRef: React.MutableRefObject<{ start: string | null; end: string | null }>, setCurrentViewStart: (date: Date) => void, setCurrentViewEnd: (date: Date) => void, refreshAvailability: (start: Date, end: Date) => Promise<void>) => {
    if (isRefreshingRef.current) return;
    
    const newStart = new Date(arg.start);
    const newEnd = new Date(arg.end);
    
    const normalizeDate = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().split('T')[0];
    };
    
    const newStartStr = normalizeDate(newStart);
    const newEndStr = normalizeDate(newEnd);
    
    if (lastDatesRef.current.start !== newStartStr || lastDatesRef.current.end !== newEndStr) {
      lastDatesRef.current.start = newStartStr;
      lastDatesRef.current.end = newEndStr;
      setCurrentViewStart(newStart);
      setCurrentViewEnd(newEnd);
      refreshAvailability(newStart, newEnd);
    }
  }, []);

  return {
    handleDateSelect,
    handleEventClick,
    handleUnblockConfirm,
    handleEditSuccess,
    handleDatesSet,
  };
}

