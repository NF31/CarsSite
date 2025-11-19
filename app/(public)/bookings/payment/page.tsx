import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import { PaymentPageClient } from "./PaymentPageClient";

interface PaymentPageProps {
  searchParams: Promise<{
    bookingId?: string;
    type?: string; // "deposit" | "full" | "authorization"
  }>;
}

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?redirect=/bookings/payment");
  }

  const { bookingId, type } = await searchParams;

  if (!bookingId) {
    redirect("/dashboard");
  }

  const paymentType = type || "full"; // Par défaut, paiement complet

  // Récupérer la réservation avec toutes les données nécessaires pour revenir à l'étape 4
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      reference: true,
      startDate: true,
      endDate: true,
      pickupLocationId: true,
      returnLocationId: true,
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
      pickupLocation: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
      returnLocation: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
  });

  if (!booking || booking.userId !== session.user.id) {
    redirect("/dashboard");
  }

  // Extraire les heures depuis les dates stockées dans la réservation
  const extractTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const startTime = extractTime(booking.startDate);
  const endTime = extractTime(booking.endDate);

  // Calculer le prix pour obtenir l'acompte et la caution
  // Utiliser les heures réelles stockées dans la réservation, pas des valeurs par défaut
  const priceResult = await calculateBookingPriceAction({
    vehicleId: booking.vehicle.id,
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    startTime: startTime, // Heures réelles depuis la réservation
    endTime: endTime, // Heures réelles depuis la réservation
    serviceIds: booking.serviceIds,
  });

  if (!priceResult.success || !priceResult.data) {
    redirect("/dashboard");
  }

  const { deposit: downPayment, securityDeposit } = priceResult.data;
  
  // Déterminer le montant à payer selon le type
  let totalToPay: number;
  let paymentDescription: string;
  
  if (paymentType === "deposit") {
    // Acompte seulement
    totalToPay = downPayment;
    paymentDescription = `Acompte pour la réservation ${booking.reference}`;
    
    // Si l'acompte est déjà payé, rediriger
    if (booking.depositPaid >= downPayment) {
      redirect(`/bookings/payment/success?booking_id=${booking.id}`);
    }
  } else if (paymentType === "authorization") {
    // Empreinte bancaire seulement (aucun paiement, juste blocage)
    totalToPay = securityDeposit;
    paymentDescription = `Empreinte bancaire pour la réservation ${booking.reference}`;
  } else {
    // Paiement complet (acompte + caution)
    totalToPay = downPayment + securityDeposit;
    paymentDescription = `Acompte et caution pour la réservation ${booking.reference}`;
    
    // Si déjà payé, rediriger
    if (booking.depositPaid >= downPayment) {
      redirect(`/bookings/payment/success?booking_id=${booking.id}`);
    }
  }

  // Construire l'URL pour revenir à l'étape 4 du formulaire de réservation
  const formatDateForUrl = (date: Date) => {
    return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
  };

  // Les heures sont déjà extraites plus haut, on les réutilise

  const pickupName = booking.pickupLocation?.name || booking.pickupLocation?.address || '';
  const returnName = booking.returnLocation?.name || booking.returnLocation?.address || '';

  // Construire l'URL avec tous les paramètres nécessaires
  const urlParams = new URLSearchParams({
    vehicleId: booking.vehicle.id,
    startDate: formatDateForUrl(booking.startDate),
    endDate: formatDateForUrl(booking.endDate),
    startTime: extractTime(booking.startDate),
    endTime: extractTime(booking.endDate),
    step: '4',
    bookingId: booking.id, // IMPORTANT : bookingId doit être présent
  });
  
  if (pickupName) {
    urlParams.append('pickup', pickupName);
  }
  if (returnName) {
    urlParams.append('returnLocation', returnName);
  }
  if (booking.serviceIds.length > 0) {
    urlParams.append('serviceIds', booking.serviceIds.join(','));
  }
  
  const backToStep4Url = `/bookings/new?${urlParams.toString()}`;
  
  // Log serveur pour vérifier que bookingId est bien dans l'URL
  console.log("🔍 [PaymentPage - SERVEUR] URL de retour générée:", {
    bookingId: booking.id,
    bookingReference: booking.reference,
    urlContainsBookingId: backToStep4Url.includes(`bookingId=${booking.id}`),
    urlParamsString: urlParams.toString(),
    urlParamsBookingId: urlParams.get('bookingId'),
    fullUrl: backToStep4Url,
    urlLength: backToStep4Url.length,
  });

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
      paymentType={paymentType}
      paymentDescription={paymentDescription}
      backToStep4Url={backToStep4Url}
    />
  );
}

