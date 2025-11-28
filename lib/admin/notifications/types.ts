export type BookingNotificationType = "creation" | "modification" | "cancellation" | "payment" | "modificationPayment";

export interface BookingNotificationItem {
  id: string;
  reference: string;
  startDate: string;
  endDate: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
  vehicleLabel: string;
  vehiclePlate?: string | null;
  type: BookingNotificationType;
  cancellationReason?: string | null;
  cancellationRequestedAt?: string | null;
  cancellationRefundRate?: number | null;
  depositPaid?: number;
  requiresAction?: boolean;
}

export interface AdminNotificationData {
  totalPending: number;
  items: BookingNotificationItem[];
}

