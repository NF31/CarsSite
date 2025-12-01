import { useState } from "react";
import type { AdminNotificationData } from "@/lib/admin/notifications";
import type { NavbarNotificationItem } from "../types";

export function useNotifications(bookingNotifications?: AdminNotificationData) {
  const [pendingBookings, setPendingBookings] = useState<NavbarNotificationItem[]>(
    (bookingNotifications?.items as NavbarNotificationItem[]) ?? []
  );

  const notificationCount = pendingBookings.length;
  const hiddenNotifications =
    Math.max(
      0,
      (bookingNotifications?.totalPending ?? 0) -
        pendingBookings.filter((item) => item.requiresAction !== false).length
    ) || 0;

  return {
    pendingBookings,
    setPendingBookings,
    notificationCount,
    hiddenNotifications,
  };
}

