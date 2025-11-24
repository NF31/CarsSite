import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Stripe from "stripe";
import { BookingStatus, Prisma, PaymentStatus } from "@prisma/client";
import { calculateBookingPriceAction } from "@/actions/public/bookings/calculate-price";
import { sendBookingConfirmationEmail, sendBookingUpdateEmail } from "@/lib/email";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { updateInvoiceStatusAfterPayment } from "@/lib/invoice-status-update";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    console.log(`[Stripe Webhook] Received event: ${event.type}`, {
      eventId: event.id,
      sessionId: event.data.object && "id" in event.data.object ? event.data.object.id : "N/A",
    });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log(`[Stripe Webhook] 🔔 Event checkout.session.completed reçu`, {
        eventId: event.id,
        sessionId: session.id,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total ? `${(session.amount_total / 100).toFixed(2)}€` : "N/A",
        currency: session.currency?.toUpperCase() || "EUR",
        customerEmail: session.customer_email || "N/A",
        metadata: session.metadata,
        timestamp: new Date().toISOString(),
      });

      const bookingId = session.metadata?.bookingId;
      const userId = session.metadata?.userId;

      if (!bookingId || !userId) {
        console.error("[Stripe Webhook] ❌ Métadonnées manquantes dans la session Stripe", {
          sessionId: session.id,
          metadata: session.metadata,
          expectedFields: ["bookingId", "userId"],
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json({ received: true });
      }

      console.log(`[Stripe Webhook] 📋 Début du traitement du paiement`, {
        bookingId,
        userId,
        sessionId: session.id,
        amountTotal: session.amount_total ? `${(session.amount_total / 100).toFixed(2)}€` : "0.00€",
        timestamp: new Date().toISOString(),
      });

      // Récupérer la réservation
      console.log(`[Stripe Webhook] 🔍 Récupération de la réservation depuis la base de données`, {
        bookingId,
        timestamp: new Date().toISOString(),
      });

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
          modificationDepositDifference: true, // Pour détecter les paiements de modification
          originalStartDate: true, // Pour vérifier si c'est une modification
          originalEndDate: true, // Pour vérifier si c'est une modification
          originalTotalPrice: true, // Pour les emails de modification
          originalDepositPaid: true, // Pour les emails de modification
          vehicle: {
            select: {
              id: true,
              deposit: true,
            },
          },
        },
      });

      if (!booking || booking.userId !== userId) {
        console.error("[Stripe Webhook] ❌ Réservation introuvable ou utilisateur non correspondant", {
          bookingId,
          userId,
          bookingFound: !!booking,
          bookingUserId: booking?.userId || "N/A",
          expectedUserId: userId,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json({ received: true });
      }

      console.log(`[Stripe Webhook] ✅ Réservation trouvée`, {
        bookingId: booking.id,
        reference: bookingId,
        currentStatus: booking.status,
        currentDepositPaid: `${(booking.depositPaid || 0).toFixed(2)}€`,
        totalPrice: `${booking.totalPrice.toFixed(2)}€`,
        vehicleId: booking.vehicle.id,
        vehicleDeposit: `${(booking.vehicle.deposit || 0).toFixed(2)}€`,
        serviceIds: booking.serviceIds.length > 0 ? booking.serviceIds : "Aucun service",
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        timestamp: new Date().toISOString(),
      });

      // Calculer le montant de l'acompte et de la caution
      console.log(`[Stripe Webhook] 💰 Calcul du prix de la réservation`, {
        bookingId,
        vehicleId: booking.vehicle.id,
        serviceIds: booking.serviceIds,
        timestamp: new Date().toISOString(),
      });

      const priceResult = await calculateBookingPriceAction({
        vehicleId: booking.vehicle.id,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        startTime: "10:00", // Valeur par défaut
        endTime: "10:00", // Valeur par défaut
        serviceIds: booking.serviceIds,
      });

      if (!priceResult.success || !priceResult.data) {
        console.error("[Stripe Webhook] ❌ Échec du calcul du prix pour la réservation", {
          bookingId,
          error: priceResult.error || "Erreur inconnue",
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json({ received: true });
      }

      console.log(`[Stripe Webhook] ✅ Calcul du prix réussi`, {
        bookingId,
        priceBreakdown: {
          vehiclePrice: `${priceResult.data.vehiclePrice.toFixed(2)}€`,
          servicesPrice: `${priceResult.data.servicesPrice.toFixed(2)}€`,
          totalPrice: `${priceResult.data.totalPrice.toFixed(2)}€`,
          downPayment: `${priceResult.data.deposit.toFixed(2)}€ (30%)`,
          securityDeposit: `${priceResult.data.securityDeposit.toFixed(2)}€`,
          remainingAmount: `${priceResult.data.remainingAmount.toFixed(2)}€`,
          numberOfDays: priceResult.data.numberOfDays.toFixed(2),
        },
        timestamp: new Date().toISOString(),
      });

      const { deposit: downPayment, securityDeposit } = priceResult.data;
      
      // Récupérer le type de paiement depuis les métadonnées
      const paymentType = session.metadata?.paymentType || "full";
      const isAuthorization = paymentType === "authorization";
      const isDepositOnly = paymentType === "deposit";
      // Vérifier isModificationPayment depuis les métadonnées OU depuis modificationDepositDifference dans la DB
      // (vérification de secours au cas où les métadonnées ne seraient pas présentes)
      const hasModificationDepositDifference = (booking.modificationDepositDifference ?? 0) > 0;
      const metadataIsModification = session.metadata?.isModificationPayment === "true" || 
                                      session.metadata?.isModificationPayment === "1";
      const isModificationPayment = metadataIsModification || hasModificationDepositDifference;
      
      console.log(`[Stripe Webhook] 🔍 Détection du type de paiement`, {
        bookingId,
        paymentType,
        isAuthorization,
        isDepositOnly,
        isModificationPayment,
        hasModificationDepositDifference,
        modificationDepositDifference: booking.modificationDepositDifference,
        metadataIsModificationPayment: session.metadata?.isModificationPayment,
        metadataIsModificationRaw: metadataIsModification,
        metadata: session.metadata,
        timestamp: new Date().toISOString(),
      });
      
      // Vérification critique pour les paiements de modification
      if (hasModificationDepositDifference || metadataIsModification) {
        console.log(`[Stripe Webhook] ⚠️  PAIEMENT DE MODIFICATION DÉTECTÉ - Le statut DOIT passer à CONFIRMED`, {
          bookingId,
          hasModificationDepositDifference,
          modificationDepositDifference: booking.modificationDepositDifference,
          metadataIsModification,
          metadataValue: session.metadata?.isModificationPayment,
          currentStatus: booking.status,
          expectedStatus: BookingStatus.CONFIRMED,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Récupérer l'acompte actuel de la réservation pour les paiements supplémentaires
      const currentDepositPaid = booking.depositPaid || 0;
      const currentSecurityDepositPaid = booking.securityDepositPaid || 0;

      // Arrondir les montants à 2 décimales pour éviter les problèmes de précision
      const roundedDownPayment = Math.round(downPayment * 100) / 100;
      const roundedSecurityDeposit = Math.round(securityDeposit * 100) / 100;
      const roundedRemainingAmount = Math.round(priceResult.data.remainingAmount * 100) / 100;

      // Vérifier que le montant payé correspond
      const amountPaid = session.amount_total ? session.amount_total / 100 : 0; // Convertir de centimes en euros
      const roundedAmountPaid = Math.round(amountPaid * 100) / 100;

      // Déterminer le montant attendu selon le type de paiement
      let expectedAmount: number;
      if (isModificationPayment) {
        // Pour un paiement supplémentaire de modification, le montant attendu est juste la différence
        // Le montant payé est la différence d'acompte (ex: 85,50€)
        // On ne vérifie pas contre le nouvel acompte total, mais contre le montant réellement payé
        expectedAmount = roundedAmountPaid; // Le montant payé est toujours correct pour une modification
        console.log(`[Stripe Webhook] 🔄 Paiement supplémentaire de modification détecté`, {
          bookingId,
          currentDepositPaid: `${currentDepositPaid.toFixed(2)}€`,
          amountPaid: `${roundedAmountPaid.toFixed(2)}€`,
          newDepositPaid: `${(currentDepositPaid + roundedAmountPaid).toFixed(2)}€`,
          timestamp: new Date().toISOString(),
        });
      } else if (isAuthorization) {
        // Pour l'empreinte, on attend seulement la caution
        expectedAmount = roundedSecurityDeposit;
      } else if (isDepositOnly) {
        // Pour l'acompte seulement, on attend l'acompte
        expectedAmount = roundedDownPayment;
      } else {
        // Pour le paiement complet, on attend acompte + caution
        expectedAmount = roundedDownPayment + roundedSecurityDeposit;
      }

      console.log(`[Stripe Webhook] 🔢 Vérification des montants`, {
        bookingId,
        paymentType,
        amounts: {
          expected: `${expectedAmount.toFixed(2)}€`,
          receivedFromStripe: `${roundedAmountPaid.toFixed(2)}€`,
          difference: `${Math.abs(roundedAmountPaid - expectedAmount).toFixed(2)}€`,
        },
        breakdown: {
          downPayment: `${roundedDownPayment.toFixed(2)}€`,
          securityDeposit: `${roundedSecurityDeposit.toFixed(2)}€`,
          remainingAmount: `${roundedRemainingAmount.toFixed(2)}€`,
        },
        timestamp: new Date().toISOString(),
      });

      if (Math.abs(roundedAmountPaid - expectedAmount) > 0.01) {
        console.warn(`[Stripe Webhook] ⚠️  Écart de montant détecté pour la réservation ${bookingId}`, {
          bookingId,
          paymentType,
          expected: `${expectedAmount.toFixed(2)}€`,
          received: `${roundedAmountPaid.toFixed(2)}€`,
          difference: `${Math.abs(roundedAmountPaid - expectedAmount).toFixed(2)}€`,
          threshold: "0.01€",
          timestamp: new Date().toISOString(),
        });
      } else {
        console.log(`[Stripe Webhook] ✅ Montants correspondants`, {
          bookingId,
          paymentType,
          amountPaid: `${roundedAmountPaid.toFixed(2)}€`,
          timestamp: new Date().toISOString(),
        });
      }

      // Mettre à jour la réservation selon le type de paiement
      let updateData: Prisma.BookingUpdateInput = {
        remainingAmount: roundedRemainingAmount, // Le solde restant à payer à la remise
      };

      if (isModificationPayment) {
        // Pour un paiement supplémentaire de modification :
        // - Le montant payé est juste la différence d'acompte (ex: 85,50€)
        // - On ajoute ce montant à l'acompte existant
        // - La caution reste inchangée si elle a déjà été payée
        // - Le solde restant est recalculé avec le nouvel acompte
        // - Nettoyer modificationDepositDifference car le paiement est maintenant effectué
        const newDepositPaid = Math.round((currentDepositPaid + roundedAmountPaid) * 100) / 100;
        const newRemainingAmount = Math.round((booking.totalPrice - newDepositPaid) * 100) / 100;
        
        updateData = {
          depositPaid: newDepositPaid, // Ancien acompte + différence payée
          securityDepositPaid: currentSecurityDepositPaid, // PRÉSERVÉ (déjà payée)
          remainingAmount: newRemainingAmount,
          status: BookingStatus.CONFIRMED, // Confirmation automatique après paiement réussi
          modificationDepositDifference: null, // Nettoyer car le paiement est maintenant effectué
          // Nettoyer les dates originales maintenant que le paiement est reçu
          originalStartDate: null,
          originalEndDate: null,
          originalTotalPrice: null,
          originalDepositPaid: null,
        };
        
        console.log(`[Stripe Webhook] 📝 Mise à jour de la réservation (paiement supplémentaire de modification)`, {
          bookingId,
          updates: {
            previousStatus: booking.status,
            newStatus: BookingStatus.CONFIRMED,
            previousDepositPaid: `${currentDepositPaid.toFixed(2)}€`,
            amountPaid: `${roundedAmountPaid.toFixed(2)}€`,
            newDepositPaid: `${newDepositPaid.toFixed(2)}€`,
            securityDepositPaid: `${currentSecurityDepositPaid.toFixed(2)}€ (préservé)`,
            previousRemainingAmount: `${(booking.remainingAmount || 0).toFixed(2)}€`,
            newRemainingAmount: `${newRemainingAmount.toFixed(2)}€`,
            totalPrice: `${booking.totalPrice.toFixed(2)}€`,
          },
          timestamp: new Date().toISOString(),
        });
      } else if (isAuthorization) {
        // Pour l'empreinte bancaire : on ne met à jour que securityDepositPaid (bloqué, pas payé)
        // Le statut reste PENDING jusqu'à confirmation manuelle
        updateData = {
          ...updateData,
          securityDepositPaid: roundedSecurityDeposit,
          status: BookingStatus.PENDING, // Reste en attente, pas de confirmation automatique
        };
        console.log(`[Stripe Webhook] 📝 Mise à jour de la réservation (empreinte bancaire)`, {
          bookingId,
          updates: {
            previousStatus: booking.status,
            newStatus: BookingStatus.PENDING,
            securityDepositPaid: `${roundedSecurityDeposit.toFixed(2)}€ (bloqué)`,
            remainingAmount: `${roundedRemainingAmount.toFixed(2)}€`,
            note: "Aucun débit effectué, juste blocage de la caution",
          },
          timestamp: new Date().toISOString(),
        });
      } else if (isDepositOnly) {
        // Pour l'acompte seulement : on met à jour depositPaid
        updateData = {
          ...updateData,
          depositPaid: roundedDownPayment,
          status: BookingStatus.CONFIRMED, // Confirmation automatique après paiement de l'acompte
        };
        console.log(`[Stripe Webhook] 📝 Mise à jour de la réservation (acompte seulement)`, {
          bookingId,
          updates: {
            previousStatus: booking.status,
            newStatus: BookingStatus.CONFIRMED,
            previousDepositPaid: `${(booking.depositPaid || 0).toFixed(2)}€`,
            newDepositPaid: `${roundedDownPayment.toFixed(2)}€`,
            remainingAmount: `${roundedRemainingAmount.toFixed(2)}€`,
            note: "Caution sera bloquée lors de la confirmation",
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        // Pour le paiement complet : on met à jour depositPaid ET securityDepositPaid
        updateData = {
          ...updateData,
          depositPaid: roundedDownPayment,
          securityDepositPaid: roundedSecurityDeposit,
          status: BookingStatus.CONFIRMED, // Confirmation automatique après paiement réussi
        };
        console.log(`[Stripe Webhook] 📝 Mise à jour de la réservation (paiement complet)`, {
          bookingId,
          updates: {
            previousStatus: booking.status,
            newStatus: BookingStatus.CONFIRMED,
            previousDepositPaid: `${(booking.depositPaid || 0).toFixed(2)}€`,
            newDepositPaid: `${roundedDownPayment.toFixed(2)}€`,
            securityDepositPaid: `${roundedSecurityDeposit.toFixed(2)}€`,
            remainingAmount: `${roundedRemainingAmount.toFixed(2)}€`,
          },
          timestamp: new Date().toISOString(),
        });
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

      console.log(`[Stripe Webhook] ✅ Réservation mise à jour avec succès`, {
        bookingId: updatedBooking.id,
        reference: updatedBooking.reference,
        status: updatedBooking.status,
        depositPaid: `${(updatedBooking.depositPaid || 0).toFixed(2)}€`,
        securityDepositPaid: `${(updatedBooking.securityDepositPaid || 0).toFixed(2)}€`,
        remainingAmount: `${(updatedBooking.remainingAmount || 0).toFixed(2)}€`,
        isModificationPayment,
        timestamp: new Date().toISOString(),
      });

      // Créer automatiquement une facture si la réservation est confirmée
      if (updatedBooking.status === BookingStatus.CONFIRMED && !isModificationPayment) {
        console.log(`[Stripe Webhook] 📋 Création automatique de facture pour la réservation ${bookingId}`, {
          bookingId: updatedBooking.id,
          reference: updatedBooking.reference,
          status: updatedBooking.status,
          timestamp: new Date().toISOString(),
        });

        try {
          const { createInvoiceForBooking } = await import("@/lib/invoice-creation");
          const invoiceResult = await createInvoiceForBooking(bookingId);

          if (invoiceResult.success) {
            console.log(`[Stripe Webhook] ✅ Facture créée automatiquement pour la réservation ${bookingId}`, {
              bookingId: updatedBooking.id,
              invoiceId: invoiceResult.invoiceId,
              timestamp: new Date().toISOString(),
            });
          } else {
            console.warn(`[Stripe Webhook] ⚠️  Impossible de créer la facture automatiquement pour la réservation ${bookingId}`, {
              bookingId: updatedBooking.id,
              error: invoiceResult.error,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (invoiceCreationError) {
          console.error(`[Stripe Webhook] ❌ Erreur lors de la création automatique de la facture`, {
            bookingId: updatedBooking.id,
            error: invoiceCreationError instanceof Error ? invoiceCreationError.message : String(invoiceCreationError),
            timestamp: new Date().toISOString(),
          });
          // Ne pas bloquer le webhook en cas d'erreur de création de facture
        }
      }
      
      // VÉRIFICATION CRITIQUE : Pour les paiements de modification, le statut DOIT être CONFIRMED
      // Si ce n'est pas le cas, forcer la mise à jour
      if (isModificationPayment && updatedBooking.status !== BookingStatus.CONFIRMED) {
        console.error(`[Stripe Webhook] ❌ ERREUR CRITIQUE: Paiement de modification mais statut n'est pas CONFIRMED !`, {
          bookingId: updatedBooking.id,
          reference: updatedBooking.reference,
          currentStatus: updatedBooking.status,
          expectedStatus: BookingStatus.CONFIRMED,
          isModificationPayment,
          timestamp: new Date().toISOString(),
        });
        
        // Forcer la mise à jour du statut à CONFIRMED
        const correctedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CONFIRMED },
          select: { id: true, status: true },
        });
        
        console.log(`[Stripe Webhook] ✅ Statut forcé à CONFIRMED`, {
          bookingId: correctedBooking.id,
          previousStatus: updatedBooking.status,
          newStatus: correctedBooking.status,
          timestamp: new Date().toISOString(),
        });
        
        // Mettre à jour la variable pour les logs suivants
        updatedBooking.status = correctedBooking.status;
      }

      // Log pour les notifications admin
      if (isModificationPayment) {
        console.log(`[Stripe Webhook] 🔔 Notification admin à créer pour paiement de modification`, {
          bookingId: updatedBooking.id,
          reference: updatedBooking.reference,
          status: updatedBooking.status,
          depositPaid: `${(updatedBooking.depositPaid || 0).toFixed(2)}€`,
          hasOriginalStartDate: !!booking.originalStartDate,
          hasOriginalEndDate: !!booking.originalEndDate,
          originalStartDate: booking.originalStartDate?.toISOString() ?? "N/A",
          originalEndDate: booking.originalEndDate?.toISOString() ?? "N/A",
          note: "La réservation a originalStartDate/originalEndDate, donc une notification 'modificationPayment' sera créée dans les notifications admin",
          timestamp: new Date().toISOString(),
        });
      }

      // Créer un enregistrement de paiement AVANT l'envoi de l'email
      // Note: PaymentStatus n'a pas "AUTHORIZED", on utilise "PENDING" pour l'empreinte
      const paymentStatus = isAuthorization ? PaymentStatus.PENDING : PaymentStatus.COMPLETED;
      
      // Déterminer le montant à enregistrer dans Payment selon le type de paiement
      const paymentAmount = roundedAmountPaid; // Montant réellement payé via Stripe
      
      // Déterminer les montants d'acompte et de caution pour les métadonnées
      let metadataDownPayment: number;
      let metadataSecurityDeposit: number;
      
      if (isModificationPayment) {
        // Pour un paiement supplémentaire de modification, on enregistre juste le montant payé
        metadataDownPayment = roundedAmountPaid; // La différence d'acompte payée
        metadataSecurityDeposit = 0; // La caution n'est pas incluse dans ce paiement
      } else if (isAuthorization) {
        metadataDownPayment = 0;
        metadataSecurityDeposit = roundedSecurityDeposit;
      } else if (isDepositOnly) {
        metadataDownPayment = roundedDownPayment;
        metadataSecurityDeposit = 0;
      } else {
        metadataDownPayment = roundedDownPayment;
        metadataSecurityDeposit = roundedSecurityDeposit;
      }
      
      console.log(`[Stripe Webhook] 💳 Création de l'enregistrement de paiement dans la table Payment`, {
        bookingId,
        userId,
        paymentDetails: {
          amountToRecord: `${paymentAmount.toFixed(2)}€`,
          amountFromStripe: `${roundedAmountPaid.toFixed(2)}€`,
          paymentType,
          isModificationPayment,
          breakdown: {
            downPayment: `${metadataDownPayment.toFixed(2)}€`,
            securityDeposit: `${metadataSecurityDeposit.toFixed(2)}€${isAuthorization ? " (bloqué)" : ""}`,
          },
        },
        method: "STRIPE",
        status: paymentStatus,
        transactionId: session.id,
        paymentIntentId: session.payment_intent || "N/A",
        timestamp: new Date().toISOString(),
      });

      const createdPayment = await prisma.payment.create({
        data: {
          bookingId: bookingId,
          userId: userId,
          amount: paymentAmount, // Montant réellement payé (93.75€ pour l'acompte seul)
          method: "STRIPE",
          status: paymentStatus,
          transactionId: session.id,
          metadata: {
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string | undefined,
            paymentType: paymentType,
            isModificationPayment: isModificationPayment,
            downPayment: metadataDownPayment,
            securityDeposit: metadataSecurityDeposit,
            amountPaid: paymentAmount, // Montant total enregistré dans Payment
          },
        },
        select: {
          id: true,
          amount: true,
          status: true,
          transactionId: true,
          createdAt: true,
        },
      });

      console.log(`[Stripe Webhook] ✅ Enregistrement de paiement créé dans la table Payment`, {
        paymentId: createdPayment.id,
        bookingId,
        paymentRecord: {
          amount: `${createdPayment.amount.toFixed(2)}€`,
          status: createdPayment.status,
          transactionId: createdPayment.transactionId,
          createdAt: createdPayment.createdAt.toISOString(),
        },
        bookingUpdate: {
          depositPaid: `${roundedDownPayment.toFixed(2)}€`,
          securityDepositPaid: isAuthorization ? `${roundedSecurityDeposit.toFixed(2)}€ (bloqué)` : (isDepositOnly ? "0.00€" : `${roundedSecurityDeposit.toFixed(2)}€`),
          status: isDepositOnly ? "CONFIRMED" : (isAuthorization ? "PENDING" : "CONFIRMED"),
        },
        verification: {
          paymentAmountMatches: paymentAmount === roundedAmountPaid ? "✅ Oui" : "❌ Non",
          depositPaidMatches: isDepositOnly ? (paymentAmount === roundedDownPayment ? "✅ Oui" : "❌ Non") : "N/A (paiement complet)",
        },
        timestamp: new Date().toISOString(),
      });

      // Mettre à jour le statut des factures liées à cette réservation
      // Seulement si le paiement est complété (pas pour les autorisations)
      if (paymentStatus === PaymentStatus.COMPLETED && !isAuthorization) {
        console.log(`[Stripe Webhook] 📋 Mise à jour du statut des factures pour la réservation ${bookingId}`, {
          bookingId,
          paymentId: createdPayment.id,
          paymentAmount: paymentAmount,
          timestamp: new Date().toISOString(),
        });

        try {
          await updateInvoiceStatusAfterPayment(
            bookingId,
            createdPayment.id,
            paymentAmount
          );

          console.log(`[Stripe Webhook] ✅ Statut des factures mis à jour pour la réservation ${bookingId}`, {
            bookingId,
            paymentId: createdPayment.id,
            timestamp: new Date().toISOString(),
          });
        } catch (invoiceUpdateError) {
          console.error(`[Stripe Webhook] ❌ Erreur lors de la mise à jour du statut des factures`, {
            bookingId,
            paymentId: createdPayment.id,
            error: invoiceUpdateError instanceof Error ? invoiceUpdateError.message : String(invoiceUpdateError),
            timestamp: new Date().toISOString(),
          });
          // Ne pas bloquer le webhook en cas d'erreur de mise à jour des factures
        }
      }

      // Envoyer l'email de confirmation si le statut est CONFIRMED
      if (updatedBooking.status === BookingStatus.CONFIRMED) {
        const emailType = isModificationPayment ? "mise à jour (paiement supplémentaire)" : "confirmation";
        console.log(`[Stripe Webhook] 📧 Préparation de l'envoi de l'email de ${emailType}`, {
          bookingId: updatedBooking.id,
          reference: updatedBooking.reference,
          status: updatedBooking.status,
          isModificationPayment,
          timestamp: new Date().toISOString(),
        });

        try {
          // Récupérer les informations nécessaires pour l'email
          const [user, vehicle, pickupLocation, returnLocation] = await Promise.all([
            prisma.user.findUnique({
              where: { id: updatedBooking.userId },
              select: {
                email: true,
                name: true,
              },
            }),
            prisma.vehicle.findUnique({
              where: { id: updatedBooking.vehicleId },
              select: {
                brand: true,
                model: true,
                licensePlate: true,
              },
            }),
            prisma.location.findUnique({
              where: { id: updatedBooking.pickupLocationId },
              select: {
                name: true,
              },
            }),
            prisma.location.findUnique({
              where: { id: updatedBooking.returnLocationId },
              select: {
                name: true,
              },
            }),
          ]);

          if (!user || !vehicle || !pickupLocation || !returnLocation) {
            console.error(`[Stripe Webhook] ❌ Données manquantes pour l'envoi de l'email`, {
              bookingId: updatedBooking.id,
              userFound: !!user,
              vehicleFound: !!vehicle,
              pickupLocationFound: !!pickupLocation,
              returnLocationFound: !!returnLocation,
              timestamp: new Date().toISOString(),
            });
          } else {
            // Formater la période de réservation
            const bookingPeriod = `${format(updatedBooking.startDate, "dd MMMM yyyy 'à' HH:mm", {
              locale: fr,
            })} → ${format(updatedBooking.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;

            // Déterminer le message de salutation
            const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";

            // Si c'est un paiement supplémentaire de modification, envoyer un email de mise à jour
            if (isModificationPayment) {
              console.log(`[Stripe Webhook] 🔄 Paiement supplémentaire de modification détecté, récupération des métadonnées`, {
                bookingId: updatedBooking.id,
                reference: updatedBooking.reference,
                sessionMetadata: session.metadata,
                timestamp: new Date().toISOString(),
              });
              
              // Récupérer les informations de modification depuis les métadonnées de la session Stripe
              // Si les métadonnées ne sont pas présentes, récupérer depuis la base de données
              let originalTotalPrice = session.metadata?.originalTotalPrice ? parseFloat(session.metadata.originalTotalPrice) : null;
              let originalDepositPaid = session.metadata?.originalDepositPaid ? parseFloat(session.metadata.originalDepositPaid) : null;
              let originalRemainingAmount = session.metadata?.originalRemainingAmount ? parseFloat(session.metadata.originalRemainingAmount) : null;
              let depositDifference = session.metadata?.depositDifference ? parseFloat(session.metadata.depositDifference) : null;
              let securityDepositPaid = session.metadata?.securityDepositPaid ? parseFloat(session.metadata.securityDepositPaid) : 0;
              
              // Si les métadonnées ne sont pas présentes, essayer de récupérer depuis la base de données
              // ou calculer à partir des valeurs actuelles de la réservation
              if (originalTotalPrice == null || originalDepositPaid == null) {
                console.log(`[Stripe Webhook] ⚠️  Métadonnées incomplètes, tentative de récupération depuis la DB`, {
                  bookingId: updatedBooking.id,
                  hasMetadata: !!session.metadata,
                  metadataKeys: session.metadata ? Object.keys(session.metadata) : [],
                  timestamp: new Date().toISOString(),
                });
                
                // Récupérer les valeurs depuis la réservation (originalTotalPrice/originalDepositPaid peuvent être encore présents)
                if (originalTotalPrice == null && booking.originalTotalPrice != null) {
                  originalTotalPrice = booking.originalTotalPrice;
                  console.log(`[Stripe Webhook] ✅ originalTotalPrice récupéré depuis la DB: ${originalTotalPrice}`);
                }
                if (originalDepositPaid == null && booking.originalDepositPaid != null) {
                  originalDepositPaid = booking.originalDepositPaid;
                  console.log(`[Stripe Webhook] ✅ originalDepositPaid récupéré depuis la DB: ${originalDepositPaid}`);
                }
                
                // Si toujours null, essayer de calculer approximativement à partir des valeurs actuelles
                if (originalTotalPrice == null) {
                  // Estimer depuis le nouveau prix et la différence payée
                  const newDepositPaid = updatedBooking.depositPaid || 0;
                  const oldDepositPaid = newDepositPaid - roundedAmountPaid;
                  originalTotalPrice = oldDepositPaid > 0 ? (oldDepositPaid / 0.3) : updatedBooking.totalPrice - (roundedAmountPaid / 0.3);
                  console.log(`[Stripe Webhook] ⚠️  originalTotalPrice estimé: ${originalTotalPrice}`);
                }
                if (originalDepositPaid == null) {
                  // Calculer depuis l'acompte actuel moins le montant supplémentaire payé
                  originalDepositPaid = (updatedBooking.depositPaid || 0) - roundedAmountPaid;
                  console.log(`[Stripe Webhook] ⚠️  originalDepositPaid estimé: ${originalDepositPaid}`);
                }
                
                console.log(`[Stripe Webhook] 📊 Valeurs estimées depuis la réservation`, {
                  bookingId: updatedBooking.id,
                  originalTotalPrice,
                  originalDepositPaid,
                  currentTotalPrice: updatedBooking.totalPrice,
                  currentDepositPaid: updatedBooking.depositPaid,
                  roundedAmountPaid,
                  timestamp: new Date().toISOString(),
                });
              }
              
              // Calculer les valeurs manquantes si nécessaire
              if (originalRemainingAmount == null && originalTotalPrice != null && originalDepositPaid != null) {
                originalRemainingAmount = originalTotalPrice - originalDepositPaid;
              }
              if (depositDifference == null) {
                depositDifference = roundedAmountPaid; // Le montant payé est la différence
              }
              if (securityDepositPaid == 0 && updatedBooking.securityDepositPaid) {
                securityDepositPaid = updatedBooking.securityDepositPaid;
              }
              
              console.log(`[Stripe Webhook] 📊 Métadonnées de modification finales`, {
                bookingId: updatedBooking.id,
                originalTotalPrice,
                originalDepositPaid,
                originalRemainingAmount,
                depositDifference,
                securityDepositPaid,
                roundedAmountPaid,
                timestamp: new Date().toISOString(),
              });

              // Construire modificationInfo pour l'email
              // IMPORTANT: paymentConfirmed = true car le webhook est appelé APRÈS le paiement réussi
              // Toujours créer modificationInfo si possible, même avec des valeurs estimées
              const modificationInfo = originalTotalPrice != null && originalDepositPaid != null ? {
                originalTotalPrice,
                originalDepositPaid,
                originalRemainingAmount: originalRemainingAmount ?? (originalTotalPrice - originalDepositPaid),
                depositDifference: depositDifference ?? roundedAmountPaid,
                additionalPaymentAmount: roundedAmountPaid, // Montant payé (la différence)
                securityDepositPaid,
                paymentConfirmed: true, // ✅ Paiement confirmé (webhook appelé après paiement réussi)
              } : {
                // Fallback: utiliser les valeurs minimales nécessaires
                originalTotalPrice: updatedBooking.totalPrice - (roundedAmountPaid / 0.3 * 0.7),
                originalDepositPaid: (updatedBooking.depositPaid || 0) - roundedAmountPaid,
                originalRemainingAmount: (updatedBooking.totalPrice - (roundedAmountPaid / 0.3 * 0.7)) - ((updatedBooking.depositPaid || 0) - roundedAmountPaid),
                depositDifference: roundedAmountPaid,
                additionalPaymentAmount: roundedAmountPaid,
                securityDepositPaid: updatedBooking.securityDepositPaid || 0,
                paymentConfirmed: true,
              };

              console.log(`[Stripe Webhook] 📧 Envoi de l'email de mise à jour (paiement supplémentaire)`, {
                bookingId: updatedBooking.id,
                reference: updatedBooking.reference,
                modificationInfo: modificationInfo ? {
                  originalTotalPrice: modificationInfo.originalTotalPrice,
                  originalDepositPaid: modificationInfo.originalDepositPaid,
                  depositDifference: modificationInfo.depositDifference,
                  additionalPaymentAmount: modificationInfo.additionalPaymentAmount,
                } : "N/A",
                timestamp: new Date().toISOString(),
              });

              const emailResult = await sendBookingUpdateEmail({
                to: user.email,
                name: user.name || "Client",
                greeting,
                booking: {
                  reference: updatedBooking.reference,
                  totalPrice: updatedBooking.totalPrice,
                  depositPaid: updatedBooking.depositPaid || 0,
                  remainingAmount: updatedBooking.remainingAmount || 0,
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

              if (emailResult.skipped) {
                console.warn(`[Stripe Webhook] ⚠️  Email de mise à jour ignoré pour la réservation ${updatedBooking.reference} (credentials non configurés)`, {
                  bookingId: updatedBooking.id,
                  reference: updatedBooking.reference,
                  timestamp: new Date().toISOString(),
                });
              } else if (!emailResult.success) {
                console.error(`[Stripe Webhook] ❌ Échec de l'envoi de l'email de mise à jour pour la réservation ${updatedBooking.reference}`, {
                  bookingId: updatedBooking.id,
                  reference: updatedBooking.reference,
                  error: emailResult.error || "raison inconnue",
                  timestamp: new Date().toISOString(),
                });
              } else {
                console.log(`[Stripe Webhook] ✅ Email de mise à jour envoyé avec succès`, {
                  bookingId: updatedBooking.id,
                  reference: updatedBooking.reference,
                  recipient: user.email,
                  messageId: emailResult.messageId,
                  queued: emailResult.queued,
                  timestamp: new Date().toISOString(),
                });
              }
            } else {
              // Envoyer l'email de confirmation pour les paiements normaux
              const emailResult = await sendBookingConfirmationEmail({
                to: user.email,
                name: user.name || "Client",
                greeting,
                booking: {
                  reference: updatedBooking.reference,
                  totalPrice: updatedBooking.totalPrice,
                  depositPaid: updatedBooking.depositPaid || 0,
                  remainingAmount: updatedBooking.remainingAmount || 0,
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
              });

              if (emailResult.skipped) {
                console.warn(`[Stripe Webhook] ⚠️  Email de confirmation ignoré pour la réservation ${updatedBooking.reference} (credentials non configurés)`, {
                  bookingId: updatedBooking.id,
                  reference: updatedBooking.reference,
                  timestamp: new Date().toISOString(),
                });
              } else if (!emailResult.success) {
                console.error(`[Stripe Webhook] ❌ Échec de l'envoi de l'email de confirmation pour la réservation ${updatedBooking.reference}`, {
                  bookingId: updatedBooking.id,
                  reference: updatedBooking.reference,
                  error: emailResult.error || "raison inconnue",
                  timestamp: new Date().toISOString(),
                });
              } else {
                console.log(`[Stripe Webhook] ✅ Email de confirmation envoyé avec succès`, {
                  bookingId: updatedBooking.id,
                  reference: updatedBooking.reference,
                  recipient: user.email,
                  messageId: emailResult.messageId,
                  queued: emailResult.queued,
                  timestamp: new Date().toISOString(),
                });
              }
            }
          }
        } catch (error) {
          console.error(`[Stripe Webhook] ❌ Erreur lors de l'envoi de l'email de confirmation`, {
            bookingId: updatedBooking.id,
            reference: updatedBooking.reference,
            error: error instanceof Error ? error.message : "Erreur inconnue",
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
          });
          // Ne pas bloquer le webhook si l'email échoue
        }
      } else {
        console.log(`[Stripe Webhook] 📧 Email de confirmation non envoyé (statut: ${updatedBooking.status}, attendu: CONFIRMED)`, {
          bookingId: updatedBooking.id,
          reference: updatedBooking.reference,
          currentStatus: updatedBooking.status,
          timestamp: new Date().toISOString(),
        });
      }

      console.log(`[Stripe Webhook] 🎉 Paiement traité avec succès pour la réservation ${bookingId}`, {
        bookingId,
        paymentId: createdPayment.id,
        summary: {
          totalPaid: `${roundedAmountPaid.toFixed(2)}€`,
          paymentType,
          breakdown: {
            downPayment: isDepositOnly ? `${roundedDownPayment.toFixed(2)}€ (30% de la location) - PAYÉ` : (isAuthorization ? "0.00€ (non payé)" : `${roundedDownPayment.toFixed(2)}€ (30% de la location) - PAYÉ`),
            securityDeposit: isAuthorization ? `${roundedSecurityDeposit.toFixed(2)}€ (caution de garantie) - BLOQUÉ` : (isDepositOnly ? "0.00€ (non payé)" : `${roundedSecurityDeposit.toFixed(2)}€ (caution de garantie) - PAYÉ`),
            total: `${expectedAmount.toFixed(2)}€`,
          },
        },
        databaseRecords: {
          paymentTable: {
            id: createdPayment.id,
            amount: `${createdPayment.amount.toFixed(2)}€`,
            status: createdPayment.status,
            transactionId: createdPayment.transactionId,
          },
          bookingTable: {
            status: updatedBooking.status,
            depositPaid: `${(updatedBooking.depositPaid || 0).toFixed(2)}€`,
            securityDepositPaid: `${(updatedBooking.securityDepositPaid || 0).toFixed(2)}€`,
            remainingAmount: `${(updatedBooking.remainingAmount || 0).toFixed(2)}€ (solde à la remise)`,
          },
        },
        stripe: {
          sessionId: session.id,
          paymentIntentId: session.payment_intent || "N/A",
          paymentStatus: session.payment_status,
          amountTotal: `${roundedAmountPaid.toFixed(2)}€`,
        },
        verification: {
          paymentAmountInPaymentTable: `${createdPayment.amount.toFixed(2)}€`,
          depositPaidInBookingTable: `${(updatedBooking.depositPaid || 0).toFixed(2)}€`,
          amountsMatch: isDepositOnly ? (createdPayment.amount === updatedBooking.depositPaid ? "✅ Oui" : "❌ Non") : "N/A (paiement complet)",
        },
        timestamp: new Date().toISOString(),
      });

      // Invalider le cache de la réservation et des pages concernées
      try {
        const { invalidateBookingCache, invalidateVehicleAvailabilityCache } = await import("@/lib/cache-invalidation");
        const { revalidatePath } = await import("next/cache");
        
        await Promise.all([
          invalidateBookingCache(bookingId).catch((error) => {
            console.error("[Stripe Webhook] Error invalidating booking cache:", error);
          }),
          invalidateVehicleAvailabilityCache(updatedBooking.vehicleId).catch((error) => {
            console.error("[Stripe Webhook] Error invalidating vehicle availability cache:", error);
          }),
        ]);

        // Revalider les pages Next.js
        revalidatePath("/dashboard");
        revalidatePath("/admin/bookings");
        revalidatePath(`/admin/bookings/${bookingId}`);
        revalidatePath("/admin/dashboard");
        
        console.log(`[Stripe Webhook] ✅ Cache invalidé et pages revalidées pour la réservation ${bookingId}`);
      } catch (cacheError) {
        console.error("[Stripe Webhook] ❌ Erreur lors de l'invalidation du cache:", cacheError);
        // Ne pas bloquer le webhook si l'invalidation de cache échoue
      }
    } else if (event.type === "charge.refunded" || event.type === "refund.created" || event.type === "refund.updated") {
      // Gestion des événements de remboursement Stripe
      const refund = event.data.object as Stripe.Refund;
      
      console.log(`[Stripe Webhook] 💰 Event ${event.type} reçu`, {
        eventId: event.id,
        refundId: refund.id,
        paymentIntentId: refund.payment_intent,
        amount: refund.amount ? `${(refund.amount / 100).toFixed(2)}€` : "N/A",
        status: refund.status,
        reason: refund.reason,
        metadata: refund.metadata,
        timestamp: new Date().toISOString(),
      });

      // Récupérer le bookingId depuis les métadonnées du remboursement
      const bookingId = refund.metadata?.bookingId;
      const bookingReference = refund.metadata?.bookingReference;

      if (!bookingId) {
        console.warn(`[Stripe Webhook] ⚠️  Aucun bookingId dans les métadonnées du remboursement`, {
          refundId: refund.id,
          metadata: refund.metadata,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json({ received: true });
      }

      // Récupérer le paiement associé au remboursement
      const payment = await prisma.payment.findFirst({
        where: {
          bookingId: bookingId,
          transactionId: refund.id,
        },
        select: {
          id: true,
          bookingId: true,
          status: true,
          amount: true,
          metadata: true,
        },
      });

      if (!payment) {
        console.warn(`[Stripe Webhook] ⚠️  Aucun paiement trouvé pour ce remboursement`, {
          refundId: refund.id,
          bookingId: bookingId,
          bookingReference: bookingReference || "N/A",
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json({ received: true });
      }

      // Déterminer le nouveau statut selon le statut Stripe
      let newStatus: "COMPLETED" | "PENDING" | "FAILED" = "PENDING";
      
      if (refund.status === "succeeded") {
        newStatus = "COMPLETED";
      } else if (refund.status === "failed" || refund.status === "canceled") {
        newStatus = "FAILED";
      } else {
        newStatus = "PENDING";
      }

      // Mettre à jour le statut du paiement si nécessaire
      if (payment.status !== newStatus) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: newStatus,
            metadata: {
              ...(typeof payment.metadata === "object" && payment.metadata !== null 
                ? (payment.metadata as Record<string, unknown>)
                : {}),
              lastWebhookEvent: event.type,
              lastWebhookEventId: event.id,
              lastWebhookTimestamp: new Date().toISOString(),
              stripeRefundStatus: refund.status,
            },
          },
        });

        console.log(`[Stripe Webhook] ✅ Statut du remboursement mis à jour`, {
          paymentId: payment.id,
          bookingId: bookingId,
          bookingReference: bookingReference || "N/A",
          refundId: refund.id,
          previousStatus: payment.status,
          newStatus: newStatus,
          stripeRefundStatus: refund.status,
          eventType: event.type,
          timestamp: new Date().toISOString(),
        });

        // Si le remboursement a échoué, restaurer le depositPaid
        if (newStatus === "FAILED" && refund.amount) {
          const refundAmount = refund.amount / 100; // Convertir de centimes en euros
          
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              depositPaid: {
                increment: refundAmount, // Restaurer le montant remboursé
              },
            },
          });

          console.log(`[Stripe Webhook] ⚠️  Remboursement échoué - depositPaid restauré`, {
            bookingId: bookingId,
            bookingReference: bookingReference || "N/A",
            refundId: refund.id,
            refundAmount: `${refundAmount.toFixed(2)}€`,
            timestamp: new Date().toISOString(),
          });
        }

        // Invalider le cache de la réservation et des pages concernées après mise à jour
        try {
          const { invalidateBookingCache } = await import("@/lib/cache-invalidation");
          const { revalidatePath } = await import("next/cache");
          
          await invalidateBookingCache(bookingId).catch((error) => {
            console.error("[Stripe Webhook] Error invalidating booking cache:", error);
          });

          // Revalider les pages Next.js
          revalidatePath("/dashboard");
          revalidatePath("/admin/bookings");
          revalidatePath(`/admin/bookings/${bookingId}`);
          revalidatePath("/admin/dashboard");
          
          console.log(`[Stripe Webhook] ✅ Cache invalidé et pages revalidées pour le remboursement de la réservation ${bookingId}`);
        } catch (cacheError) {
          console.error("[Stripe Webhook] ❌ Erreur lors de l'invalidation du cache:", cacheError);
          // Ne pas bloquer le webhook si l'invalidation de cache échoue
        }
      } else {
        console.log(`[Stripe Webhook] ℹ️  Statut du remboursement déjà à jour`, {
          paymentId: payment.id,
          bookingId: bookingId,
          refundId: refund.id,
          currentStatus: payment.status,
          stripeRefundStatus: refund.status,
          eventType: event.type,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      console.log(`[Stripe Webhook] Event type ${event.type} not handled`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] ❌ Erreur lors du traitement du webhook", {
      error: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
      eventType: event?.type || "N/A",
      eventId: event?.id || "N/A",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

