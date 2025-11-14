import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createCheckoutSessionAction } from "@/actions/public/payments/create-checkout-session";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import { PaymentPageClient } from "./PaymentPageClient";

interface PaymentPageProps {
  searchParams: Promise<{
    bookingId?: string;
  }>;
}

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?redirect=/bookings/payment");
  }

  const { bookingId } = await searchParams;

  if (!bookingId) {
    redirect("/dashboard");
  }

  // Récupérer la réservation
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      reference: true,
      startDate: true,
      endDate: true,
      totalPrice: true,
      depositPaid: true,
      remainingAmount: true,
      status: true,
      serviceIds: true,
      vehicle: {
        select: {
          id: true,
          brand: true,
          model: true,
          year: true,
          licensePlate: true,
          pricePerDay: true,
          deposit: true,
        },
      },
    },
  });

  if (!booking || booking.userId !== session.user.id) {
    redirect("/dashboard");
  }

  // Calculer le prix pour obtenir l'acompte et la caution
  const priceResult = await calculateBookingPriceAction({
    vehicleId: booking.vehicle.id,
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    startTime: "10:00", // Valeur par défaut, devrait être stockée dans la réservation
    endTime: "10:00", // Valeur par défaut
    serviceIds: booking.serviceIds,
  });

  if (!priceResult.success || !priceResult.data) {
    redirect("/dashboard");
  }

  const { deposit: downPayment, securityDeposit } = priceResult.data;
  const totalToPay = downPayment + securityDeposit;

  // Si déjà payé, rediriger
  if (booking.depositPaid >= downPayment) {
    redirect(`/bookings/payment/success?booking_id=${booking.id}`);
  }

  return (
    <PaymentPageClient
      booking={{
        id: booking.id,
        reference: booking.reference,
        vehicle: {
          brand: booking.vehicle.brand,
          model: booking.vehicle.model,
          year: booking.vehicle.year,
          licensePlate: booking.vehicle.licensePlate,
        },
        period: `${booking.startDate.toLocaleDateString("fr-FR")} → ${booking.endDate.toLocaleDateString("fr-FR")}`,
      }}
      paymentDetails={{
        downPayment,
        securityDeposit,
        totalToPay,
        remainingAmount: priceResult.data.remainingAmount,
      }}
    />
  );
}

