import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";
import Stripe from "stripe";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import { sendBookingConfirmationEmail, sendBookingUpdateEmail } from "@/lib/email";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { updateInvoiceStatusAfterPayment } from "@/lib/invoice-status-update";
import { generateInvoicePDFAction } from "@/actions/admin/invoices/generate-pdf";
import { generateBookingPDF } from "@/lib/booking-pdf";
import { createDefaultAdminSettings } from "@/actions/admin/settings/shared";
import { extractTime, roundAmount, getPaymentTypeFromMetadata, getEmailGreeting } from "../utils/helpers";
import type { CheckoutSessionData } from "../types";

/**
 * Handler pour les événements checkout.session.completed
 */
export async function handleCheckoutSessionCompleted(
  data: CheckoutSessionData
): Promise<NextResponse> {
  const { bookingId, userId, session } = data;

  try {
    // Récupérer la réservation
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        totalPrice: true,
        depositPaid: true,
        securityDepositPaid: true,
        remainingAmount: true,
        serviceIds: true,
        startDate: true,
        endDate: true,
        status: true,
        modificationDepositDifference: true,
        originalStartDate: true,
        originalEndDate: true,
        originalTotalPrice: true,
        originalDepositPaid: true,
        vehicle: {
          select: {
            id: true,
            deposit: true,
          },
        },
      },
    });

    if (!booking || booking.userId !== userId) {
      return NextResponse.json({ received: true });
    }

    // Calculer le prix
    const startTime = extractTime(booking.startDate);
    const endTime = extractTime(booking.endDate);

    const priceResult = await calculateBookingPriceAction({
      vehicleId: booking.vehicle.id,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      startTime,
      endTime,
      serviceIds: booking.serviceIds,
    });

    if (!priceResult.success || !priceResult.data) {
      return NextResponse.json({ received: true });
    }

    const { deposit: downPayment, securityDeposit } = priceResult.data;

    // Déterminer le type de paiement
    const hasModificationDepositDifference = (booking.modificationDepositDifference ?? 0) > 0;
    const paymentType = getPaymentTypeFromMetadata(
      session.metadata,
      hasModificationDepositDifference
    );

    // Calculer les montants
    const currentDepositPaid = booking.depositPaid || 0;
    const currentSecurityDepositPaid = booking.securityDepositPaid || 0;
    const roundedDownPayment = roundAmount(downPayment);
    const roundedSecurityDeposit = roundAmount(securityDeposit);
    const roundedRemainingAmount = roundAmount(priceResult.data.remainingAmount);
    const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
    const roundedAmountPaid = roundAmount(amountPaid);

    // Calculer le montant attendu (pour validation, non utilisé actuellement)
    // const expectedAmount = paymentType.isModificationPayment
    //   ? roundedAmountPaid
    //   : paymentType.isAuthorization
    //     ? roundedSecurityDeposit
    //     : paymentType.isDepositOnly
    //       ? roundedDownPayment
    //       : roundedDownPayment + roundedSecurityDeposit;

    // Mettre à jour la réservation
    let updateData: Prisma.BookingUpdateInput = {};
    let emailDepositPaid: number = 0;
    let emailRemainingAmount: number = 0;

    if (paymentType.isModificationPayment) {
      const newDepositPaid = roundAmount(currentDepositPaid + roundedAmountPaid);
      const newRemainingAmount = roundAmount(booking.totalPrice - newDepositPaid);
      emailDepositPaid = newDepositPaid;
      emailRemainingAmount = newRemainingAmount;

      updateData = {
        depositPaid: newDepositPaid,
        securityDepositPaid: currentSecurityDepositPaid,
        remainingAmount: newRemainingAmount,
        status: BookingStatus.CONFIRMED,
        modificationDepositDifference: null,
        originalStartDate: null,
        originalEndDate: null,
        originalTotalPrice: null,
        originalDepositPaid: null,
      };
    } else if (paymentType.isAuthorization) {
      emailDepositPaid = booking.depositPaid || 0;
      emailRemainingAmount = roundedRemainingAmount;

      updateData = {
        securityDepositPaid: roundedSecurityDeposit,
        remainingAmount: roundedRemainingAmount,
        status: BookingStatus.PENDING,
      };
    } else if (paymentType.isDepositOnly) {
      const actualDepositPaid = roundedAmountPaid;
      const actualRemainingAmount = roundAmount(booking.totalPrice - actualDepositPaid);
      emailDepositPaid = actualDepositPaid;
      emailRemainingAmount = actualRemainingAmount;

      updateData = {
        depositPaid: actualDepositPaid,
        remainingAmount: actualRemainingAmount,
        status: BookingStatus.CONFIRMED,
      };
    } else {
      const actualDepositPaid = roundedDownPayment;
      const actualRemainingAmount = roundAmount(booking.totalPrice - actualDepositPaid);
      emailDepositPaid = actualDepositPaid;
      emailRemainingAmount = actualRemainingAmount;

      updateData = {
        depositPaid: actualDepositPaid,
        securityDepositPaid: roundedSecurityDeposit,
        remainingAmount: actualRemainingAmount,
        status: BookingStatus.CONFIRMED,
      };
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      select: {
        id: true,
        reference: true,
        status: true,
        depositPaid: true,
        securityDepositPaid: true,
        remainingAmount: true,
        totalPrice: true,
        startDate: true,
        endDate: true,
        userId: true,
        vehicleId: true,
        pickupLocationId: true,
        returnLocationId: true,
      },
    });

    // Forcer CONFIRMED pour les paiements de modification
    if (paymentType.isModificationPayment && updatedBooking.status !== BookingStatus.CONFIRMED) {
      const correctedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
        select: { id: true, status: true, reference: true },
      });
      updatedBooking.status = correctedBooking.status;
    }

    // Créer la facture si confirmée
    if (updatedBooking.status === BookingStatus.CONFIRMED) {
      try {
        const { createInvoiceForBooking } = await import("@/lib/invoice-creation");
        await createInvoiceForBooking(bookingId);
      } catch {
        // Ne pas bloquer le webhook
      }
    }

    // Créer l'enregistrement de paiement
    const paymentStatus = paymentType.isAuthorization
      ? PaymentStatus.PENDING
      : PaymentStatus.COMPLETED;
    const paymentAmount = roundedAmountPaid;

    let metadataDownPayment: number;
    let metadataSecurityDeposit: number;

    if (paymentType.isModificationPayment) {
      metadataDownPayment = roundedAmountPaid;
      metadataSecurityDeposit = 0;
    } else if (paymentType.isAuthorization) {
      metadataDownPayment = 0;
      metadataSecurityDeposit = roundedSecurityDeposit;
    } else if (paymentType.isDepositOnly) {
      metadataDownPayment = roundedDownPayment;
      metadataSecurityDeposit = 0;
    } else {
      metadataDownPayment = roundedDownPayment;
      metadataSecurityDeposit = roundedSecurityDeposit;
    }

    const existingPayment = await prisma.payment.findFirst({
      where: { transactionId: session.id },
    });

    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          bookingId: bookingId,
          userId: userId,
          amount: paymentAmount,
          method: "STRIPE",
          status: paymentStatus,
          transactionId: session.id,
          metadata: {
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string | undefined,
            paymentType: paymentType.type,
            isModificationPayment: paymentType.isModificationPayment,
            downPayment: metadataDownPayment,
            securityDeposit: metadataSecurityDeposit,
            amountPaid: paymentAmount,
          },
        },
      });
    }

    // Mettre à jour le statut des factures
    if (paymentStatus === PaymentStatus.COMPLETED && !paymentType.isAuthorization) {
      try {
        const payment = await prisma.payment.findFirst({
          where: { transactionId: session.id },
        });
        if (payment) {
          await updateInvoiceStatusAfterPayment(bookingId, payment.id, paymentAmount);
        }
      } catch {
        // Ne pas bloquer le webhook
      }
    }

    // Envoyer l'email si confirmé
    if (updatedBooking.status === BookingStatus.CONFIRMED) {
      await sendEmailForBooking(updatedBooking, paymentType, session, {
        emailDepositPaid,
        emailRemainingAmount,
        roundedAmountPaid,
      });
    }

    // Invalider le cache
    try {
      const { invalidateBookingCache, invalidateVehicleAvailabilityCache } =
        await import("@/lib/cache-invalidation");
      const { revalidatePath } = await import("next/cache");

      await Promise.all([
        invalidateBookingCache(bookingId).catch(() => {}),
        invalidateVehicleAvailabilityCache(updatedBooking.vehicleId).catch(() => {}),
      ]);

      revalidatePath("/dashboard");
      revalidatePath("/admin/bookings");
      revalidatePath(`/admin/bookings/${bookingId}`);
      revalidatePath("/admin/dashboard");
    } catch {
      // Ne pas bloquer le webhook
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing checkout session:", error);
    return NextResponse.json({ received: true });
  }
}

/**
 * Envoie l'email de confirmation ou de mise à jour
 */
async function sendEmailForBooking(
  updatedBooking: {
    id: string;
    reference: string;
    status: BookingStatus;
    depositPaid: number | null;
    securityDepositPaid: number | null;
    remainingAmount: number | null;
    totalPrice: number;
    startDate: Date;
    endDate: Date;
    userId: string;
    vehicleId: string;
    pickupLocationId: string;
    returnLocationId: string;
  },
  paymentType: ReturnType<typeof getPaymentTypeFromMetadata>,
  session: Stripe.Checkout.Session,
  amounts: {
    emailDepositPaid: number;
    emailRemainingAmount: number;
    roundedAmountPaid: number;
  }
) {
  try {
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
      // Email de mise à jour pour modification
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

      const modificationInfo = {
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
    } else {
      // Email de confirmation avec PDFs
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
              in: ["agency.name", "agency.address", "agency.phone", "agency.email"],
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
  } catch {
    // Ne pas bloquer le webhook si l'email échoue
  }
}

