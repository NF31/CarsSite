import type { Session } from "next-auth";
import type { AdminNotificationData, BookingNotificationItem } from "@/lib/admin/notifications";

export interface AdminNavbarProps {
  session: Session;
  bookingNotifications?: AdminNotificationData;
}

export type NavbarNotificationItem = BookingNotificationItem & {
  type?: "creation" | "modification" | "cancellation" | "payment" | "modificationPayment";
  cancellationReason?: string | null;
  cancellationRequestedAt?: string | null;
  cancellationRefundRate?: number | null;
  depositPaid?: number;
};

