"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BookingStatus, InvoiceStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createDefaultAdminSettings } from "@/actions/admin/settings/shared";

type BookingModerationPayload = Prisma.BookingGetPayload<{
  include: {
    user: {
      select: {
        name: true;
        email: true;
      };
    };
    vehicle: {
      select: {
        brand: true;
        model: true;
        licensePlate: true;
      };
    };
    pickupLocation: {
      select: {
        name: true;
      };
    };
    returnLocation: {
      select: {
        name: true;
      };
    };
  };
}> & {
  cancellationRequested: boolean;
  cancellationReason: string | null;
  cancellationRequestedAt: Date | null;
  cancellationRequestedRefundRate: number | null;
  cancellationPreviousStatus: BookingStatus | null;
  totalPrice: number | null;
  depositPaid: number | null;
  remainingAmount: number | null;
};

type EmailResult = { success: boolean; skipped?: boolean; error?: string };

type EmailFunction = (...args: unknown[]) => Promise<EmailResult>;

type EmailModule = {
  sendBookingCancellationEmail: EmailFunction;
  sendBookingCancellationRejectedEmail: EmailFunction;
  sendBookingUpdateEmail: EmailFunction;
};

const moderateSchema = z.object({
  bookingId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().max(500).optional(), // Message de refus optionnel (max 500 caractères)
});

export type ModerateBookingAction =
  | "approve"
  | "reject";

export interface ModerateBookingResult {
  success: boolean;
  error?: string;
}

function computeRefundRate(startDate: Date, referenceDate: Date): number {
  const hoursBeforeStart = (startDate.getTime() - referenceDate.getTime()) / 3600000;
  const daysBeforeStart = hoursBeforeStart / 24;

  if (daysBeforeStart > 7) {
    return 1;
  }

  if (daysBeforeStart >= 3) {
    return 0.5;
  }

  return 0;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

async function handleModificationRequest(
  booking: BookingModerationPayload & {
    modificationRequested?: boolean;
    modificationRequestedAt?: Date | null;
    originalStartDate?: Date | null;
    originalEndDate?: Date | null;
    originalTotalPrice?: number | null;
    originalDepositPaid?: number | null;
    modificationDepositDifference?: number | null;
    securityDepositPaid?: number | null;
  },
  action: "approve" | "reject",
  emailModule: EmailModule,
  rejectionReason?: string,
): Promise<ModerateBookingResult> {
  console.log(`\n🔵 [Admin Moderation] ==========================================`);
  console.log(`🔵 [Admin Moderation] 🚀 DÉBUT handleModificationRequest`);
  console.log(`🔵 [Admin Moderation] ==========================================`);
  console.log(`   - Action: ${action}`);
  console.log(`   - Booking ID: ${booking.id}`);
  console.log(`   - Référence: ${booking.reference}`);
  console.log(`   - Statut actuel: ${booking.status}`);
  console.log(`   - modificationRequested: ${booking.modificationRequested}`);
  console.log(`   - modificationDepositDifference: ${booking.modificationDepositDifference ?? "null/undefined"}€`);
  console.log(`   - originalDepositPaid: ${booking.originalDepositPaid ?? "null/undefined"}€`);
  console.log(`   - depositPaid (actuel): ${booking.depositPaid ?? "null/undefined"}€`);
  console.log(`🔵 [Admin Moderation] ==========================================\n`);

  const { createRefundAction } = await import("@/actions/public/payments/create-refund");
  const { createCheckoutSessionAction } = await import("@/actions/public/payments/create-checkout-session");

  if (action === "approve") {
    console.log(`\n✅ [Admin Moderation] Action = APPROVE`);
    console.log(`✅ [Admin Moderation] Récupération des données de modification...`);
    
    // Vérifier si la modification a déjà été validée mais qu'un paiement est en attente
    const isAlreadyValidated = booking.modificationRequested === false;
    const hasPendingPayment = (booking.modificationDepositDifference ?? 0) > 0;
    
    if (isAlreadyValidated && hasPendingPayment) {
      console.log(`\n🔄 [Admin Moderation] Modification déjà validée, paiement en attente`);
      console.log(`   - modificationRequested: false (déjà validée)`);
      console.log(`   - modificationDepositDifference: ${booking.modificationDepositDifference}€ (paiement en attente)`);
      console.log(`   - Action: Ré-envoi de l'email avec nouvelle session de paiement`);
    }
    
    // Admin accepte la modification → déclencher les actions Stripe
    // IMPORTANT: Stocker les valeurs originales AVANT de nettoyer les champs
    // car elles seront utilisées pour l'email après la mise à jour
    // Si la modification est déjà validée, utiliser les valeurs actuelles comme "originales"
    // car les vraies valeurs originales ont été nettoyées
    const originalTotalPrice = booking.originalTotalPrice ?? booking.totalPrice ?? 0;
    const originalDepositPaid = booking.originalDepositPaid ?? booking.depositPaid ?? 0;
    const originalRemainingAmount = originalTotalPrice - originalDepositPaid;
    
    // IMPORTANT: Utiliser modificationDepositDifference comme source de vérité
    // Cette valeur a été calculée et stockée lors de la demande de modification par le client
    // Elle représente la différence exacte entre le nouvel acompte et l'ancien acompte
    const depositDifference = booking.modificationDepositDifference ?? 0;
    
    // Vérification de cohérence : recalculer pour vérifier (mais ne pas utiliser pour la décision)
    const newDepositPaid = booking.depositPaid ?? 0;
    const calculatedDepositDifference = newDepositPaid - originalDepositPaid;
    
    // Log pour déboguer si les valeurs ne correspondent pas
    if (Math.abs(depositDifference - calculatedDepositDifference) > 0.01) {
      console.warn(`\n⚠️  [Admin Moderation] Écart entre depositDifference stocké et calculé:`);
      console.warn(`   - depositDifference (stocké): ${depositDifference}€`);
      console.warn(`   - calculatedDepositDifference: ${calculatedDepositDifference}€`);
      console.warn(`   - Écart: ${Math.abs(depositDifference - calculatedDepositDifference)}€`);
      console.warn(`   - On utilise la valeur stockée (modificationDepositDifference) comme source de vérité`);
    }
    
    const securityDepositPaid = booking.securityDepositPaid ?? 0;
    let paymentUrl: string | undefined;

    console.log(`✅ [Admin Moderation] 📊 Données de modification:`);
    console.log(`   - modificationDepositDifference (source de vérité depuis DB): ${depositDifference}€`);
    console.log(`   - originalDepositPaid (stocké): ${originalDepositPaid}€`);
    console.log(`   - newDepositPaid (actuel dans booking): ${newDepositPaid}€`);
    console.log(`   - calculatedDepositDifference (vérification): ${calculatedDepositDifference}€`);
    console.log(`   - ⚠️  VÉRIFICATION CRITIQUE: depositDifference > 0 ? ${depositDifference > 0} → Statut sera: ${depositDifference > 0 ? "PENDING" : "CONFIRMED"}`);
    console.log(`   - securityDepositPaid: ${securityDepositPaid}€`);
    console.log(`   - originalTotalPrice (stocké): ${originalTotalPrice}€`);
    console.log(`   - originalRemainingAmount (calculé): ${originalRemainingAmount}€`);
    console.log(`   - nouveau totalPrice: ${booking.totalPrice ?? "N/A"}€`);

    // Si nouveau prix < ancien prix → créer un remboursement
    // IMPORTANT: Utiliser originalDepositPaid (stocké) pour vérifier si un paiement a été fait
    // car depositPaid a été mis à jour avec le nouveau montant lors de la modification
    let refundCreated = false;
    let refundAmountCreated = 0;
    
    if (depositDifference < 0 && originalDepositPaid > 0) {
      const refundAmount = Math.abs(depositDifference);
      console.log(`\n💰 [Admin Moderation] Création d'un remboursement Stripe...`);
      console.log(`💰 [Admin Moderation] Montant à rembourser: ${refundAmount}€`);
      console.log(`💰 [Admin Moderation] Acompte original payé: ${originalDepositPaid}€`);
      console.log(`💰 [Admin Moderation] Nouvel acompte: ${booking.depositPaid}€`);
      
      const refundResult = await createRefundAction({
        bookingId: booking.id,
        amount: refundAmount,
        reason: "booking_modification",
      });

        if (!refundResult.success) {
        console.error(`\n❌ [Admin Moderation] ERREUR lors du remboursement:`);
        console.error(`   - Erreur: ${refundResult.error}`);
        console.error(`   - Booking ID: ${booking.id}`);
        console.error(`   - Acompte original payé: ${booking.originalDepositPaid}€`);
        console.error(`   - Nouvel acompte: ${booking.depositPaid}€`);
        console.error(`   - Montant à rembourser: ${refundAmount}€`);
        
        // Si l'erreur est due à l'absence de paiement Stripe, au montant insuffisant,
        // ou au fait que le Payment Intent a déjà été complètement remboursé,
        // on continue quand même mais on n'enregistre pas refundCreated = true
        const isRefundErrorRecoverable = 
          refundResult.error?.includes("Aucun paiement") || 
          refundResult.error?.includes("paiement Stripe") ||
          refundResult.error?.includes("montant total disponible") ||
          refundResult.error?.includes("montant insuffisant") ||
          refundResult.error?.includes("dépasse le montant total") ||
          refundResult.error?.includes("remboursement manuel") ||
          refundResult.error?.includes("déjà été complètement remboursé") ||
          refundResult.error?.includes("remboursable disponible : 0") ||
          refundResult.error?.includes("greater than or equal to 1");
        
        if (isRefundErrorRecoverable) {
          console.warn(`\n⚠️  [Admin Moderation] Erreur de remboursement récupérable, on continue sans remboursement Stripe`);
          console.warn(`   - Le remboursement sera géré manuellement ou le Payment Intent a déjà été remboursé`);
          console.warn(`   - Erreur: ${refundResult.error}`);
          console.warn(`   - La modification sera validée mais le remboursement devra être effectué manuellement.`);
          console.warn(`   - Montant à rembourser manuellement: ${refundAmount}€`);
          console.warn(`   - Acompte original payé: ${originalDepositPaid}€`);
          console.warn(`   - Nouvel acompte: ${booking.depositPaid}€`);
          // On continue sans créer de remboursement Stripe
          refundCreated = false;
          refundAmountCreated = 0;
        } else {
          // Pour les autres erreurs (erreurs Stripe, etc.), on arrête
          return {
            success: false,
            error: `Erreur lors du remboursement: ${refundResult.error}`,
          };
        }
      } else {
        refundCreated = true;
        refundAmountCreated = refundAmount;
        console.log(`\n✅ [Admin Moderation] Remboursement créé avec succès:`);
        console.log(`   - Montant: ${refundAmount}€`);
        console.log(`   - Refund ID: ${refundResult.refundId ?? "N/A"}`);
      }
    } else if (depositDifference < 0) {
      console.log(`\nℹ️  [Admin Moderation] Aucun remboursement nécessaire (depositDifference < 0 mais originalDepositPaid = 0)`);
    }

    // Si nouveau prix > ancien prix → créer une session de paiement
    if (depositDifference > 0) {
      console.log(`\n💳 [Admin Moderation] Création d'une session de paiement Stripe...`);
      console.log(`💳 [Admin Moderation] Montant à payer: ${depositDifference}€`);
      
      const cautionInfo = securityDepositPaid > 0 
        ? ` (la caution de ${securityDepositPaid.toFixed(2)}€ a déjà été payée et n'est pas incluse)`
        : "";
      
      console.log(`💳 [Admin Moderation] Description: Acompte supplémentaire pour la modification de dates - Réservation ${booking.reference}${cautionInfo}`);
      console.log(`💳 [Admin Moderation] Appel de createCheckoutSessionAction...`);
      
      // Stocker les informations de modification pour le webhook
      // Ces valeurs seront utilisées dans l'email après le paiement
      const modificationMetadata = {
        originalTotalPrice: originalTotalPrice.toString(),
        originalDepositPaid: originalDepositPaid.toString(),
        originalRemainingAmount: originalRemainingAmount.toString(),
        depositDifference: depositDifference.toString(),
        securityDepositPaid: securityDepositPaid.toString(),
      };

      const paymentResult = await createCheckoutSessionAction({
        bookingId: booking.id,
        amount: depositDifference,
        description: `Acompte supplémentaire pour la modification de dates - Réservation ${booking.reference}${cautionInfo}`,
        paymentType: "deposit", // Type "deposit" pour indiquer que c'est un acompte
        isModificationPayment: true, // Indicateur pour le webhook
        modificationMetadata, // Métadonnées de modification pour le webhook
      });

      console.log(`💳 [Admin Moderation] Résultat de createCheckoutSessionAction:`);
      console.log(`   - success: ${paymentResult.success}`);
      console.log(`   - url: ${paymentResult.url ? "✅ URL générée" : "❌ Pas d'URL"}`);
      console.log(`   - error: ${paymentResult.error ?? "Aucune erreur"}`);

      if (!paymentResult.success || !paymentResult.url) {
        console.error(`\n❌ [Admin Moderation] ERREUR lors de la création de la session de paiement:`);
        console.error(`   - Erreur: ${paymentResult.error}`);
        console.error(`   - Booking ID: ${booking.id}`);
        console.error(`   - Montant: ${depositDifference}€`);
        return {
          success: false,
          error: `Erreur lors de la création de la session de paiement: ${paymentResult.error}`,
        };
      }
      paymentUrl = paymentResult.url;
      console.log(`\n✅ [Admin Moderation] Session de paiement créée avec succès:`);
      console.log(`   - Montant: ${depositDifference}€`);
      console.log(`   - URL: ${paymentUrl.substring(0, 80)}...`);
    } else if (depositDifference === 0) {
      console.log(`\nℹ️  [Admin Moderation] Aucun paiement supplémentaire nécessaire (depositDifference = 0)`);
    }

    // Mettre à jour la réservation : valider la modification et nettoyer les champs de demande
    console.log(`\n📝 [Admin Moderation] ==========================================`);
    console.log(`📝 [Admin Moderation] Mise à jour de la réservation dans la base de données...`);
    console.log(`📝 [Admin Moderation] Nettoyage des champs de modification...`);
    console.log(`📝 [Admin Moderation] ⚠️  VÉRIFICATION CRITIQUE AVANT MISE À JOUR:`);
    console.log(`   - depositDifference: ${depositDifference}€`);
    console.log(`   - depositDifference > 0: ${depositDifference > 0}`);
    console.log(`   - paymentUrl créé: ${paymentUrl ? "OUI" : "NON"}`);
    console.log(`   - modificationDepositDifference (raw): ${booking.modificationDepositDifference ?? "null/undefined"}`);
    
    // FORCER le statut à PENDING si un paiement est nécessaire
    // Vérifier à la fois depositDifference ET paymentUrl ET modificationDepositDifference pour être sûr
    // Si modificationDepositDifference existe et est > 0, c'est qu'un paiement est nécessaire
    const hasModificationDepositDiff = (booking.modificationDepositDifference ?? 0) > 0;
    const requiresPayment = depositDifference > 0 || !!paymentUrl || hasModificationDepositDiff;
    
    console.log(`   - hasModificationDepositDiff: ${hasModificationDepositDiff}`);
    console.log(`   - requiresPayment: ${requiresPayment}`);
    console.log(`   - Statut qui sera appliqué: ${requiresPayment ? "PENDING (paiement nécessaire)" : "CONFIRMED"}`);
    
    // FORCER le statut à PENDING si un paiement est nécessaire
    const newStatus = requiresPayment ? BookingStatus.PENDING : BookingStatus.CONFIRMED;
    console.log(`📝 [Admin Moderation] ✅ Statut final qui sera enregistré: ${newStatus}`);
    console.log(`📝 [Admin Moderation] ==========================================\n`);
    
    if (requiresPayment && newStatus !== BookingStatus.PENDING) {
      console.error(`\n❌ [Admin Moderation] ERREUR CRITIQUE: requiresPayment est true mais newStatus n'est pas PENDING !`);
      console.error(`   - requiresPayment: ${requiresPayment}`);
      console.error(`   - newStatus: ${newStatus}`);
      console.error(`   - FORCAGE du statut à PENDING...`);
      // Forcer explicitement
      const forcedStatus = BookingStatus.PENDING;
      console.error(`   - Statut forcé à: ${forcedStatus}`);
    }
    
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        modificationRequested: false,
        modificationRequestedAt: null,
        // IMPORTANT: Ne PAS supprimer les dates originales si un paiement est nécessaire
        // On les garde pour pouvoir restaurer en cas de refus après acceptation
        // Elles seront supprimées par le webhook Stripe après le paiement réussi
        originalStartDate: requiresPayment ? booking.originalStartDate : null,
        originalEndDate: requiresPayment ? booking.originalEndDate : null,
        originalTotalPrice: requiresPayment ? booking.originalTotalPrice : null,
        originalDepositPaid: requiresPayment ? booking.originalDepositPaid : null,
        // IMPORTANT: Ne PAS nettoyer modificationDepositDifference si un paiement est nécessaire
        // Il sera nettoyé par le webhook Stripe après le paiement réussi
        // Cela permet au webhook de savoir qu'il s'agit d'un paiement de modification
        modificationDepositDifference: requiresPayment ? depositDifference : null,
        // Le statut reste PENDING si un paiement est nécessaire, sinon CONFIRMED
        // IMPORTANT: Toujours utiliser newStatus pour éviter toute confusion
        status: newStatus,
      } as Prisma.BookingUpdateInput,
      select: {
        startDate: true,
        endDate: true,
        totalPrice: true,
        depositPaid: true,
        remainingAmount: true,
        status: true,
      },
    });

    console.log(`\n✅ [Admin Moderation] Réservation mise à jour avec succès:`);
    console.log(`   - Statut dans DB: ${updated.status}`);
    console.log(`   - Statut attendu: ${newStatus}`);
    console.log(`   - Dates: ${updated.startDate.toISOString()} → ${updated.endDate.toISOString()}`);
    console.log(`   - Prix total: ${updated.totalPrice}€`);
    console.log(`   - Acompte: ${updated.depositPaid}€`);
    console.log(`   - Solde restant: ${updated.remainingAmount}€`);
    console.log(`   - depositDifference: ${depositDifference}€`);
    console.log(`   - requiresPayment: ${requiresPayment}`);

    // VÉRIFICATION CRITIQUE : S'assurer que le statut est correct
    // Si un paiement est nécessaire (depositDifference > 0), le statut DOIT être PENDING
    // FORCER PENDING si depositDifference > 0, même si updated.status est différent
    if (depositDifference > 0 && updated.status !== BookingStatus.PENDING) {
      console.error(`\n❌ [Admin Moderation] ERREUR CRITIQUE: Statut incorrect dans la DB !`);
      console.error(`   - depositDifference: ${depositDifference}€ > 0 → Statut DOIT être PENDING`);
      console.error(`   - Statut réel dans DB: ${updated.status}`);
      console.error(`   - requiresPayment: ${requiresPayment}`);
      console.warn(`\n⚠️  [Admin Moderation] FORCAGE du statut en PENDING car depositDifference > 0...`);
      const corrected = await prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.PENDING },
        select: { status: true },
      });
      updated.status = corrected.status;
      console.log(`✅ [Admin Moderation] Statut FORCÉ en PENDING`);
    } else if (updated.status !== newStatus) {
      console.error(`\n❌ [Admin Moderation] ERREUR CRITIQUE: Statut incorrect dans la DB !`);
      console.error(`   - Statut attendu: ${newStatus}`);
      console.error(`   - Statut réel: ${updated.status}`);
      console.error(`   - requiresPayment: ${requiresPayment}`);
      console.error(`   - depositDifference: ${depositDifference}€`);
      // Corriger le statut si nécessaire
      if (requiresPayment && updated.status !== BookingStatus.PENDING) {
        console.warn(`\n⚠️  [Admin Moderation] Correction du statut en PENDING...`);
        const corrected = await prisma.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.PENDING },
          select: { status: true },
        });
        updated.status = corrected.status;
        console.log(`✅ [Admin Moderation] Statut corrigé en PENDING`);
      }
    } else {
      console.log(`✅ [Admin Moderation] Statut correct dans la DB: ${updated.status}`);
    }

    // Logs finaux pour tracer le flux complet
    console.log(`\n🎯 [Admin Moderation] ==========================================`);
    console.log(`🎯 [Admin Moderation] RÉSUMÉ DE LA VALIDATION`);
    console.log(`🎯 [Admin Moderation] ==========================================`);
    console.log(`   - Référence: ${booking.reference}`);
    console.log(`   - Statut final: ${updated.status}`);
    console.log(`   - depositDifference: ${depositDifference}€`);
    console.log(`   - requiresPayment: ${requiresPayment}`);
    console.log(`   - paymentUrl créé: ${paymentUrl ? "✅ OUI" : "❌ NON"}`);
    
    if (updated.status === BookingStatus.PENDING && requiresPayment) {
      console.log(`\n   📋 PROCHAINES ÉTAPES:`);
      console.log(`   ✅ Modification validée par l'admin`);
      console.log(`   ⏳ Statut: PENDING (en attente de paiement supplémentaire)`);
      console.log(`   💳 Montant à payer: ${depositDifference}€`);
      console.log(`   📧 Email envoyé au client avec lien de paiement`);
      console.log(`   🔄 Le statut passera à CONFIRMED après paiement (webhook Stripe)`);
      console.log(`   🚀 Redirection admin vers /admin/bookings dans 500ms`);
    } else if (updated.status === BookingStatus.CONFIRMED) {
      console.log(`\n   📋 PROCHAINES ÉTAPES:`);
      console.log(`   ✅ Modification validée par l'admin`);
      console.log(`   ✅ Statut: CONFIRMED (pas de paiement supplémentaire nécessaire)`);
      if (refundCreated) {
        console.log(`   💰 Remboursement créé: ${refundAmountCreated}€`);
      }
      console.log(`   📧 Email de confirmation envoyé au client`);
      console.log(`   🚀 Redirection admin vers /admin/bookings dans 500ms`);
    }
    console.log(`🎯 [Admin Moderation] ==========================================\n`);

    // Envoyer un email de confirmation
    console.log(`\n📧 [Admin Moderation] Préparation de l'email de confirmation...`);
    console.log(`📧 [Admin Moderation] Statut qui sera envoyé dans l'email: ${updated.status}`);
    
    if (booking.user?.email && booking.user.name) {
      console.log(`📧 [Admin Moderation] Client: ${booking.user.name} (${booking.user.email})`);
      
      const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";
      const bookingPeriod = `${format(
        updated.startDate,
        "dd MMMM yyyy 'à' HH:mm",
        { locale: fr },
      )} → ${format(updated.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;
      
      console.log(`📧 [Admin Moderation] Période: ${bookingPeriod}`);

      // Préparer les informations de modification pour l'email
      const modificationInfo: {
        originalTotalPrice?: number;
        originalDepositPaid?: number;
        originalRemainingAmount?: number;
        depositDifference?: number;
        refundAmount?: number;
        additionalPaymentAmount?: number;
        paymentUrl?: string;
        securityDepositPaid?: number;
      } = {};

      // Toujours inclure les valeurs originales pour la comparaison dans l'email
      // Utiliser les valeurs stockées AVANT le nettoyage des champs
      modificationInfo.originalTotalPrice = originalTotalPrice;
      modificationInfo.originalDepositPaid = originalDepositPaid;
      modificationInfo.originalRemainingAmount = originalRemainingAmount;
      modificationInfo.depositDifference = depositDifference;

      if (depositDifference < 0) {
        // Remboursement - utiliser refundAmountCreated si le remboursement a été créé
        modificationInfo.refundAmount = refundCreated ? refundAmountCreated : Math.abs(depositDifference);
        console.log(`📧 [Admin Moderation] refundAmount ajouté à modificationInfo: ${modificationInfo.refundAmount}€ (remboursement ${refundCreated ? "créé" : "prévu"})`);
      } else if (depositDifference > 0) {
        // Paiement supplémentaire
        modificationInfo.additionalPaymentAmount = depositDifference;
        if (paymentUrl) {
          modificationInfo.paymentUrl = paymentUrl;
          console.log(`📧 [Admin Moderation] URL de paiement ajoutée à modificationInfo: ${paymentUrl}`);
        } else {
          console.warn(`📧 [Admin Moderation] ⚠️  paymentUrl est undefined alors que depositDifference > 0`);
        }
      }

      // Ajouter la caution si elle a été payée
      if (securityDepositPaid > 0) {
        modificationInfo.securityDepositPaid = securityDepositPaid;
      }

      console.log(`📧 [Admin Moderation] modificationInfo pour l'email:`);
      console.log(`   ${JSON.stringify(modificationInfo, null, 2)}`);
      console.log(`📧 [Admin Moderation] Détails:`);
      console.log(`   - depositDifference: ${depositDifference}€`);
      console.log(`   - refundAmount: ${modificationInfo.refundAmount ?? "N/A"}€`);
      console.log(`   - additionalPaymentAmount: ${modificationInfo.additionalPaymentAmount ?? "N/A"}€`);
      console.log(`   - paymentUrl: ${modificationInfo.paymentUrl ? "✅ Présente" : "❌ Absente"}`);
      console.log(`   - securityDepositPaid: ${modificationInfo.securityDepositPaid ?? "N/A"}€`);

      // Toujours passer modificationInfo si on a des valeurs originales ou des différences
      // Cela permet d'afficher la comparaison dans l'email
      // IMPORTANT: On passe TOUJOURS modificationInfo si on a au moins originalTotalPrice ou originalDepositPaid
      // car le template vérifie lui-même si hasModificationInfo est true
      const hasModificationData = 
        (modificationInfo.originalTotalPrice !== undefined && modificationInfo.originalTotalPrice !== null) ||
        (modificationInfo.originalDepositPaid !== undefined && modificationInfo.originalDepositPaid !== null) ||
        (modificationInfo.depositDifference !== undefined && modificationInfo.depositDifference !== null) ||
        (modificationInfo.originalRemainingAmount !== undefined && modificationInfo.originalRemainingAmount !== null);

      console.log(`📧 [Admin Moderation] ==========================================`);
      console.log(`📧 [Admin Moderation] Vérification modificationInfo:`);
      console.log(`   - originalTotalPrice: ${modificationInfo.originalTotalPrice ?? "undefined/null"}`);
      console.log(`   - originalDepositPaid: ${modificationInfo.originalDepositPaid ?? "undefined/null"}`);
      console.log(`   - depositDifference: ${modificationInfo.depositDifference ?? "undefined/null"}`);
      console.log(`   - originalRemainingAmount: ${modificationInfo.originalRemainingAmount ?? "undefined/null"}`);
      console.log(`   - hasModificationData: ${hasModificationData}`);
      console.log(`📧 [Admin Moderation] modificationInfo sera passé: ${hasModificationData ? "OUI" : "NON"}`);
      console.log(`📧 [Admin Moderation] ==========================================`);
      
      console.log(`📧 [Admin Moderation] Envoi de l'email...`);
      console.log(`📧 [Admin Moderation] ⚠️  VÉRIFICATION FINALE:`);
      console.log(`   - Statut dans DB: ${updated.status}`);
      console.log(`   - Statut attendu: ${newStatus}`);
      console.log(`   - requiresPayment: ${requiresPayment}`);
      console.log(`   - depositDifference: ${depositDifference}€`);
      
      // S'assurer que le statut passé à l'email est correct
      // Si un paiement est nécessaire, le statut DOIT être PENDING
      const emailStatus = requiresPayment ? BookingStatus.PENDING : updated.status;
      if (emailStatus !== updated.status && requiresPayment) {
        console.warn(`\n⚠️  [Admin Moderation] Correction du statut pour l'email: ${updated.status} → ${emailStatus}`);
      }

      const emailResult = await emailModule.sendBookingUpdateEmail({
        to: booking.user.email,
        name: booking.user.name,
        greeting,
        booking: {
          reference: booking.reference,
          totalPrice: updated.totalPrice ?? 0,
          depositPaid: updated.depositPaid ?? 0,
          remainingAmount: updated.remainingAmount ?? 0,
          startDate: updated.startDate,
          endDate: updated.endDate,
          status: emailStatus, // Utiliser le statut corrigé si nécessaire
          period: bookingPeriod,
        },
        vehicle: {
          label: booking.vehicle
            ? `${booking.vehicle.brand} ${booking.vehicle.model}`
            : "Véhicule",
          licensePlate: booking.vehicle?.licensePlate ?? "ND",
        },
        locations: {
          pickup: booking.pickupLocation?.name ?? "Agence de départ",
          return: booking.returnLocation?.name ?? "Agence de retour",
        },
        modificationInfo: hasModificationData ? modificationInfo : undefined,
      });

      if (emailResult.skipped) {
        console.warn(`\n⚠️  [Admin Moderation] Email ignoré (credentials non configurés)`);
      } else if (!emailResult.success) {
        console.error(`\n❌ [Admin Moderation] Échec de l'envoi de l'email:`);
        console.error(`   - Erreur: ${emailResult.error ?? "Erreur inconnue"}`);
        console.error(`   - Référence: ${booking.reference}`);
      } else {
        console.log(`\n✅ [Admin Moderation] Email envoyé avec succès`);
      }
    } else {
      console.warn(`\n⚠️  [Admin Moderation] Impossible d'envoyer l'email: client non trouvé`);
      console.warn(`   - user.email: ${booking.user?.email ?? "N/A"}`);
      console.warn(`   - user.name: ${booking.user?.name ?? "N/A"}`);
    }

    // Si un paiement est nécessaire, l'URL est déjà incluse dans l'email envoyé au client
    if (paymentUrl) {
      console.log(`\n🔗 [Admin Moderation] URL de paiement créée et envoyée au client par email`);
      console.log(`   - URL: ${paymentUrl.substring(0, 80)}...`);
    }

    // Les logs finaux détaillés ont déjà été ajoutés plus haut (après la mise à jour de la DB)
    console.log(`\n✅ [Admin Moderation] ==========================================`);
    console.log(`✅ [Admin Moderation] 🎉 FIN handleModificationRequest - SUCCÈS (APPROVE)`);
    console.log(`✅ [Admin Moderation] ==========================================\n`);

    return {
      success: true,
    };
  } else {
    // Admin refuse la modification → restaurer les dates originales
    if (!booking.originalStartDate || !booking.originalEndDate) {
      console.error(`\n❌ [Admin Moderation] Impossible de rejeter la modification : dates originales manquantes`);
      console.error(`   - originalStartDate: ${booking.originalStartDate ? "✅ Présent" : "❌ Manquant"}`);
      console.error(`   - originalEndDate: ${booking.originalEndDate ? "✅ Présent" : "❌ Manquant"}`);
      console.error(`   - modificationRequested: ${booking.modificationRequested}`);
      console.error(`   - modificationDepositDifference: ${booking.modificationDepositDifference ?? "N/A"}`);
      console.error(`   - Note: Les dates originales devraient être conservées jusqu'au paiement du paiement supplémentaire.`);
      
      return {
        success: false,
        error: "Impossible de restaurer les dates originales. Les données sont manquantes. Si la modification a déjà été acceptée et payée, vous ne pouvez plus la rejeter.",
      };
    }

    // Les valeurs "originales" sont celles qui seront restaurées (les vraies dates originales)
    const originalTotalPrice = booking.originalTotalPrice ?? booking.totalPrice ?? 0;
    const originalDepositPaid = booking.originalDepositPaid ?? booking.depositPaid ?? 0;
    const originalRemainingAmount = originalTotalPrice - originalDepositPaid;

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        // Restaurer les dates et prix originaux
        startDate: booking.originalStartDate,
        endDate: booking.originalEndDate,
        totalPrice: originalTotalPrice,
        depositPaid: originalDepositPaid,
        remainingAmount: originalRemainingAmount,
        // Nettoyer les champs de demande
        modificationRequested: false,
        modificationRequestedAt: null,
        originalStartDate: null,
        originalEndDate: null,
        originalTotalPrice: null,
        originalDepositPaid: null,
        modificationDepositDifference: null,
        // Stocker le motif de refus si fourni
        modificationRejectionReason: rejectionReason || null,
        // Restaurer le statut précédent (probablement CONFIRMED)
        status: BookingStatus.CONFIRMED,
      } as Prisma.BookingUpdateInput,
      select: {
        startDate: true,
        endDate: true,
        totalPrice: true,
        depositPaid: true,
        remainingAmount: true,
        status: true,
      },
    });

    // Envoyer un email de refus avec les informations de comparaison
    if (booking.user?.email && booking.user.name) {
      const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";
      const bookingPeriod = `${format(
        updated.startDate,
        "dd MMMM yyyy 'à' HH:mm",
        { locale: fr },
      )} → ${format(updated.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;

      console.log(`\n📧 [Admin Moderation - Reject] rejectionReason:`);
      console.log(`   - rejectionReason: ${rejectionReason ?? "null/undefined"}`);
      console.log(`   - rejectionReason type: ${typeof rejectionReason}`);
      console.log(`   - rejectionReason length: ${rejectionReason?.length ?? "N/A"}`);

      // Pour un refus, on ne passe PAS modificationInfo car on ne veut pas afficher de comparaison
      // On affiche juste les informations finales (dates et prix restaurés)
      const emailResult = await emailModule.sendBookingUpdateEmail({
        to: booking.user.email,
        name: booking.user.name,
        greeting,
        booking: {
          reference: booking.reference,
          totalPrice: updated.totalPrice ?? 0,
          depositPaid: updated.depositPaid ?? 0,
          remainingAmount: updated.remainingAmount ?? 0,
          startDate: updated.startDate,
          endDate: updated.endDate,
          status: updated.status,
          period: bookingPeriod,
        },
        vehicle: {
          label: booking.vehicle
            ? `${booking.vehicle.brand} ${booking.vehicle.model}`
            : "Véhicule",
          licensePlate: booking.vehicle?.licensePlate ?? "ND",
        },
        locations: {
          pickup: booking.pickupLocation?.name ?? "Agence de départ",
          return: booking.returnLocation?.name ?? "Agence de retour",
        },
        // Ne pas passer modificationInfo lors d'un refus - on ne veut pas de comparaison
        modificationInfo: undefined,
        rejectionReason, // ✅ Passer le motif de refus si fourni
      });

      if (emailResult.skipped) {
        console.warn(
          `[Admin Moderation] ⚠️  Email de refus ignoré pour la réservation ${booking.reference}`,
        );
      } else if (!emailResult.success) {
        console.warn(
          `[Admin Moderation] ❌ Échec de l'envoi de l'email de refus pour la réservation ${booking.reference}:`,
          emailResult.error ?? "Erreur inconnue",
        );
      } else {
        console.log(
          `[Admin Moderation] ✅ Email de refus envoyé pour la réservation ${booking.reference}`,
        );
      }
    }

    // Logs finaux pour tracer le flux de refus
    console.log(`\n🎯 [Admin Moderation] ==========================================`);
    console.log(`🎯 [Admin Moderation] RÉSUMÉ DU REFUS DE MODIFICATION`);
    console.log(`🎯 [Admin Moderation] ==========================================`);
    console.log(`   - Référence: ${booking.reference}`);
    console.log(`   - Statut final: ${updated.status}`);
    console.log(`   - Motif de refus: ${rejectionReason ? "✅ Fourni" : "❌ Non fourni"}`);
    console.log(`   - Dates restaurées: ${updated.startDate.toISOString()} → ${updated.endDate.toISOString()}`);
    console.log(`   - Prix restauré: ${updated.totalPrice}€`);
    console.log(`   - Acompte restauré: ${updated.depositPaid}€`);
    console.log(`\n   📋 PROCHAINES ÉTAPES:`);
    console.log(`   ❌ Modification refusée par l'admin`);
    console.log(`   ✅ Statut: CONFIRMED (dates originales restaurées)`);
    console.log(`   📧 Email de refus envoyé au client avec le motif`);
    console.log(`   🚀 Redirection admin vers /admin/bookings dans 500ms`);
    console.log(`🎯 [Admin Moderation] ==========================================\n`);

    return {
      success: true,
    };
  }
}

export async function moderateBookingStatusAction(
  rawInput: z.input<typeof moderateSchema>,
): Promise<ModerateBookingResult> {
  console.log(`\n🟢 [ModerateBooking] ==========================================`);
  console.log(`🟢 [ModerateBooking] 🚀 DÉBUT moderateBookingStatusAction`);
  console.log(`🟢 [ModerateBooking] ==========================================\n`);

  try {
    const session = await auth();

    if (!session?.user) {
      console.error(`\n❌ [ModerateBooking] Erreur: Authentification requise`);
      return {
        success: false,
        error: "Authentification requise.",
      };
    }

    console.log(`🟢 [ModerateBooking] Utilisateur connecté: ${session.user.name} (${session.user.email})`);
    console.log(`🟢 [ModerateBooking] Rôle: ${session.user.role}`);

    if (session.user.role !== "ADMIN") {
      console.error(`\n❌ [ModerateBooking] Erreur: Permissions insuffisantes (rôle: ${session.user.role})`);
      return {
        success: false,
        error: "Permissions insuffisantes.",
      };
    }

    const parsed = moderateSchema.safeParse(rawInput);

    if (!parsed.success) {
      console.error(`\n❌ [ModerateBooking] Erreur: Données invalides`);
      console.error(`   - Erreurs:`, parsed.error.issues);
      return {
        success: false,
        error: "Données invalides.",
      };
    }

    const { bookingId, action } = parsed.data;
    console.log(`🟢 [ModerateBooking] Paramètres reçus:`);
    console.log(`   - bookingId: ${bookingId}`);
    console.log(`   - action: ${action}`);

    console.log(`🟢 [ModerateBooking] Récupération de la réservation depuis la base de données...`);
    
    const booking = (await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            brand: true,
            model: true,
            licensePlate: true,
          },
        },
        pickupLocation: {
          select: {
            name: true,
          },
        },
        returnLocation: {
          select: {
            name: true,
          },
        },
      },
    })) as (BookingModerationPayload & {
      modificationRequested?: boolean;
      modificationRequestedAt?: Date | null;
      originalStartDate?: Date | null;
      originalEndDate?: Date | null;
      originalTotalPrice?: number | null;
      originalDepositPaid?: number | null;
      modificationDepositDifference?: number | null;
      securityDepositPaid?: number | null;
    }) | null;

    if (!booking) {
      console.error(`\n❌ [ModerateBooking] Erreur: Réservation introuvable (ID: ${bookingId})`);
      return {
        success: false,
        error: "Réservation introuvable.",
      };
    }

    console.log(`🟢 [ModerateBooking] Réservation trouvée:`);
    console.log(`   - Référence: ${booking.reference}`);
    console.log(`   - Statut: ${booking.status}`);
    console.log(`   - Client: ${booking.user?.name ?? "N/A"} (${booking.user?.email ?? "N/A"})`);
    console.log(`   - Véhicule: ${booking.vehicle?.brand ?? "N/A"} ${booking.vehicle?.model ?? "N/A"}`);

    const emailModule = (await import("@/lib/email")) as unknown as EmailModule;

    const isCancellationRequest = booking.cancellationRequested;
    // IMPORTANT: Vérifier aussi modificationDepositDifference car après validation d'une modification,
    // modificationRequested peut être false mais modificationDepositDifference peut encore être présent
    // si un paiement est nécessaire (en attente de paiement)
    const hasModificationDepositDifference = (booking.modificationDepositDifference ?? 0) !== 0;
    const isModificationRequest = booking.modificationRequested === true || hasModificationDepositDifference;

    console.log(`🟢 [ModerateBooking] Type de demande:`);
    console.log(`   - isCancellationRequest: ${isCancellationRequest}`);
    console.log(`   - isModificationRequest: ${isModificationRequest}`);
    console.log(`   - modificationRequested (raw): ${booking.modificationRequested}`);
    console.log(`   - modificationDepositDifference: ${booking.modificationDepositDifference ?? "N/A"}`);
    console.log(`   - hasModificationDepositDifference: ${hasModificationDepositDifference}`);
    console.log(`   - modificationRequestedAt: ${booking.modificationRequestedAt ?? "N/A"}`);
    console.log(`   - originalStartDate: ${booking.originalStartDate ?? "N/A"}`);
    console.log(`   - originalEndDate: ${booking.originalEndDate ?? "N/A"}`);
    console.log(`   - originalTotalPrice: ${booking.originalTotalPrice ?? "N/A"}`);
    console.log(`   - originalDepositPaid: ${booking.originalDepositPaid ?? "N/A"}`);
    console.log(`   - status: ${booking.status}`);

    // Vérifier que la réservation est en attente de traitement
    if (!isCancellationRequest && !isModificationRequest && booking.status !== BookingStatus.PENDING) {
      console.error(`\n❌ [ModerateBooking] Erreur: Réservation déjà traitée`);
      console.error(`   - isCancellationRequest: ${isCancellationRequest}`);
      console.error(`   - isModificationRequest: ${isModificationRequest}`);
      console.error(`   - status: ${booking.status}`);
      return {
        success: false,
        error: "Cette réservation a déjà été traitée.",
      };
    }

    // Gérer les demandes de modification de dates
    // IMPORTANT: Inclure aussi les cas où modificationDepositDifference existe (modification validée mais paiement en attente)
    // MAIS si c'est une annulation ET une modification, prioriser l'annulation si action = "reject"
    // (car "Conserver la réservation" signifie rejeter l'annulation, pas la modification)
    
    if (isModificationRequest && !(isCancellationRequest && action === "reject")) {
      // Si c'est une modification ET pas de rejet d'annulation en même temps
      console.log(`\n🟢 [ModerateBooking] Appel de handleModificationRequest...`);
      const result = await handleModificationRequest(booking, action, emailModule, parsed.data.rejectionReason);
      console.log(`\n🟢 [ModerateBooking] Résultat de handleModificationRequest:`);
      console.log(`   - success: ${result.success}`);
      console.log(`   - error: ${result.error ?? "Aucune erreur"}`);
      console.log(`\n🟢 [ModerateBooking] ==========================================`);
      console.log(`🟢 [ModerateBooking] 🎉 FIN moderateBookingStatusAction`);
      console.log(`🟢 [ModerateBooking] ==========================================\n`);
      return result;
    }

    if (isCancellationRequest) {
      const previousStatus = booking.cancellationPreviousStatus ?? BookingStatus.CONFIRMED;

      if (action === "approve") {
        const defaultSettings = createDefaultAdminSettings();
        const defaultPolicy = defaultSettings.configuration.cancellationPolicy;
        const now = new Date();
        const referenceDate = booking.cancellationRequestedAt ?? now;
        const refundRate =
          booking.cancellationRequestedRefundRate ??
          computeRefundRate(booking.startDate, referenceDate);
        const depositPaid = booking.depositPaid ?? 0;
        const refundAmount = roundCurrency(depositPaid * refundRate);
        const retentionAmount = roundCurrency(depositPaid - refundAmount);

        const cancellationPolicySetting = await prisma.setting.findUnique({
          where: { key: "config.cancellationPolicy" },
          select: { value: true },
        });

        const cancellationPolicy =
          typeof cancellationPolicySetting?.value === "string"
            ? cancellationPolicySetting.value
            : defaultPolicy;

        // Créer le remboursement Stripe si un remboursement est dû
        if (refundAmount > 0 && depositPaid > 0) {
          const { createRefundAction } = await import("@/actions/public/payments/create-refund");
          const refundResult = await createRefundAction({
            bookingId: booking.id,
            amount: refundAmount,
            reason: "cancellation",
          });

          if (!refundResult.success) {
            console.error("[Admin Moderation] Erreur lors du remboursement d'annulation:", refundResult.error);
            
            // Vérifier si l'erreur est due au fait que le Payment Intent a déjà été complètement remboursé
            const isRefundErrorRecoverable = 
              refundResult.error?.includes("déjà été complètement remboursé") ||
              refundResult.error?.includes("remboursable disponible : 0") ||
              refundResult.error?.includes("remboursable est de") ||
              refundResult.error?.includes("Aucun remboursement supplémentaire");
            
            if (isRefundErrorRecoverable) {
              console.warn(`\n⚠️  [Admin Moderation] Erreur de remboursement récupérable pour l'annulation`);
              console.warn(`   - Le Payment Intent a déjà été complètement remboursé`);
              console.warn(`   - Erreur: ${refundResult.error}`);
              console.warn(`   - L'annulation sera validée mais aucun remboursement automatique ne sera effectué`);
              console.warn(`   - Le remboursement a déjà été géré précédemment`);
              // On continue sans créer de remboursement Stripe - l'annulation peut quand même être acceptée
            } else {
              // Pour les autres erreurs (erreurs Stripe, etc.), on arrête
              return {
                success: false,
                error: `Erreur lors du remboursement: ${refundResult.error}`,
              };
            }
          }
          console.log(`[Admin Moderation] ✅ Remboursement d'annulation créé: ${refundAmount}€ (${(refundRate * 100).toFixed(0)}%)`);
        } else if (refundAmount === 0 && depositPaid > 0) {
          console.log(`[Admin Moderation] ℹ️  Aucun remboursement dû pour cette annulation (taux: ${(refundRate * 100).toFixed(0)}%)`);
        }

        const updated = await prisma.$transaction(async (tx) => {
          const updatedBooking = await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: BookingStatus.CANCELLED,
              cancelledAt: now,
              remainingAmount: 0,
              cancellationRequested: false,
              cancellationRequestedAt: null,
              cancellationRequestedRefundRate: null,
              cancellationPreviousStatus: null,
            } as Prisma.BookingUpdateInput,
            select: {
              startDate: true,
              endDate: true,
              totalPrice: true,
              depositPaid: true,
              remainingAmount: true,
            },
          });

          await tx.invoice.updateMany({
            where: {
              bookingId,
              status: {
                not: InvoiceStatus.CANCELLED,
              },
            },
            data: {
              status: InvoiceStatus.CANCELLED,
            },
          });

          return updatedBooking;
        });

        if (booking.user?.email && booking.user.name) {
          const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";
          const bookingPeriod = `${format(
            updated.startDate,
            "dd MMMM yyyy 'à' HH:mm",
            { locale: fr },
          )} → ${format(updated.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;

          const emailResult = await emailModule.sendBookingCancellationEmail({
            to: booking.user.email,
            name: booking.user.name,
            greeting,
            booking: {
              reference: booking.reference,
              totalPrice: updated.totalPrice ?? 0,
              depositPaid: updated.depositPaid ?? 0,
              remainingAmount: updated.remainingAmount ?? 0,
              startDate: updated.startDate,
              endDate: updated.endDate,
              refundAmount,
              refundRate,
              refundLabel:
                refundRate === 1
                  ? "Remboursement intégral (100%)"
                  : refundRate === 0.5
                  ? "Remboursement partiel (50%)"
                  : "Pas de remboursement (0%)",
              retentionAmount,
              period: bookingPeriod,
              reason: booking.cancellationReason,
            },
            vehicle: {
              label: booking.vehicle
                ? `${booking.vehicle.brand} ${booking.vehicle.model}`
                : "Véhicule",
              licensePlate: booking.vehicle?.licensePlate ?? "ND",
            },
            locations: {
              pickup: booking.pickupLocation?.name ?? "Agence de départ",
              return: booking.returnLocation?.name ?? "Agence de retour",
            },
            policy: cancellationPolicy,
          });

          if (emailResult.skipped) {
            console.warn(
              `[Admin Bookings] ⚠️  Email d'annulation ignoré pour la réservation ${booking.reference} (credentials non configurés). Vérifiez GMAIL_USER et GMAIL_PASSWORD dans .env`,
            );
          } else if (!emailResult.success) {
            console.warn(
              `[Admin Bookings] ❌ Échec de l'envoi de l'email d'annulation pour la réservation ${booking.reference}:`,
              emailResult.error ?? "Erreur inconnue",
            );
          } else {
            console.log(
              `[Admin Bookings] ✅ Email d'annulation envoyé pour la réservation ${booking.reference}`,
            );
          }
        }
      } else {
        // Action "reject" - Refuser la demande d'annulation (Conserver la réservation)
        // IMPORTANT: Vérifier s'il y a aussi une modification en cours
        // Si oui, on ne restaure pas les dates car elles sont déjà modifiées
        // On remet juste cancellationRequested à false
        
        console.log(`\n🟢 [ModerateBooking] Rejet de l'annulation - Conservation de la réservation`);
        console.log(`   - Statut précédent: ${previousStatus}`);
        console.log(`   - Modification en cours: ${isModificationRequest}`);
        console.log(`   - Dates originales disponibles: ${booking.originalStartDate ? "OUI" : "NON"}`);
        
        // Si une modification est en cours, on garde les dates actuelles
        // et on nettoie juste la demande d'annulation
        const updateData: Prisma.BookingUpdateInput = {
          cancellationRequested: false,
          cancellationRequestedAt: null,
          cancellationRequestedRefundRate: null,
          cancellationPreviousStatus: null,
        };
        
        // Si PAS de modification en cours, on restaure le statut précédent
        // Si une modification est en cours, on garde le statut actuel (qui est probablement PENDING pour la modification)
        if (!isModificationRequest) {
          updateData.status = previousStatus;
          console.log(`   - Restauration du statut à: ${previousStatus}`);
        } else {
          console.log(`   - Modification en cours détectée - conservation du statut actuel: ${booking.status}`);
        }
        
        // Ajouter le message de refus si fourni
        updateData.cancellationReason = null;
        updateData.cancellationRejectionReason = parsed.data.rejectionReason || null;
        
        const restored = await prisma.booking.update({
          where: { id: bookingId },
          data: updateData,
          select: {
            startDate: true,
            endDate: true,
            totalPrice: true,
            depositPaid: true,
            remainingAmount: true,
          },
        });

        if (booking.user?.email && booking.user.name) {
          const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";
          const bookingPeriod = `${format(
            restored.startDate,
            "dd MMMM yyyy 'à' HH:mm",
            { locale: fr },
          )} → ${format(restored.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;

          const emailResult = await emailModule.sendBookingCancellationRejectedEmail({
            to: booking.user.email,
            name: booking.user.name,
            greeting,
            booking: {
              reference: booking.reference,
              totalPrice: restored.totalPrice ?? 0,
              depositPaid: restored.depositPaid ?? 0,
              remainingAmount: restored.remainingAmount ?? 0,
              startDate: restored.startDate,
              endDate: restored.endDate,
              period: bookingPeriod,
              reason: booking.cancellationReason,
              rejectionReason: parsed.data.rejectionReason || null, // Message de refus de l'admin
            },
            vehicle: {
              label: booking.vehicle
                ? `${booking.vehicle.brand} ${booking.vehicle.model}`
                : "Véhicule",
              licensePlate: booking.vehicle?.licensePlate ?? "ND",
            },
            locations: {
              pickup: booking.pickupLocation?.name ?? "Agence de départ",
              return: booking.returnLocation?.name ?? "Agence de retour",
            },
          });

          if (emailResult.skipped) {
            console.warn(
              `[Admin Bookings] ⚠️  Email de refus d'annulation ignoré pour la réservation ${booking.reference} (credentials non configurés). Vérifiez GMAIL_USER et GMAIL_PASSWORD dans .env`,
            );
          } else if (!emailResult.success) {
            console.warn(
              `[Admin Bookings] ❌ Échec de l'envoi de l'email de refus d'annulation pour la réservation ${booking.reference}:`,
              emailResult.error ?? "Erreur inconnue",
            );
          } else {
            console.log(
              `[Admin Bookings] ✅ Email de refus d'annulation envoyé pour la réservation ${booking.reference}`,
            );
          }
        }
      }
    } else {
      // Validation simple d'une réservation
      // ⚠️ RÈGLE CRITIQUE: Si la réservation est PENDING, on NE PEUT PAS la confirmer manuellement
      // SAUF si c'est une modification en attente de paiement (modificationDepositDifference existe)
      // Le statut PENDING signifie qu'une action est en attente (paiement, etc.)
      // Le statut ne passera à CONFIRMED que via le webhook Stripe après paiement
      
      // Vérifier si c'est une modification en attente de paiement
      const hasModificationPendingPayment = (booking.modificationDepositDifference ?? 0) !== 0;
      
      if (booking.status === BookingStatus.PENDING && action === "approve" && !hasModificationPendingPayment) {
        console.log(`🟢 [ModerateBooking] ⚠️  Tentative de confirmation manuelle d'une réservation PENDING:`);
        console.log(`   - Statut actuel: PENDING`);
        console.log(`   - Action demandée: approve`);
        console.log(`   - hasModificationPendingPayment: ${hasModificationPendingPayment}`);
        console.log(`   - ❌ IMPOSSIBLE de confirmer manuellement - le statut doit rester PENDING jusqu'au paiement`);
        return {
          success: false,
          error: "Cette réservation est en attente de paiement. Le statut passera automatiquement à CONFIRMED une fois le paiement effectué.",
        };
      }
      
      // Pour les autres statuts, on peut procéder normalement
      const nextStatus =
        action === "approve" ? BookingStatus.CONFIRMED : BookingStatus.CANCELLED;

      console.log(`🟢 [ModerateBooking] Statut qui sera appliqué: ${nextStatus}`);

      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: nextStatus,
        } as Prisma.BookingUpdateInput,
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          reference: true,
          totalPrice: true,
          depositPaid: true,
          remainingAmount: true,
        },
      });

      if (booking.user?.email && booking.user.name) {
        const greeting = new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour";
        const bookingPeriod = `${format(
          updated.startDate,
          "dd MMMM yyyy 'à' HH:mm",
          { locale: fr },
        )} → ${format(updated.endDate, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`;

        const emailResult = await emailModule.sendBookingUpdateEmail({
          to: booking.user.email,
          name: booking.user.name,
          greeting,
          booking: {
            reference: booking.reference,
            totalPrice: updated.totalPrice ?? 0,
            depositPaid: updated.depositPaid ?? 0,
            remainingAmount: updated.remainingAmount ?? 0,
            startDate: updated.startDate,
            endDate: updated.endDate,
            status: updated.status,
            period: bookingPeriod,
          },
          vehicle: {
            label: booking.vehicle
              ? `${booking.vehicle.brand} ${booking.vehicle.model}`
              : "Véhicule",
            licensePlate: booking.vehicle?.licensePlate ?? "ND",
          },
          locations: {
            pickup: booking.pickupLocation?.name ?? "Agence de départ",
            return: booking.returnLocation?.name ?? "Agence de retour",
          },
        });

        if (emailResult.skipped) {
          console.warn(
            `[Admin Bookings] ⚠️  Email de modération ignoré pour la réservation ${booking.reference} (credentials non configurés). Vérifiez GMAIL_USER et GMAIL_PASSWORD dans .env`,
          );
        } else if (!emailResult.success) {
          console.warn(
            `[Admin Bookings] ❌ Échec de l'envoi de l'email de modération pour la réservation ${booking.reference}:`,
            emailResult.error ?? "Erreur inconnue",
          );
        } else {
          console.log(
            `[Admin Bookings] ✅ Email de modération envoyé pour la réservation ${booking.reference}`,
          );
        }
      }
    }

    // Revalider tous les chemins pertinents, y compris la page de détails spécifique
    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${bookingId}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/statistics");
    revalidatePath("/admin/invoices");
    revalidatePath("/dashboard");

    // Invalider le cache des réservations et de disponibilité
    const { invalidateBookingCache, invalidateVehicleAvailabilityCache } = await import("@/lib/cache-invalidation");
    await Promise.all([
      invalidateBookingCache(booking.id).catch((error) => {
        console.error("Error invalidating booking cache:", error);
      }),
      invalidateVehicleAvailabilityCache(booking.vehicleId).catch((error) => {
        console.error("Error invalidating vehicle availability cache:", error);
      }),
    ]);

    return {
      success: true,
    };
  } catch (error) {
    console.error("[Admin Bookings] moderate error", error);
    return {
      success: false,
      error: "Impossible de traiter la réservation, veuillez réessayer.",
    };
  }
}

