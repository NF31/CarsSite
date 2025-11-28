import { format } from "date-fns";
import type { EventInput } from "@fullcalendar/core";

export function createCalendarEvents(availability: any, mergedBlocks: any[], otherMaintenances: any[]): EventInput[] {
  if (!availability) return [];

  return [
    // Réservations
    ...availability.bookings.map((booking: any) => {
      let backgroundColor = "#dc2626";
      let borderColor = "#b91c1c";
      let className = "booking-event";
      
      if (booking.status === "CONFIRMED") {
        backgroundColor = "#dbeafe";
        borderColor = "#3b82f6";
        className += " status-confirmed";
      } else if (booking.status === "COMPLETED") {
        backgroundColor = "#34d399";
        borderColor = "#10b981";
        className += " status-completed";
      } else if (booking.status === "CANCELLED") {
        backgroundColor = "#ef4444";
        borderColor = "#dc2626";
        className += " status-cancelled";
      } else if (booking.status === "PENDING") {
        backgroundColor = "#f59e0b";
        borderColor = "#d97706";
        className += " status-pending";
      }
      
      return {
        id: `booking-${booking.id}`,
        title: `Réservation ${booking.reference}`,
        start: new Date(booking.startDate),
        end: new Date(booking.endDate),
        backgroundColor,
        borderColor,
        className,
        allDay: false,
        extendedProps: {
          type: "BOOKING",
          id: booking.id,
          reference: booking.reference,
          status: booking.status,
        },
      };
    }),
    // Blocages fusionnés
    ...mergedBlocks.map((mergedBlock) => {
      const blockCount = mergedBlock.blocks.length;
      const start = mergedBlock.startDate;
      const end = mergedBlock.endDate;
      
      let title = blockCount === 1 
        ? "Dates bloquées" 
        : `Dates bloquées (${blockCount} blocages)`;
      
      const hasSpecificHours = 
        start.getHours() !== 0 || start.getMinutes() !== 0 ||
        end.getHours() !== 23 || end.getMinutes() !== 59;
      
      if (hasSpecificHours) {
        title = blockCount === 1
          ? `Bloqué ${format(start, "HH:mm")} - ${format(end, "HH:mm")}`
          : `Bloqué ${format(start, "HH:mm")} - ${format(end, "HH:mm")} (${blockCount} blocages)`;
      }
      
      return {
        id: `merged-blocks-${mergedBlock.allIds.join("-")}`,
        title,
        start,
        end,
        backgroundColor: "#6b7280",
        borderColor: "#4b5563",
        className: "booking-event status-blocked",
        allDay: false,
        extendedProps: {
          type: "MERGED_BLOCKS",
          blockIds: mergedBlock.allIds,
          blocks: mergedBlock.blocks.map((block: any) => ({
            id: block.id,
            startDate: block.startDate,
            endDate: block.endDate,
            description: block.description,
          })),
          count: blockCount,
        },
      };
    }),
    // Autres maintenances
    ...otherMaintenances.map((maintenance: any) => {
      return {
        id: `maintenance-${maintenance.id}`,
        title: `Maintenance - ${maintenance.type}`,
        start: new Date(maintenance.startDate),
        end: new Date(maintenance.endDate),
        backgroundColor: "#f59e0b",
        borderColor: "#d97706",
        className: "booking-event status-pending",
        allDay: false,
        extendedProps: {
          type: "MAINTENANCE",
          id: maintenance.id,
          status: maintenance.status,
          maintenanceType: maintenance.type,
          description: maintenance.description,
        },
      };
    }),
  ];
}

