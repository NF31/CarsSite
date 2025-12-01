"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import { NotificationItem } from "./notification-item";
import type { NavbarNotificationItem } from "../types";

type NotificationsDropdownProps = {
  notificationCount: number;
  hiddenNotifications: number;
  pendingBookings: NavbarNotificationItem[];
  isModerating: boolean;
  isMarkingAsViewed: boolean;
  activeBookingId: string | null;
  actionError: string | null;
  onModeration: (bookingId: string, action: "approve" | "reject", bookingType?: string) => void;
  onDismiss: (bookingId: string) => void;
  onView: (bookingId: string) => void;
};

export function NotificationsDropdown({
  notificationCount,
  hiddenNotifications,
  pendingBookings,
  isModerating,
  isMarkingAsViewed,
  activeBookingId,
  actionError,
  onModeration,
  onDismiss,
  onView,
}: NotificationsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] sm:h-5 sm:min-w-5 sm:px-1.5 sm:text-xs"
            >
              {notificationCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notificationCount === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Aucune demande de validation ou d&apos;annulation en attente.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-3 px-2 py-2">
              {pendingBookings.map((booking) => {
                const isProcessing = isModerating && activeBookingId === booking.id;
                const requiresAction = booking.requiresAction !== false;

                return (
                  <NotificationItem
                    key={booking.id}
                    booking={booking}
                    isProcessing={isProcessing}
                    isMarkingAsViewed={isMarkingAsViewed}
                    activeBookingId={activeBookingId}
                    requiresAction={requiresAction}
                    onReject={() => onModeration(booking.id, "reject", booking.type)}
                    onApprove={() => onModeration(booking.id, "approve")}
                    onDismiss={() => onDismiss(booking.id)}
                    onView={() => onView(booking.id)}
                  />
                );
              })}
            </div>
          </div>
        )}
        {hiddenNotifications > 0 && (
          <div className="px-4 pb-3 text-xs text-muted-foreground">
            Et {hiddenNotifications} autre{hiddenNotifications > 1 ? "s" : ""} demande{hiddenNotifications > 1 ? "s" : ""}{" "}
            en file d&apos;attente.
          </div>
        )}
        {actionError ? (
          <div className="px-4 pb-3 text-xs font-medium text-red-600">{actionError}</div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

