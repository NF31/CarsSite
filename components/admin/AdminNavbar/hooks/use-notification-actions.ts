import { useState, useTransition } from "react";
import { markNotificationAsViewedAction } from "@/actions/admin/notifications/mark-as-viewed";
import type { NavbarNotificationItem } from "../types";

export function useNotificationActions(
  setPendingBookings: React.Dispatch<React.SetStateAction<NavbarNotificationItem[]>>
) {
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [isMarkingAsViewed, startMarkAsViewed] = useTransition();

  const handleDismiss = (bookingId: string) => {
    setActiveBookingId(bookingId);
    startMarkAsViewed(async () => {
      const result = await markNotificationAsViewedAction(bookingId);
      if (result.success) {
        // Retirer de la liste affichée
        setPendingBookings((previous) => previous.filter((item) => item.id !== bookingId));
      } else {
        console.error("[Admin Navbar] Erreur lors du marquage de la notification comme vue:", result.error);
      }
      setActiveBookingId(null);
    });
  };

  const handleViewNotification = (bookingId: string) => {
    // Marquer automatiquement comme vue quand on clique sur "Voir"
    setActiveBookingId(bookingId);
    startMarkAsViewed(async () => {
      const result = await markNotificationAsViewedAction(bookingId);
      if (result.success) {
        // Retirer de la liste affichée
        setPendingBookings((previous) => previous.filter((item) => item.id !== bookingId));
      } else {
        console.error("[Admin Navbar] Erreur lors du marquage de la notification comme vue:", result.error);
      }
      setActiveBookingId(null);
    });
  };

  return {
    activeBookingId,
    isMarkingAsViewed,
    handleDismiss,
    handleViewNotification,
  };
}

