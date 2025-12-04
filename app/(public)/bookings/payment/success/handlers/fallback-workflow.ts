import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/lib/types/booking-status";
import { PaymentStatus } from "@/lib/types/payment-status";
import type { BookingData } from "../types";

/**
 * Handler pour le workflow de secours (facture, email, PDFs)
 */

/**
 * Exécute le workflow de secours complet
 */
export async function executeFallbackWorkflow(
  booking: BookingData,
  sessionId: string | undefined,
  finalPaymentStatus: PaymentStatus
): Promise<void> {
  // 1. Créer la facture si elle n'existe pas
  const existingInvoice = await prisma.invoice.findFirst({
    where: { bookingId: booking.id },
    select: { id: true, invoiceNumber: true },
  });

  if (!existingInvoice) {
    const { createInvoiceForBooking } = await import("@/lib/invoice-creation");
    await createInvoiceForBooking(booking.id);
  }

  // 2. Mettre à jour le statut des factures
  if (sessionId) {
    const paymentRecord = await prisma.payment.findFirst({
      where: { transactionId: sessionId },
      select: { id: true, amount: true, status: true },
    });

    if (paymentRecord && finalPaymentStatus === PaymentStatus.COMPLETED) {
      const { updateInvoiceStatusAfterPayment } = await import("@/lib/invoice-status-update");
      await updateInvoiceStatusAfterPayment(booking.id, paymentRecord.id, paymentRecord.amount);
    }
  }

  // 3. Envoyer l'email de confirmation avec PDFs (en arrière-plan)
  Promise.resolve()
    .then(async () => {
      await sendConfirmationEmailWithPDFs(booking);
    })
    .catch(() => {
      // Ignorer les erreurs pour ne pas bloquer la page
    });
}

/**
 * Envoie l'email de confirmation avec les PDFs
 */
async function sendConfirmationEmailWithPDFs(booking: BookingData): Promise<void> {
  const { sendBookingConfirmationEmail } = await import("@/lib/email");
  const { generateInvoicePDFAction } = await import("@/actions/admin/invoices/generate-pdf");
  const { generateBookingPDF } = await import("@/lib/booking-pdf");
  const { createDefaultAdminSettings } = await import("@/actions/admin/settings/shared");
  const { format } = await import("date-fns");
  const { fr } = await import("date-fns/locale");
  const { getGreeting } = await import("../utils/helpers");

  // Récupérer toutes les données nécessaires
  const [userData, vehicleData, pickupLocData, returnLocData, bookingWithServices] = await Promise.all([
    prisma.user.findUnique({
      where: { id: booking.userId || "" },
      select: { email: true, name: true, phone: true },
    }),
    prisma.vehicle.findUnique({
      where: { id: booking.vehicleId },
      select: { brand: true, model: true, licensePlate: true, pricePerDay: true },
    }),
    prisma.location.findUnique({
      where: { id: booking.pickupLocationId },
      select: { name: true, city: true, address: true },
    }),
    prisma.location.findUnique({
      where: { id: booking.returnLocationId },
      select: { name: true, city: true, address: true },
    }),
    prisma.booking.findUnique({
      where: { id: booking.id },
      select: { serviceIds: true },
    }),
  ]);

  if (!userData || !vehicleData || !pickupLocData || !returnLocData || !bookingWithServices) {
    return;
  }

  const attachments: Array<{ filename: string; content: Buffer; contentType?: string }> = [];

  // Générer PDF de réservation
  const services =
    bookingWithServices.serviceIds && bookingWithServices.serviceIds.length > 0
      ? await prisma.service.findMany({
          where: { id: { in: bookingWithServices.serviceIds } },
          select: { name: true, price: true },
        })
      : [];

  const agencySettings = await prisma.setting.findMany({
    where: {
      key: { in: ["agency.name", "agency.address", "agency.phone", "agency.email"] },
    },
  });
  const defaultSettings = createDefaultAdminSettings();
  const settingsMap = new Map(agencySettings.map((s) => [s.key, s.value]));
  const agencyName = settingsMap.get("agency.name");
  const agencyAddress = settingsMap.get("agency.address");
  const agencyPhone = settingsMap.get("agency.phone");
  const agencyEmail = settingsMap.get("agency.email");
  const agency = {
    name: typeof agencyName === "string" ? agencyName : defaultSettings.agency.name || "CarRental",
    address:
      typeof agencyAddress === "string"
        ? agencyAddress
        : defaultSettings.agency.address || "123 Avenue de la Liberté, 75000 Paris",
    phone:
      typeof agencyPhone === "string"
        ? agencyPhone
        : defaultSettings.agency.phone || "+33 1 23 45 67 89",
    email:
      typeof agencyEmail === "string"
        ? agencyEmail
        : defaultSettings.agency.email || "contact@carrental.com",
  };

  try {
    const bookingPdfBuffer = await generateBookingPDF({
      reference: booking.reference,
      status: booking.status || BookingStatus.CONFIRMED,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: booking.totalPrice,
      depositPaid: booking.depositPaid || 0,
      remainingAmount: booking.remainingAmount || 0,
      vehicle: {
        brand: vehicleData.brand,
        model: vehicleData.model,
        licensePlate: vehicleData.licensePlate,
        pricePerDay: vehicleData.pricePerDay,
      },
      pickupLocation: {
        name: pickupLocData.name,
        city: pickupLocData.city || "",
        address: pickupLocData.address,
      },
      returnLocation: {
        name: returnLocData.name,
        city: returnLocData.city || "",
        address: returnLocData.address,
      },
      services: services.map((s) => ({ name: s.name, price: s.price })),
      user: {
        name: userData.name || "Client",
        email: userData.email,
        phone: userData.phone,
      },
      agency,
    });
    attachments.push({
      filename: `Reservation_${booking.reference}.pdf`,
      content: bookingPdfBuffer,
      contentType: "application/pdf",
    });

    // Générer PDF de facture si elle existe
    const invoice = await prisma.invoice.findFirst({
      where: { bookingId: booking.id },
      select: { id: true },
    });

    if (invoice) {
      const invoicePdfResult = await generateInvoicePDFAction(invoice.id);
      if (invoicePdfResult.success && invoicePdfResult.data?.pdfBuffer) {
        attachments.push({
          filename: `Facture_${booking.reference}.pdf`,
          content: invoicePdfResult.data.pdfBuffer,
          contentType: "application/pdf",
        });
      }
    }
  } catch {
    // Ignorer les erreurs de génération de PDF
  }

  // Envoyer l'email
  const bookingPeriod = `${format(booking.startDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })} → ${format(booking.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;
  const greeting = getGreeting();

  await sendBookingConfirmationEmail({
    to: userData.email || "",
    name: userData.name || "Client",
    greeting,
    booking: {
      reference: booking.reference,
      totalPrice: booking.totalPrice,
      depositPaid: booking.depositPaid || 0,
      remainingAmount: booking.remainingAmount || 0,
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status || BookingStatus.CONFIRMED,
      period: bookingPeriod,
    },
    vehicle: {
      label: `${vehicleData.brand} ${vehicleData.model}`,
      licensePlate: vehicleData.licensePlate,
    },
    locations: {
      pickup: pickupLocData.name,
      return: returnLocData.name,
    },
    attachments: attachments.length > 0 ? attachments : undefined,
  });
}

