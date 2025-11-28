"use server";

import type { AdminNotificationData } from "./types";
import {
  getRecentPaymentThreshold,
  getViewedNotifications,
  getViewedBookingIds,
  getBookingCounts,
  getNotificationBookings,
} from "./utils";
import { mapBookingToNotificationItem } from "./utils/transformers";

export async function getAdminNotificationData(
  adminId?: string
): Promise<AdminNotificationData> {
  const recentPaymentThreshold = getRecentPaymentThreshold();

  const viewedNotifications = await getViewedNotifications(adminId);
  const viewedBookingIds = getViewedBookingIds(viewedNotifications);

  const [[, totalNotifications], bookings] = await Promise.all([
    getBookingCounts(recentPaymentThreshold, viewedBookingIds),
    getNotificationBookings(recentPaymentThreshold, viewedBookingIds),
  ]);

  const items = bookings.map(mapBookingToNotificationItem);

  return {
    totalPending: totalNotifications,
    items,
  };
}

