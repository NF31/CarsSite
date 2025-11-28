"use client";

import { useRef, useMemo, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Card, CardContent } from "@/components/ui/card";
import type { EventInput } from "@fullcalendar/core";
import frLocale from "@fullcalendar/core/locales/fr";
import "@/app/calendar.css";
import { useAvailabilityData, useCalendarDialogs, useDayBackgrounds, useCalendarHandlers } from "./availability-calendar/hooks";
import { mergeOverlappingBlocks, createCalendarEvents } from "./availability-calendar/utils";
import {
  CalendarLoadingState,
  CalendarErrorState,
  CalendarHeader,
  BookingsList,
  MaintenancesList,
} from "./availability-calendar/components";

interface AvailabilityCalendarProps {
  vehicleId: string;
}

export function AvailabilityCalendar({ vehicleId }: AvailabilityCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  
  const {
    availability,
    isLoading,
    error,
    currentViewStart,
    currentViewEnd,
    setCurrentViewStart,
    setCurrentViewEnd,
    refreshAvailability,
    isRefreshingRef,
    lastDatesRef,
  } = useAvailabilityData(vehicleId);

  const {
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
  } = useCalendarDialogs();

  const activeBlocks = useMemo(
    () =>
      availability?.maintenances
        ? (availability.maintenances as Array<{
            id: string;
            type: string;
            status: string;
            startDate: Date | string;
            endDate: Date | string;
            description?: string | null;
          }>).filter(
            (maintenance) =>
              maintenance.type === "BLOCKED" && maintenance.status !== "CANCELLED"
          )
        : [],
    [availability]
  );

  const { merged: mergedBlocks, others: otherMaintenances } = availability
    ? mergeOverlappingBlocks(availability.maintenances)
    : { merged: [], others: [] };

  const events: EventInput[] = useMemo(
    () => createCalendarEvents(availability, mergedBlocks, otherMaintenances),
    [availability, mergedBlocks, otherMaintenances]
  );

  useDayBackgrounds({ events, availability, calendarRef });

  const {
    handleDateSelect,
    handleEventClick,
    handleUnblockConfirm,
    handleEditSuccess,
    handleDatesSet,
  } = useCalendarHandlers({
    openBlockDialog,
    openUnblockDialog,
    openEventDetailsDialog,
    openEditDialog,
    setSelectedMaintenance,
    refreshAvailability,
    currentViewStart,
    currentViewEnd,
  });

  const handleBlockSuccess = useCallback(() => {
    closeBlockDialog();
    if (currentViewStart && currentViewEnd) {
      refreshAvailability(currentViewStart, currentViewEnd);
    }
  }, [closeBlockDialog, currentViewStart, currentViewEnd, refreshAvailability]);

  const handleUnblockConfirmWrapper = useCallback(async () => {
    if (!selectedMaintenance) return;
    await handleUnblockConfirm(selectedMaintenance.id);
    closeUnblockDialog();
  }, [selectedMaintenance, handleUnblockConfirm, closeUnblockDialog]);

  const handleEditSuccessWrapper = useCallback(async () => {
    closeEditDialog();
    await handleEditSuccess();
  }, [closeEditDialog, handleEditSuccess]);

  const handleEditBlock = useCallback((blockId: string, startDate: Date, endDate: Date, reason?: string | null) => {
    const maintenance = (availability?.maintenances as Array<{ id: string }> | undefined)?.find((m) => m.id === blockId);
    if (maintenance) {
      setSelectedMaintenance({
        id: (maintenance as { id: string }).id,
        startDate,
        endDate,
        reason: reason || null,
      });
      openEditDialog();
    }
  }, [availability, setSelectedMaintenance, openEditDialog]);

  const handleDatesSetWrapper = useCallback((arg: { start: Date; end: Date }) => {
    handleDatesSet(arg, isRefreshingRef, lastDatesRef, setCurrentViewStart, setCurrentViewEnd, refreshAvailability);
  }, [handleDatesSet, isRefreshingRef, lastDatesRef, setCurrentViewStart, setCurrentViewEnd, refreshAvailability]);

  if (isLoading) {
    return <CalendarLoadingState />;
  }

  if (error) {
    return <CalendarErrorState error={error} />;
  }

  return (
    <Card>
      <CalendarHeader
        vehicleId={vehicleId}
        availability={availability}
        selectedDates={selectedDates}
        isBlockDialogOpen={isBlockDialogOpen}
        onBlockDialogChange={(open) => {
          if (!open) {
            closeBlockDialog();
          }
        }}
        onBlockSuccess={handleBlockSuccess}
        selectedMaintenance={selectedMaintenance}
        isUnblockDialogOpen={isUnblockDialogOpen}
        onUnblockDialogChange={(open) => {
          if (!open) {
            closeUnblockDialog();
          }
        }}
        onUnblockConfirm={handleUnblockConfirmWrapper}
        onEditClick={openEditDialog}
        isEditDialogOpen={isEditDialogOpen}
        onEditDialogChange={(open) => {
          if (!open) {
            closeEditDialog();
          }
        }}
        onEditSuccess={handleEditSuccessWrapper}
        selectedEvent={selectedEvent}
        isEventDetailsDialogOpen={isEventDetailsDialogOpen}
        onEventDetailsDialogChange={(open) => {
          if (!open) {
            closeEventDetailsDialog();
          }
        }}
        onEditBlock={handleEditBlock}
        activeBlocks={activeBlocks}
        onUnblock={openUnblockDialog}
      />
      <CardContent>
        <div className="fullcalendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            locale={frLocale}
            firstDay={1}
            selectable={true}
            selectMirror={true}
            selectOverlap={false}
            selectConstraint={{
              start: new Date().toISOString().split('T')[0],
            }}
            views={{
              timeGridWeek: {
                selectable: true,
                selectMirror: true,
              },
              timeGridDay: {
                selectable: true,
                selectMirror: true,
              },
              dayGridMonth: {
                selectable: true,
                selectMirror: true,
              },
            }}
            dayMaxEvents={true}
            weekends={true}
            events={events}
            select={handleDateSelect}
            eventClick={handleEventClick}
            datesSet={handleDatesSetWrapper}
            height="auto"
            eventDisplay="block"
            allDaySlot={true}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            buttonText={{
              today: "Aujourd'hui",
              month: "Mois",
              week: "Semaine",
              day: "Jour",
            }}
          />
        </div>

        <BookingsList bookings={availability?.bookings || []} />
        <MaintenancesList maintenances={availability?.maintenances || []} />
      </CardContent>
    </Card>
  );
}
