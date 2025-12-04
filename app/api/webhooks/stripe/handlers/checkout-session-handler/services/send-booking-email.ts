import { format } from "date-fns";
import { fr } from "date-fns/locale";
import prisma from "@/lib/prisma";
import { sendBookingConfirmationEmail, sendBookingUpdateEmail } from "@/lib/email";
import { generateBookingPDF } from "@/lib/booking-pdf";
import { generateInvoicePDFAction } from "@/actions/admin/invoices/generate-pdf";
import { createDefaultAdminSettings } from "@/actions/admin/settings/shared";
import { getEmailGreeting } from "../../../utils/helpers";
import { AGENCY_SETTINGS_KEYS } from "../constants";
import type { SendEmailParams, ModificationInfo } from "../types";

export async function sendBookingEmail(params: SendEmailParams) {
  try {
    const { updatedBooking, paymentType, session, amounts } = params;

    const [user, vehicle, pickupLocation, returnLocation, bookingWithDetails] = await Promise.all([
      prisma.user.findUnique({
        where: { id: updatedBooking.userId },
        select: { email: true, name: true, phone: true },
      }),
      prisma.vehicle.findUnique({
        where: { id: updatedBooking.vehicleId },
        select: { brand: true, model: true, licensePlate: true, pricePerDay: true },
      }),
      prisma.location.findUnique({
        where: { id: updatedBooking.pickupLocationId },
        select: { name: true, city: true, address: true },
      }),
      prisma.location.findUnique({
        where: { id: updatedBooking.returnLocationId },
        select: { name: true, city: true, address: true },
      }),
      prisma.booking.findUnique({
        where: { id: updatedBooking.id },
        select: { serviceIds: true },
      }),
    ]);

    if (!user || !vehicle || !pickupLocation || !returnLocation || !bookingWithDetails) {
      return;
    }

    const bookingPeriod = `${format(updatedBooking.startDate, "dd MMMM yyyy 'à' HH:mm", {
      locale: fr,
    })} -> ${format(updatedBooking.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;

    const greeting = getEmailGreeting();

    if (paymentType.isModificationPayment) {
      await sendModificationEmail({
        user,
        vehicle,
        pickupLocation,
        returnLocation,
        updatedBooking,
        bookingPeriod,
        greeting,
        session,
        amounts,
      });
    } else {
      await sendConfirmationEmail({
        user,
        vehicle,
        pickupLocation,
        returnLocation,
        bookingWithDetails,
        updatedBooking,
        bookingPeriod,
        greeting,
        amounts,
      });
    }
  } catch {
    // Ne pas bloquer le webhook si l'email échoue
  }
}

async function sendModificationEmail(params: {
  user: { email: string; name: string | null; phone: string | null };
  vehicle: { brand: string; model: string; licensePlate: string; pricePerDay: number };
  pickupLocation: { name: string; city: string | null; address: string };
  returnLocation: { name: string; city: string | null; address: string };
  updatedBooking: SendEmailParams["updatedBooking"];
  bookingPeriod: string;
  greeting: string;
  session: SendEmailParams["session"];
  amounts: SendEmailParams["amounts"];
}) {
  const { user, vehicle, pickupLocation, returnLocation, updatedBooking, bookingPeriod, greeting, session, amounts } = params;

  let originalTotalPrice = session.metadata?.originalTotalPrice
    ? parseFloat(session.metadata.originalTotalPrice)
    : null;
  let originalDepositPaid = session.metadata?.originalDepositPaid
    ? parseFloat(session.metadata.originalDepositPaid)
    : null;

  if (originalTotalPrice == null || originalDepositPaid == null) {
    const booking = await prisma.booking.findUnique({
      where: { id: updatedBooking.id },
      select: { originalTotalPrice: true, originalDepositPaid: true },
    });
    if (booking) {
      originalTotalPrice = booking.originalTotalPrice ?? originalTotalPrice;
      originalDepositPaid = booking.originalDepositPaid ?? originalDepositPaid;
    }
  }

  if (originalTotalPrice == null) {
    originalTotalPrice = updatedBooking.totalPrice - amounts.roundedAmountPaid / 0.3;
  }
  if (originalDepositPaid == null) {
    originalDepositPaid = amounts.emailDepositPaid - amounts.roundedAmountPaid;
  }

  const originalRemainingAmount = originalTotalPrice - originalDepositPaid;
  const depositDifference = amounts.roundedAmountPaid;
  const securityDepositPaid = updatedBooking.securityDepositPaid || 0;

  const modificationInfo: ModificationInfo = {
    originalTotalPrice,
    originalDepositPaid,
    originalRemainingAmount,
    depositDifference,
    additionalPaymentAmount: amounts.roundedAmountPaid,
    securityDepositPaid,
    paymentConfirmed: true,
  };

  await sendBookingUpdateEmail({
    to: user.email,
    name: user.name || "Client",
    greeting,
    booking: {
      reference: updatedBooking.reference,
      totalPrice: updatedBooking.totalPrice,
      depositPaid: amounts.emailDepositPaid,
      remainingAmount: amounts.emailRemainingAmount,
      startDate: updatedBooking.startDate,
      endDate: updatedBooking.endDate,
      status: updatedBooking.status,
      period: bookingPeriod,
    },
    vehicle: {
      label: `${vehicle.brand} ${vehicle.model}`,
      licensePlate: vehicle.licensePlate,
    },
    locations: {
      pickup: pickupLocation.name,
      return: returnLocation.name,
    },
    modificationInfo,
  });
}

async function sendConfirmationEmail(params: {
  user: { email: string; name: string | null; phone: string | null };
  vehicle: { brand: string; model: string; licensePlate: string; pricePerDay: number };
  pickupLocation: { name: string; city: string | null; address: string };
  returnLocation: { name: string; city: string | null; address: string };
  bookingWithDetails: { serviceIds: string[] | null };
  updatedBooking: SendEmailParams["updatedBooking"];
  bookingPeriod: string;
  greeting: string;
  amounts: SendEmailParams["amounts"];
}) {
  const { user, vehicle, pickupLocation, returnLocation, bookingWithDetails, updatedBooking, bookingPeriod, greeting, amounts } = params;

  const attachments: Array<{ filename: string; content: Buffer; contentType?: string }> = [];

  try {
    // PDF de réservation
    const services =
      bookingWithDetails?.serviceIds && bookingWithDetails.serviceIds.length > 0
        ? await prisma.service.findMany({
            where: { id: { in: bookingWithDetails.serviceIds } },
            select: { name: true, price: true },
          })
        : [];

    const agencySettings = await prisma.setting.findMany({
      where: {
        key: {
          in: [...AGENCY_SETTINGS_KEYS],
        },
      },
    });
    const defaultSettings = createDefaultAdminSettings();
    const settingsMap = new Map(agencySettings.map((s) => [s.key, s.value]));

    const agency = {
      name:
        typeof settingsMap.get("agency.name") === "string"
          ? (settingsMap.get("agency.name") as string)
          : defaultSettings.agency.name || "CarRental",
      address:
        typeof settingsMap.get("agency.address") === "string"
          ? (settingsMap.get("agency.address") as string)
          : defaultSettings.agency.address || "123 Avenue de la Liberté, 75000 Paris",
      phone:
        typeof settingsMap.get("agency.phone") === "string"
          ? (settingsMap.get("agency.phone") as string)
          : defaultSettings.agency.phone || "+33 1 23 45 67 89",
      email:
        typeof settingsMap.get("agency.email") === "string"
          ? (settingsMap.get("agency.email") as string)
          : defaultSettings.agency.email || "contact@carrental.com",
    };

    const bookingPdfBuffer = await generateBookingPDF({
      reference: updatedBooking.reference,
      status: updatedBooking.status,
      startDate: updatedBooking.startDate,
      endDate: updatedBooking.endDate,
      totalPrice: updatedBooking.totalPrice,
      depositPaid: amounts.emailDepositPaid,
      remainingAmount: amounts.emailRemainingAmount,
      vehicle: {
        brand: vehicle.brand,
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
        pricePerDay: vehicle.pricePerDay,
      },
      pickupLocation: {
        name: pickupLocation.name,
        city: pickupLocation.city || "",
        address: pickupLocation.address,
      },
      returnLocation: {
        name: returnLocation.name,
        city: returnLocation.city || "",
        address: returnLocation.address,
      },
      services: services.map((s) => ({ name: s.name, price: s.price })),
      user: {
        name: user.name || "Client",
        email: user.email,
        phone: user.phone,
      },
      agency,
    });

    attachments.push({
      filename: `Reservation_${updatedBooking.reference}.pdf`,
      content: bookingPdfBuffer,
      contentType: "application/pdf",
    });

    // PDF de facture
    const invoice = await prisma.invoice.findFirst({
      where: { bookingId: updatedBooking.id },
      select: { id: true },
    });

    if (invoice) {
      const invoicePdfResult = await generateInvoicePDFAction(invoice.id);
      if (invoicePdfResult.success && invoicePdfResult.data?.pdfBuffer) {
        attachments.push({
          filename: `Facture_${updatedBooking.reference}.pdf`,
          content: invoicePdfResult.data.pdfBuffer,
          contentType: "application/pdf",
        });
      }
    }
  } catch {
    // Continuer même si les PDFs échouent
  }

  await sendBookingConfirmationEmail({
    to: user.email,
    name: user.name || "Client",
    greeting,
    booking: {
      reference: updatedBooking.reference,
      totalPrice: updatedBooking.totalPrice,
      depositPaid: amounts.emailDepositPaid,
      remainingAmount: amounts.emailRemainingAmount,
      securityDepositPaid: updatedBooking.securityDepositPaid || undefined,
      startDate: updatedBooking.startDate,
      endDate: updatedBooking.endDate,
      status: updatedBooking.status,
      period: bookingPeriod,
    },
    vehicle: {
      label: `${vehicle.brand} ${vehicle.model}`,
      licensePlate: vehicle.licensePlate,
    },
    locations: {
      pickup: pickupLocation.name,
      return: returnLocation.name,
    },
    attachments: attachments.length > 0 ? attachments : undefined,
  });
}


