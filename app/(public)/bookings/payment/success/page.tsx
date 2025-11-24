import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import { BookingStatus, PaymentStatus } from "@prisma/client";

interface PaymentSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
    booking_id?: string;
  }>;
}

export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { session_id, booking_id } = await searchParams;

  let booking = null;
  let stripeSession: Stripe.Checkout.Session | null = null;
  let actualDepositPaid = 0;
  let actualSecurityDepositPaid = 0;
  let expectedSecurityDeposit = 0; // Montant de la caution attendue (même si pas encore payée)
  let paymentType: "deposit" | "full" | "authorization" = "full";
  let isModificationPayment = false;

  if (session_id) {
    // Récupérer la session Stripe pour obtenir le bookingId et le montant payé
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(session_id);
      
      // Vérifier si la session a expiré ou n'est pas complète
      if (stripeSession.status === "expired") {
        // Rediriger vers une page d'expiration personnalisée
        redirect(`/bookings/payment/expired?session_id=${session_id}&booking_id=${stripeSession.metadata?.bookingId || booking_id || ""}`);
      }
      
      // Si le paiement n'est pas payé mais la session n'est pas expirée, rediriger aussi
      if (stripeSession.payment_status !== "paid" && stripeSession.status !== "complete") {
        redirect(`/bookings/payment/expired?session_id=${session_id}&booking_id=${stripeSession.metadata?.bookingId || booking_id || ""}`);
      }
      
      const bookingIdFromMetadata = stripeSession.metadata?.bookingId;
      paymentType = (stripeSession.metadata?.paymentType as "deposit" | "full" | "authorization") || "full";
      isModificationPayment = stripeSession.metadata?.isModificationPayment === "true";

      if (bookingIdFromMetadata) {
        // Récupérer la réservation avec les paiements associés
        booking = await prisma.booking.findUnique({
          where: { id: bookingIdFromMetadata },
          select: {
            id: true,
            reference: true,
            depositPaid: true,
            securityDepositPaid: true,
            totalPrice: true,
            remainingAmount: true,
            startDate: true,
            endDate: true,
            serviceIds: true,
            status: true,
            vehicle: {
              select: {
                id: true,
                brand: true,
                model: true,
                deposit: true,
              },
            },
            payments: {
              where: {
                status: "COMPLETED",
                method: "STRIPE",
              },
              select: {
                id: true,
                amount: true,
                transactionId: true,
                metadata: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: "desc",
              },
              // Ne pas limiter pour pouvoir filtrer les remboursements
            },
          },
        });

        if (booking) {
          // Calculer les montants attendus depuis la réservation
          const extractTime = (date: Date) => {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
          };

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

          if (priceResult.success && priceResult.data) {
            const { deposit: downPayment, securityDeposit } = priceResult.data;
            expectedSecurityDeposit = securityDeposit; // Stocker le montant de la caution attendue
            const amountPaid = stripeSession.amount_total ? stripeSession.amount_total / 100 : 0;

            // PRIORITÉ 1 : Récupérer le montant depuis la table Payment (source de vérité)
            // ⚠️ IMPORTANT : Filtrer les remboursements (montants négatifs) et les paiements de modification
            if (booking.payments && booking.payments.length > 0) {
              // Filtrer les paiements POSITIFS seulement (exclure les remboursements)
              const positivePayments = booking.payments.filter(p => p.amount > 0);
              
              // Trouver le paiement correspondant à cette session Stripe
              const sessionPayment = positivePayments.find(p => {
                const metadata = p.metadata as { stripeSessionId?: string; stripePaymentIntentId?: string } | null;
                return metadata?.stripeSessionId === session_id || 
                       (stripeSession && metadata?.stripePaymentIntentId === stripeSession.payment_intent);
              });
              
              // Si pas trouvé, prendre le dernier paiement positif
              const latestPayment = sessionPayment || positivePayments[0];
              
              if (latestPayment) {
                const paymentMetadata = latestPayment.metadata as {
                  paymentType?: string;
                  downPayment?: number;
                  securityDeposit?: number;
                  isModificationPayment?: boolean;
                } | null;
                
                isModificationPayment = paymentMetadata?.isModificationPayment === true;
                
                console.log(`[Payment Success] 💳 Récupération du montant depuis la table Payment`, {
                  bookingId: booking.id,
                  paymentId: latestPayment.id,
                  paymentAmount: `${latestPayment.amount.toFixed(2)}€`,
                  paymentType: paymentMetadata?.paymentType || "unknown",
                  isModificationPayment: isModificationPayment,
                  downPaymentInMetadata: paymentMetadata?.downPayment ? `${paymentMetadata.downPayment.toFixed(2)}€` : "N/A",
                  securityDepositInMetadata: paymentMetadata?.securityDeposit ? `${paymentMetadata.securityDeposit.toFixed(2)}€` : "N/A",
                  totalPositivePayments: positivePayments.length,
                  timestamp: new Date().toISOString(),
                });

                // Utiliser les métadonnées du paiement pour déterminer ce qui a été payé
                if (paymentMetadata?.paymentType === "deposit") {
                  // Acompte seulement - le montant dans Payment correspond à l'acompte
                  actualDepositPaid = latestPayment.amount;
                  actualSecurityDepositPaid = 0;
                } else if (paymentMetadata?.paymentType === "authorization") {
                  // Empreinte bancaire - le montant dans Payment correspond à la caution bloquée
                  actualDepositPaid = 0;
                  actualSecurityDepositPaid = latestPayment.amount;
                } else {
                  // Paiement complet - utiliser les métadonnées ou calculer
                  actualDepositPaid = paymentMetadata?.downPayment || downPayment;
                  actualSecurityDepositPaid = paymentMetadata?.securityDeposit || securityDeposit;
                }
              } else {
                console.warn(`[Payment Success] ⚠️ Aucun paiement positif trouvé, utilisation de la session Stripe`, {
                  bookingId: booking.id,
                  totalPayments: booking.payments.length,
                  positivePayments: positivePayments.length,
                  timestamp: new Date().toISOString(),
                });
              }
            } else {
              // PRIORITÉ 2 : Utiliser le montant depuis la session Stripe si pas de Payment enregistré
              console.log(`[Payment Success] ⚠️ Aucun paiement trouvé dans la table Payment, utilisation de la session Stripe`, {
                bookingId: booking.id,
                amountFromStripe: `${amountPaid.toFixed(2)}€`,
                paymentType,
                timestamp: new Date().toISOString(),
              });

              // Déterminer ce qui a été réellement payé selon le type de paiement
              if (paymentType === "deposit") {
                // Acompte seulement
                actualDepositPaid = amountPaid;
                actualSecurityDepositPaid = 0;
              } else if (paymentType === "authorization") {
                // Empreinte bancaire (caution bloquée)
                actualDepositPaid = 0;
                actualSecurityDepositPaid = amountPaid;
              } else {
                // Paiement complet (acompte + caution)
                actualDepositPaid = downPayment;
                actualSecurityDepositPaid = securityDeposit;
              }
            }

            // PRIORITÉ 3 : Vérifier si booking.depositPaid est déjà mis à jour (par le webhook)
            // Si oui, l'utiliser comme source de vérité finale
            if (booking.depositPaid > 0 && paymentType === "deposit") {
              console.log(`[Payment Success] ✅ Utilisation de booking.depositPaid (déjà mis à jour par le webhook)`, {
                bookingId: booking.id,
                depositPaidFromBooking: `${booking.depositPaid.toFixed(2)}€`,
                depositPaidFromPayment: `${actualDepositPaid.toFixed(2)}€`,
                match: booking.depositPaid === actualDepositPaid ? "✅ Oui" : "❌ Non",
                timestamp: new Date().toISOString(),
              });
              // Utiliser booking.depositPaid comme source de vérité si disponible
              actualDepositPaid = booking.depositPaid;
            }

            // Détecter si c'est un paiement de modification
            const isModification = isModificationPayment || 
                                  (booking.payments && booking.payments.length > 0 && 
                                   booking.payments.some(p => {
                                     const metadata = p.metadata as { isModificationPayment?: boolean } | null;
                                     return metadata?.isModificationPayment === true;
                                   }));
            
            // Vérifier si le webhook a déjà traité ce paiement
            // Si un Payment existe pour cette session Stripe, le webhook a été traité
            const webhookProcessed = booking.payments && booking.payments.some(p => {
              const metadata = p.metadata as { stripeSessionId?: string; stripePaymentIntentId?: string } | null;
              return (session_id && metadata?.stripeSessionId === session_id) ||
                     (stripeSession?.payment_intent && metadata?.stripePaymentIntentId === stripeSession.payment_intent);
            });
            
            console.log(`[Payment Success] 🔍 Vérification de la mise à jour nécessaire`, {
              bookingId: booking.id,
              isModificationPayment: isModificationPayment,
              isModification: isModification,
              currentStatus: booking.status,
              depositPaid: booking.depositPaid,
              actualDepositPaid: actualDepositPaid,
              webhookProcessed: webhookProcessed,
              webhookNotProcessed: !webhookProcessed,
              isPending: booking.status === BookingStatus.PENDING,
              timestamp: new Date().toISOString(),
            });
            
            // IMPORTANT: Pour les paiements de modification, on NE MET PAS le statut à CONFIRMED
            // si le webhook n'a pas encore été traité. On attend que le webhook le fasse.
            // On met à jour seulement depositPaid si nécessaire (si webhook pas encore passé)
            
            // Déterminer si une mise à jour est nécessaire
            const needsUpdate = booking.depositPaid === 0 && actualDepositPaid > 0;
            
            console.log(`[Payment Success] 🔍 needsUpdate: ${needsUpdate}`, {
              reason: needsUpdate ? "Webhook pas encore traité (mise à jour depositPaid uniquement)" : "N/A",
              willUpdateStatus: isModification && needsUpdate ? "NON (attendre webhook)" : (needsUpdate && !isModification ? "OUI (paiement normal)" : "N/A"),
              timestamp: new Date().toISOString(),
            });
            
            if (needsUpdate) {
              console.log(`[Payment Success] 🔄 Mise à jour de la réservation depuis la page de succès`, {
                bookingId: booking.id,
                previousDepositPaid: booking.depositPaid,
                newDepositPaid: actualDepositPaid,
                previousStatus: booking.status,
                paymentType,
                isModificationPayment: isModification,
                webhookProcessed: webhookProcessed,
                reason: "Webhook pas encore traité",
                willUpdateStatus: isModification ? "NON (paiement de modification - attendre webhook)" : "OUI (paiement normal)",
                timestamp: new Date().toISOString(),
              });

              const updateData: {
                depositPaid?: number;
                securityDepositPaid?: number;
                remainingAmount: number;
                status?: BookingStatus;
                modificationDepositDifference?: null;
              } = {
                remainingAmount: priceResult.data.remainingAmount,
              };

              if (paymentType === "deposit") {
                updateData.depositPaid = actualDepositPaid;
                // IMPORTANT: Pour les paiements de modification, NE PAS mettre le statut à CONFIRMED
                // Le webhook le fera après validation du paiement
                if (!isModification) {
                  // Pour les paiements normaux, on peut mettre à jour le statut
                  updateData.status = BookingStatus.CONFIRMED;
                }
                // Ne pas nettoyer modificationDepositDifference ici - le webhook le fera
              } else if (paymentType === "authorization") {
                updateData.securityDepositPaid = actualSecurityDepositPaid;
                updateData.status = BookingStatus.PENDING;
              } else {
                updateData.depositPaid = actualDepositPaid;
                updateData.securityDepositPaid = actualSecurityDepositPaid;
                // IMPORTANT: Pour les paiements de modification, NE PAS mettre le statut à CONFIRMED
                // Le webhook le fera après validation du paiement
                if (!isModification) {
                  // Pour les paiements normaux, on peut mettre à jour le statut
                  updateData.status = BookingStatus.CONFIRMED;
                }
                // Ne pas nettoyer modificationDepositDifference ici - le webhook le fera
              }

              await prisma.booking.update({
                where: { id: booking.id },
                data: updateData,
              });

              // CRITIQUE: Créer le paiement si le webhook ne l'a pas fait
              if (!webhookProcessed && session_id && stripeSession) {
                console.log(`[Payment Success] ⚠️  Webhook pas encore traité, création du paiement de secours`, {
                  bookingId: booking.id,
                  sessionId: session_id,
                  amountPaid: stripeSession.amount_total ? (stripeSession.amount_total / 100).toFixed(2) + "€" : "N/A",
                  timestamp: new Date().toISOString(),
                });

                try {
                  // Vérifier si un paiement existe déjà (au cas où)
                  const existingPayment = await prisma.payment.findFirst({
                    where: {
                      transactionId: session_id,
                    },
                  });

                  if (!existingPayment) {
                    // Déterminer le statut du paiement
                    const paymentStatus = paymentType === "authorization" ? PaymentStatus.PENDING : PaymentStatus.COMPLETED;
                    const paymentAmount = stripeSession.amount_total ? stripeSession.amount_total / 100 : 0;

                    // Déterminer les métadonnées
                    let metadataDownPayment: number;
                    let metadataSecurityDeposit: number;

                    if (isModificationPayment) {
                      metadataDownPayment = paymentAmount;
                      metadataSecurityDeposit = 0;
                    } else if (paymentType === "authorization") {
                      metadataDownPayment = 0;
                      metadataSecurityDeposit = actualSecurityDepositPaid;
                    } else if (paymentType === "deposit") {
                      metadataDownPayment = actualDepositPaid;
                      metadataSecurityDeposit = 0;
                    } else {
                      metadataDownPayment = actualDepositPaid;
                      metadataSecurityDeposit = actualSecurityDepositPaid;
                    }

                    const createdPayment = await prisma.payment.create({
                      data: {
                        bookingId: booking.id,
                        userId: session.user.id,
                        amount: paymentAmount,
                        method: "STRIPE",
                        status: paymentStatus,
                        transactionId: session_id,
                        metadata: {
                          stripeSessionId: session_id,
                          stripePaymentIntentId: stripeSession.payment_intent as string | undefined,
                          paymentType: paymentType,
                          isModificationPayment: isModificationPayment,
                          downPayment: metadataDownPayment,
                          securityDeposit: metadataSecurityDeposit,
                          amountPaid: paymentAmount,
                          createdByFallback: true, // Indiquer que c'est une création de secours
                        },
                      },
                    });

                    console.log(`[Payment Success] ✅ Paiement de secours créé avec succès`, {
                      paymentId: createdPayment.id,
                      bookingId: booking.id,
                      amount: `${paymentAmount.toFixed(2)}€`,
                      status: paymentStatus,
                      timestamp: new Date().toISOString(),
                    });
                  } else {
                    console.log(`[Payment Success] ℹ️  Paiement existe déjà, pas de création de secours nécessaire`, {
                      paymentId: existingPayment.id,
                      bookingId: booking.id,
                      timestamp: new Date().toISOString(),
                    });
                  }
                } catch (paymentCreationError) {
                  console.error(`[Payment Success] ❌ Erreur lors de la création du paiement de secours`, {
                    bookingId: booking.id,
                    error: paymentCreationError instanceof Error ? paymentCreationError.message : String(paymentCreationError),
                    timestamp: new Date().toISOString(),
                  });
                  // Ne pas bloquer l'affichage de la page en cas d'erreur
                }
              }

              // CRITIQUE: Si le webhook n'a pas été traité, déclencher TOUS les workflows manquants
              const finalPaymentStatus = paymentType === "authorization" ? PaymentStatus.PENDING : PaymentStatus.COMPLETED;
              
              if (!webhookProcessed && booking && booking.status === BookingStatus.CONFIRMED && !isModification) {
                console.log(`[Payment Success] ⚠️  Webhook non traité, déclenchement de tous les workflows manquants`, {
                  bookingId: booking.id,
                  reference: booking.reference,
                  currentStatus: booking.status,
                  isModification,
                  webhookProcessed,
                  timestamp: new Date().toISOString(),
                });

                try {
                  // 1. Créer la facture si elle n'existe pas
                  console.log(`[Payment Success] 🔍 Vérification de l'existence de la facture...`, {
                    bookingId: booking.id,
                    timestamp: new Date().toISOString(),
                  });

                  const existingInvoice = await prisma.invoice.findFirst({
                    where: { bookingId: booking.id },
                    select: { id: true, invoiceNumber: true },
                  });

                  if (!existingInvoice) {
                    console.log(`[Payment Success] 📋 Création de la facture (webhook non traité)`, {
                      bookingId: booking.id,
                      timestamp: new Date().toISOString(),
                    });

                    const { createInvoiceForBooking } = await import("@/lib/invoice-creation");
                    const invoiceResult = await createInvoiceForBooking(booking.id);

                    if (invoiceResult.success) {
                      console.log(`[Payment Success] ✅ Facture créée avec succès`, {
                        bookingId: booking.id,
                        invoiceId: invoiceResult.invoiceId,
                        timestamp: new Date().toISOString(),
                      });
                    } else {
                      console.warn(`[Payment Success] ⚠️  Impossible de créer la facture`, {
                        bookingId: booking.id,
                        error: invoiceResult.error,
                        timestamp: new Date().toISOString(),
                      });
                    }
                  } else {
                    console.log(`[Payment Success] ✅ Facture déjà existante`, {
                      bookingId: booking.id,
                      invoiceId: existingInvoice.id,
                      invoiceNumber: existingInvoice.invoiceNumber,
                      timestamp: new Date().toISOString(),
                    });
                  }

                  // 2. Mettre à jour le statut des factures
                  console.log(`[Payment Success] 🔍 Recherche du paiement pour mise à jour des factures...`, {
                    bookingId: booking.id,
                    sessionId: session_id,
                    paymentStatus: finalPaymentStatus,
                    timestamp: new Date().toISOString(),
                  });

                  const paymentRecord = await prisma.payment.findFirst({
                    where: { transactionId: session_id || "" },
                    select: { id: true, amount: true, status: true },
                  });

                  if (paymentRecord) {
                    console.log(`[Payment Success] ✅ Paiement trouvé pour mise à jour des factures`, {
                      paymentId: paymentRecord.id,
                      amount: paymentRecord.amount,
                      status: paymentRecord.status,
                      timestamp: new Date().toISOString(),
                    });
                  } else {
                    console.warn(`[Payment Success] ⚠️  Paiement non trouvé pour la mise à jour des factures`, {
                      sessionId: session_id,
                      timestamp: new Date().toISOString(),
                    });
                  }

                  if (paymentRecord && finalPaymentStatus === PaymentStatus.COMPLETED) {
                    const { updateInvoiceStatusAfterPayment } = await import("@/lib/invoice-status-update");
                    await updateInvoiceStatusAfterPayment(
                      booking.id,
                      paymentRecord.id,
                      paymentRecord.amount
                    );
                    console.log(`[Payment Success] ✅ Statut des factures mis à jour`, {
                      bookingId: booking.id,
                      timestamp: new Date().toISOString(),
                    });
                  }

                  // 3. Envoyer l'email de confirmation avec PDFs (en arrière-plan, ne pas bloquer)
                  console.log(`[Payment Success] 📧 Démarrage de l'envoi de l'email avec PDFs (workflow de secours)`, {
                    bookingId: booking.id,
                    reference: booking.reference,
                    timestamp: new Date().toISOString(),
                  });

                  Promise.resolve().then(async () => {
                    try {
                      const { sendBookingConfirmationEmail } = await import("@/lib/email");
                      const { generateInvoicePDFAction } = await import("@/actions/admin/invoices/generate-pdf");
                      const { generateBookingPDF } = await import("@/lib/booking-pdf");
                      const { createDefaultAdminSettings } = await import("@/actions/admin/settings/shared");
                      const { format } = await import("date-fns");
                      const { fr } = await import("date-fns/locale");

                      console.log(`[Payment Success] 🔍 Récupération des données pour l'email...`, {
                        bookingId: booking.id,
                        timestamp: new Date().toISOString(),
                      });

                      // Récupérer toutes les données nécessaires
                      const [userData, vehicleData, pickupLocData, returnLocData, bookingWithServices] = await Promise.all([
                        prisma.user.findUnique({
                          where: { id: booking.userId || session.user.id },
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

                      console.log(`[Payment Success] ✅ Données récupérées pour l'email`, {
                        bookingId: booking.id,
                        userFound: !!userData,
                        vehicleFound: !!vehicleData,
                        pickupLocFound: !!pickupLocData,
                        returnLocFound: !!returnLocData,
                        bookingWithServicesFound: !!bookingWithServices,
                        timestamp: new Date().toISOString(),
                      });

                      if (userData && vehicleData && pickupLocData && returnLocData && bookingWithServices) {
                        const attachments: Array<{ filename: string; content: Buffer; contentType?: string }> = [];

                        // Générer PDF de réservation
                        const services = bookingWithServices.serviceIds && bookingWithServices.serviceIds.length > 0
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
                          name: typeof agencyName === "string" ? agencyName : (defaultSettings.agency.name || "CarRental"),
                          address: typeof agencyAddress === "string" ? agencyAddress : (defaultSettings.agency.address || "123 Avenue de la Liberté, 75000 Paris"),
                          phone: typeof agencyPhone === "string" ? agencyPhone : (defaultSettings.agency.phone || "+33 1 23 45 67 89"),
                          email: typeof agencyEmail === "string" ? agencyEmail : (defaultSettings.agency.email || "contact@carrental.com"),
                        };

                        console.log(`[Payment Success] 📄 Génération des PDFs pour l'email...`, {
                          bookingId: booking.id,
                          timestamp: new Date().toISOString(),
                        });

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

                          console.log(`[Payment Success] ✅ PDF de réservation généré`, {
                            bookingId: booking.id,
                            filename: `Reservation_${booking.reference}.pdf`,
                            timestamp: new Date().toISOString(),
                          });

                          // Générer PDF de facture si elle existe
                          const invoice = await prisma.invoice.findFirst({
                            where: { bookingId: booking.id },
                            select: { id: true },
                          });

                          if (invoice) {
                            console.log(`[Payment Success] 📄 Génération du PDF de facture...`, {
                              bookingId: booking.id,
                              invoiceId: invoice.id,
                              timestamp: new Date().toISOString(),
                            });

                            const invoicePdfResult = await generateInvoicePDFAction(invoice.id);
                            if (invoicePdfResult.success && invoicePdfResult.data?.pdfBuffer) {
                              attachments.push({
                                filename: `Facture_${booking.reference}.pdf`,
                                content: invoicePdfResult.data.pdfBuffer,
                                contentType: "application/pdf",
                              });
                              console.log(`[Payment Success] ✅ PDF de facture généré`, {
                                bookingId: booking.id,
                                filename: `Facture_${booking.reference}.pdf`,
                                timestamp: new Date().toISOString(),
                              });
                            } else {
                              console.warn(`[Payment Success] ⚠️  Impossible de générer le PDF de facture`, {
                                bookingId: booking.id,
                                invoiceId: invoice.id,
                                error: invoicePdfResult.error,
                                timestamp: new Date().toISOString(),
                              });
                            }
                          } else {
                            console.log(`[Payment Success] ℹ️  Aucune facture trouvée pour générer le PDF`, {
                              bookingId: booking.id,
                              timestamp: new Date().toISOString(),
                            });
                          }
                        } catch (pdfError) {
                          console.error(`[Payment Success] ❌ Erreur lors de la génération des PDFs`, {
                            bookingId: booking.id,
                            error: pdfError instanceof Error ? pdfError.message : String(pdfError),
                            timestamp: new Date().toISOString(),
                          });
                        }

                        console.log(`[Payment Success] 📧 Envoi de l'email avec ${attachments.length} pièce(s) jointe(s)...`, {
                          bookingId: booking.id,
                          attachmentsCount: attachments.length,
                          attachments: attachments.map(a => a.filename),
                          timestamp: new Date().toISOString(),
                        });

                        // Envoyer l'email
                        const bookingPeriod = `${format(booking.startDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })} → ${format(booking.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;
                        const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";

                        const emailResult = await sendBookingConfirmationEmail({
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

                        if (emailResult.success) {
                          console.log(`[Payment Success] ✅ Email de confirmation envoyé avec PDFs (workflow de secours)`, {
                            bookingId: booking.id,
                            messageId: emailResult.messageId,
                            attachmentsCount: attachments.length,
                            timestamp: new Date().toISOString(),
                          });
                        } else {
                          console.error(`[Payment Success] ❌ Échec de l'envoi de l'email (workflow de secours)`, {
                            bookingId: booking.id,
                            error: emailResult.error,
                            timestamp: new Date().toISOString(),
                          });
                        }
                      }
                    } catch (emailWorkflowError) {
                      console.error(`[Payment Success] ❌ Erreur lors de l'exécution du workflow email (secours)`, {
                        bookingId: booking.id,
                        error: emailWorkflowError instanceof Error ? emailWorkflowError.message : String(emailWorkflowError),
                        timestamp: new Date().toISOString(),
                      });
                    }
                  }).catch(() => {
                    // Ignorer les erreurs pour ne pas bloquer la page
                  });
                } catch (workflowError) {
                  console.error(`[Payment Success] ❌ Erreur lors de l'exécution des workflows de secours`, {
                    bookingId: booking.id,
                    error: workflowError instanceof Error ? workflowError.message : String(workflowError),
                    timestamp: new Date().toISOString(),
                  });
                }
              }

              // Recharger la réservation mise à jour
              booking = await prisma.booking.findUnique({
                where: { id: booking.id },
                select: {
                  id: true,
                  reference: true,
                  depositPaid: true,
                  securityDepositPaid: true,
                  totalPrice: true,
                  remainingAmount: true,
                  status: true,
                  vehicle: {
                    select: {
                      brand: true,
                      model: true,
                      deposit: true,
                    },
                  },
                },
              });
              
              console.log(`[Payment Success] ✅ Mise à jour effectuée`, {
                bookingId: booking?.id,
                newDepositPaid: booking?.depositPaid,
                newStatus: booking?.status,
                isModificationPayment: isModification,
                statusUpdated: !isModification,
                statusWillBeUpdatedByWebhook: isModification,
                timestamp: new Date().toISOString(),
              });
            } else {
              // Le webhook a déjà mis à jour la réservation
              // Pour les paiements de modification, vérifier si le webhook a mis le statut à CONFIRMED
              // Si oui, tout est bon. Si non (statut encore PENDING), on attend que le webhook le fasse.
              
              if (isModification && booking && booking.status === BookingStatus.PENDING && webhookProcessed) {
                // Le webhook a été traité mais le statut est encore PENDING
                // Cela peut arriver si le webhook n'a pas encore mis à jour le statut
                // Dans ce cas, on peut vérifier si on doit attendre ou si on peut mettre à jour
                // Mais en principe, on attend que le webhook termine son traitement
                console.log(`[Payment Success] ⏳ Paiement de modification: webhook traité mais statut encore PENDING`, {
                  bookingId: booking.id,
                  currentStatus: booking.status,
                  depositPaid: booking.depositPaid,
                  note: "Le statut sera mis à jour par le webhook. Si cela persiste, vérifier les logs du webhook.",
                  timestamp: new Date().toISOString(),
                });
              }
              
              // Utiliser les valeurs de la réservation déjà mises à jour par le webhook
              if (booking) {
                actualDepositPaid = booking.depositPaid;
                actualSecurityDepositPaid = booking.securityDepositPaid || 0;
                console.log(`[Payment Success] ✅ Utilisation des valeurs mises à jour par le webhook`, {
                  bookingId: booking.id,
                  depositPaid: `${actualDepositPaid.toFixed(2)}€`,
                  securityDepositPaid: `${actualSecurityDepositPaid.toFixed(2)}€`,
                  status: booking.status,
                  isModificationPayment: isModification,
                  timestamp: new Date().toISOString(),
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("[Payment Success] Erreur lors de la récupération de la session Stripe:", error);
    }
  } else if (booking_id) {
    // Récupérer la réservation avec les paiements associés
    booking = await prisma.booking.findUnique({
      where: { id: booking_id },
      select: {
        id: true,
        reference: true,
        depositPaid: true,
        securityDepositPaid: true,
        totalPrice: true,
        remainingAmount: true,
        vehicle: {
          select: {
            brand: true,
            model: true,
            deposit: true,
          },
        },
        payments: {
          where: {
            status: "COMPLETED",
            method: "STRIPE",
          },
          select: {
            id: true,
            amount: true,
            transactionId: true,
            metadata: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Prendre le paiement le plus récent
        },
      },
    });

    if (booking) {
      // Calculer le montant de la caution attendue depuis le véhicule
      if (booking.vehicle.deposit) {
        expectedSecurityDeposit = booking.vehicle.deposit;
      }

      // PRIORITÉ : Utiliser le montant depuis la table Payment si disponible
      if (booking.payments && booking.payments.length > 0) {
        const latestPayment = booking.payments[0];
        const paymentMetadata = latestPayment.metadata as {
          paymentType?: string;
          downPayment?: number;
          securityDeposit?: number;
        } | null;
        
        console.log(`[Payment Success] 💳 Récupération depuis booking_id avec Payment`, {
          bookingId: booking.id,
          paymentId: latestPayment.id,
          paymentAmount: `${latestPayment.amount.toFixed(2)}€`,
          paymentType: paymentMetadata?.paymentType || "unknown",
          bookingDepositPaid: `${booking.depositPaid.toFixed(2)}€`,
          timestamp: new Date().toISOString(),
        });

        // Si c'est un paiement d'acompte, utiliser le montant du Payment
        if (paymentMetadata?.paymentType === "deposit") {
          actualDepositPaid = latestPayment.amount;
          // La caution n'a pas été payée, utiliser le montant attendu depuis les métadonnées ou le véhicule
          expectedSecurityDeposit = paymentMetadata?.securityDeposit || booking.vehicle.deposit || 0;
        } else {
          actualDepositPaid = booking.depositPaid;
        }
      } else {
        // Fallback sur booking.depositPaid si pas de Payment trouvé
        actualDepositPaid = booking.depositPaid;
      }
      actualSecurityDepositPaid = booking.securityDepositPaid || 0;
    }
  }

  if (!booking) {
    redirect("/dashboard");
  }

  // Détecter si c'est un paiement supplémentaire de modification
  const modificationMetadata = isModificationPayment && stripeSession?.metadata ? {
    originalTotalPrice: stripeSession.metadata.originalTotalPrice ? parseFloat(stripeSession.metadata.originalTotalPrice) : null,
    originalDepositPaid: stripeSession.metadata.originalDepositPaid ? parseFloat(stripeSession.metadata.originalDepositPaid) : null,
    originalRemainingAmount: stripeSession.metadata.originalRemainingAmount ? parseFloat(stripeSession.metadata.originalRemainingAmount) : null,
    depositDifference: stripeSession.metadata.depositDifference ? parseFloat(stripeSession.metadata.depositDifference) : null,
    securityDepositPaid: stripeSession.metadata.securityDepositPaid ? parseFloat(stripeSession.metadata.securityDepositPaid) : 0,
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-2 border-green-200 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-green-50 to-green-100 pb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              {isModificationPayment ? "Paiement supplémentaire confirmé !" : "Paiement confirmé !"}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {isModificationPayment 
                ? "Votre paiement supplémentaire pour la modification a été effectué avec succès"
                : "Votre réservation a été confirmée avec succès"}
            </p>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Référence de réservation</p>
              <p className="text-2xl font-bold text-primary font-mono">{booking.reference}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Véhicule</span>
                <span className="font-semibold">
                  {booking.vehicle.brand} {booking.vehicle.model}
                </span>
              </div>
              
              {/* Afficher les informations de modification si c'est un paiement supplémentaire */}
              {isModificationPayment && modificationMetadata && modificationMetadata.originalTotalPrice != null && (
                <div className="border-t pt-3 mt-3 space-y-2">
                  <p className="text-sm font-semibold text-amber-700 mb-2">📊 Comparaison des prix</p>
                  <div className="bg-white rounded p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prix original :</span>
                      <span>{modificationMetadata.originalTotalPrice.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nouveau prix :</span>
                      <span className="font-semibold">{booking.totalPrice.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Différence :</span>
                      <span className={`font-semibold ${(booking.totalPrice - modificationMetadata.originalTotalPrice) >= 0 ? "text-red-600" : "text-green-600"}`}>
                        {(booking.totalPrice - modificationMetadata.originalTotalPrice) >= 0 ? "+" : ""}
                        {(booking.totalPrice - modificationMetadata.originalTotalPrice).toFixed(2)}€
                      </span>
                    </div>
                  </div>
                  {modificationMetadata.originalDepositPaid != null && (
                    <div className="bg-white rounded p-3 space-y-2 text-sm mt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Acompte original :</span>
                        <span>{modificationMetadata.originalDepositPaid.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nouvel acompte :</span>
                        <span className="font-semibold">{booking.depositPaid.toFixed(2)}€</span>
                      </div>
                      {modificationMetadata.depositDifference != null && (
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">Paiement supplémentaire :</span>
                          <span className="font-semibold text-green-600">
                            +{modificationMetadata.depositDifference.toFixed(2)}€
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {actualDepositPaid > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {isModificationPayment ? "Acompte total payé (30%)" : "Acompte payé (30%)"}
                  </span>
                  <span className="font-semibold text-green-600">
                    {actualDepositPaid.toFixed(2)}€
                  </span>
                </div>
              )}
              {/* Afficher la caution selon le type de paiement :
                  - Si empreinte (authorization) : "bloquée"
                  - Si paiement complet (full) : "payée"
                  - Si acompte seulement (deposit) : "sera bloquée plus tard" */}
              {expectedSecurityDeposit > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {paymentType === "authorization" 
                      ? "Caution de garantie (bloquée)"
                      : actualSecurityDepositPaid > 0
                      ? "Caution de garantie payée"
                      : "Caution de garantie (sera bloquée plus tard)"}
                  </span>
                  <span className="font-semibold text-amber-600">
                    {expectedSecurityDeposit.toFixed(2)}€
                  </span>
                </div>
              )}
              {booking.remainingAmount > 0 && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Solde à la remise</span>
                  <span className="font-semibold">{booking.remainingAmount.toFixed(2)}€</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-semibold">Total de la location</span>
                <span className="font-bold text-lg">{booking.totalPrice.toFixed(2)}€</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Prochaines étapes :</strong>
                <br />
                {isModificationPayment 
                  ? "Vous allez recevoir un email de mise à jour avec les détails de votre paiement supplémentaire dans quelques instants."
                  : "Vous allez recevoir un email de confirmation dans quelques instants."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="flex-1" variant="outline">
                <Link href="/dashboard">
                  Retour au tableau de bord
                </Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href={`/bookings/${booking.id}`}>
                  Voir ma réservation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
