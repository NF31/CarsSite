import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import type { ClientRecentBooking } from "@/actions/client/bookings/get-recent";
import {
  BookingBasicInfo,
  BookingPeriodSection,
  BookingLocationsSection,
  BookingPricingSection,
  BookingServicesSection,
  BookingNotesSection,
  BookingCancellationPendingSection,
  BookingInvoicesSection,
} from "./BookingDetailsSections";

interface BookingDetailsDialogProps {
  booking: ClientRecentBooking;
}

export function BookingDetailsDialog({ booking }: BookingDetailsDialogProps) {
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="inline-flex items-center gap-1 text-xs sm:text-sm">
          <Info className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Détails réservation</span>
          <span className="sm:hidden">Détails</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Réservation {booking.reference}</DialogTitle>
          <DialogDescription>Informations détaillées de votre réservation.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <BookingBasicInfo booking={booking} />
          <BookingPeriodSection startDate={startDate} endDate={endDate} />
          <BookingLocationsSection booking={booking} />
          <BookingPricingSection booking={booking} />
          <BookingServicesSection booking={booking} />
          <BookingNotesSection booking={booking} />
          <BookingCancellationPendingSection booking={booking} />
          <BookingInvoicesSection booking={booking} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

