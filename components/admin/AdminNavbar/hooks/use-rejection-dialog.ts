import { useState } from "react";

export function useRejectionDialog() {
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionBookingId, setRejectionBookingId] = useState<string | null>(null);
  const [rejectionBookingType, setRejectionBookingType] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const openDialog = (bookingId: string, bookingType: string) => {
    setRejectionBookingId(bookingId);
    setRejectionBookingType(bookingType);
    setRejectionReason("");
    setRejectionDialogOpen(true);
  };

  const closeDialog = () => {
    setRejectionDialogOpen(false);
    setRejectionBookingId(null);
    setRejectionBookingType(null);
    setRejectionReason("");
  };

  return {
    rejectionDialogOpen,
    rejectionBookingId,
    rejectionBookingType,
    rejectionReason,
    setRejectionReason,
    openDialog,
    closeDialog,
  };
}

