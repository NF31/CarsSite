"use client";

import { AdminSidebarMobile } from "../AdminSidebar";
import { DynamicSearchBar } from "../search/DynamicSearchBar";
import type { AdminNavbarProps } from "./types";
import { useNotifications } from "./hooks/use-notifications";
import { useModeration } from "./hooks/use-moderation";
import { useNotificationActions } from "./hooks/use-notification-actions";
import { useRejectionDialog } from "./hooks/use-rejection-dialog";
import { NotificationsDropdown } from "./components/notifications-dropdown";
import { UserMenu } from "./components/user-menu";
import { RejectionDialog } from "./components/rejection-dialog";

export function AdminNavbar({ session, bookingNotifications }: AdminNavbarProps) {
  const { pendingBookings, setPendingBookings, notificationCount, hiddenNotifications } = useNotifications(
    bookingNotifications
  );

  const { actionError, activeBookingId, isModerating, handleModeration, handleRejectionConfirm } = useModeration();

  const { activeBookingId: notificationActiveId, isMarkingAsViewed, handleDismiss, handleViewNotification } =
    useNotificationActions(setPendingBookings);

  const {
    rejectionDialogOpen,
    rejectionBookingId,
    rejectionBookingType,
    rejectionReason,
    setRejectionReason,
    openDialog,
    closeDialog,
  } = useRejectionDialog();

  const handleModerationWithDialog = (bookingId: string, action: "approve" | "reject", bookingType?: string) => {
    handleModeration(bookingId, action, bookingType, () => {
      if (bookingType) {
        openDialog(bookingId, bookingType);
      }
    });
  };

  const handleRejectionConfirmWithClose = () => {
    if (!rejectionBookingId || !rejectionBookingType) return;
    handleRejectionConfirm(rejectionBookingId, rejectionReason, rejectionBookingType, () => {
      closeDialog();
    });
  };

  // Log pour debug
  console.log("[AdminNavbar] 🔔 Notifications reçues:", {
    totalPending: bookingNotifications?.totalPending ?? 0,
    itemsCount: bookingNotifications?.items?.length ?? 0,
    items: bookingNotifications?.items,
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 lg:px-6 lg:ml-64">
        {/* Bouton menu mobile */}
        <div className="lg:hidden -ml-1">
          <AdminSidebarMobile />
        </div>

        {/* Barre de recherche */}
        <div className="flex-1 max-w-lg hidden md:block">
          <DynamicSearchBar />
        </div>

        {/* Espace flexible pour mobile */}
        <div className="flex-1 md:hidden" />

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Bouton recherche mobile */}
          <div className="md:hidden">
            <DynamicSearchBar className="w-80 max-w-[calc(100vw-2rem)]" />
          </div>

          {/* Notifications */}
          <NotificationsDropdown
            notificationCount={notificationCount}
            hiddenNotifications={hiddenNotifications}
            pendingBookings={pendingBookings}
            isModerating={isModerating}
            isMarkingAsViewed={isMarkingAsViewed}
            activeBookingId={activeBookingId || notificationActiveId}
            actionError={actionError}
            onModeration={handleModerationWithDialog}
            onDismiss={handleDismiss}
            onView={handleViewNotification}
          />

          {/* Menu utilisateur */}
          {session?.user && <UserMenu session={session} />}
        </div>
      </div>

      {/* Dialog pour le message de refus (annulation ou modification) */}
      <RejectionDialog
        open={rejectionDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
        bookingType={rejectionBookingType}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        onConfirm={handleRejectionConfirmWithClose}
        isModerating={isModerating}
        isProcessing={isModerating && activeBookingId === rejectionBookingId}
      />
    </header>
  );
}

