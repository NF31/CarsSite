import { sendBookingConfirmationEmail } from "@/lib/email";
import type { SendEmailResult } from "@/lib/email/utils/send-email";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BookingStatus } from "@prisma/client";

interface SendBookingEmailParams {
  to: string;
  name: string;
  booking: {
    reference: string;
    totalPrice: number;
    depositPaid: number;
    remainingAmount: number;
    startDate: Date;
    endDate: Date;
    status: BookingStatus;
  };
  vehicle: {
    label: string;
    licensePlate: string;
  };
  locations: {
    pickup: string;
    return: string;
  };
}

export async function sendBookingEmail(params: SendBookingEmailParams): Promise<SendEmailResult> {
  const bookingPeriod = `${format(params.booking.startDate, "dd MMMM yyyy 'à' HH:mm", {
    locale: fr,
  })} → ${format(params.booking.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;
  const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";

  const emailResult = await sendBookingConfirmationEmail({
    to: params.to,
    name: params.name,
    greeting,
    booking: {
      reference: params.booking.reference,
      totalPrice: params.booking.totalPrice,
      depositPaid: params.booking.depositPaid,
      remainingAmount: params.booking.remainingAmount,
      startDate: params.booking.startDate,
      endDate: params.booking.endDate,
      status: params.booking.status,
      period: bookingPeriod,
    },
    vehicle: {
      label: params.vehicle.label,
      licensePlate: params.vehicle.licensePlate,
    },
    locations: {
      pickup: params.locations.pickup,
      return: params.locations.return,
    },
  });

  return emailResult;
}

