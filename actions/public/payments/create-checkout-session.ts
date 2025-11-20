"use server";

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export interface CreateCheckoutSessionInput {
  bookingId: string;
  amount: number; // Montant en euros (acompte + caution)
  description: string;
  paymentType?: "deposit" | "full" | "authorization"; // Type de paiement
  isModificationPayment?: boolean; // Indique si c'est un paiement supplémentaire pour une modification
  modificationMetadata?: {
    originalTotalPrice: string;
    originalDepositPaid: string;
    originalRemainingAmount: string;
    depositDifference: string;
    securityDepositPaid: string;
  }; // Métadonnées de modification pour le webhook
}

export interface CreateCheckoutSessionResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Crée une session de paiement Stripe pour une réservation
 */
export async function createCheckoutSessionAction(
  input: CreateCheckoutSessionInput
): Promise<CreateCheckoutSessionResult> {
  console.log(`\n💳 [CreateCheckoutSession] ==========================================`);
  console.log(`💳 [CreateCheckoutSession] 🚀 DÉBUT createCheckoutSessionAction`);
  console.log(`💳 [CreateCheckoutSession] ==========================================\n`);

  try {
    const session = await auth();

    if (!session?.user) {
      console.error(`\n❌ [CreateCheckoutSession] Erreur: Utilisateur non connecté`);
      return {
        success: false,
        error: "Vous devez être connecté pour effectuer un paiement.",
      };
    }

    console.log(`💳 [CreateCheckoutSession] Utilisateur connecté: ${session.user.name} (${session.user.email})`);
    console.log(`💳 [CreateCheckoutSession] Rôle: ${session.user.role}`);
    console.log(`💳 [CreateCheckoutSession] Paramètres reçus:`);
    console.log(`   - bookingId: ${input.bookingId}`);
    console.log(`   - amount: ${input.amount}€`);
    console.log(`   - description: ${input.description}`);
    console.log(`   - paymentType: ${input.paymentType ?? "full"}`);

    console.log(`💳 [CreateCheckoutSession] Récupération de la réservation depuis la base de données...`);
    
    // Vérifier que la réservation existe et appartient à l'utilisateur
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: {
        id: true,
        userId: true,
        reference: true,
        totalPrice: true,
        depositPaid: true,
        status: true,
        vehicle: {
          select: {
            brand: true,
            model: true,
            licensePlate: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!booking) {
      console.error(`\n❌ [CreateCheckoutSession] Erreur: Réservation introuvable (ID: ${input.bookingId})`);
      return {
        success: false,
        error: "Réservation introuvable.",
      };
    }

    console.log(`💳 [CreateCheckoutSession] Réservation trouvée:`);
    console.log(`   - Référence: ${booking.reference}`);
    console.log(`   - User ID (propriétaire): ${booking.userId}`);
    console.log(`   - User ID (connecté): ${session.user.id}`);
    console.log(`   - Email client: ${booking.user?.email ?? "N/A"}`);

    // Autoriser l'admin à créer des sessions de paiement pour n'importe quelle réservation
    // (utile pour les paiements supplémentaires après modification de dates)
    const isAdmin = session.user.role === "ADMIN";
    console.log(`💳 [CreateCheckoutSession] Vérification d'autorisation:`);
    console.log(`   - isAdmin: ${isAdmin}`);
    console.log(`   - booking.userId === session.user.id: ${booking.userId === session.user.id}`);
    
    if (!isAdmin && booking.userId !== session.user.id) {
      console.error(`\n❌ [CreateCheckoutSession] Erreur: Utilisateur non autorisé`);
      console.error(`   - L'utilisateur connecté n'est pas le propriétaire de la réservation`);
      console.error(`   - Et n'est pas un admin`);
      return {
        success: false,
        error: "Vous n'êtes pas autorisé à payer cette réservation.",
      };
    }

    console.log(`✅ [CreateCheckoutSession] Autorisation validée`);

    // Vérifier que le montant est valide
    if (input.amount <= 0) {
      console.error(`\n❌ [CreateCheckoutSession] Erreur: Montant invalide (${input.amount}€)`);
      return {
        success: false,
        error: "Le montant doit être supérieur à zéro.",
      };
    }

    const paymentType = input.paymentType || "full";
    const isAuthorization = paymentType === "authorization";
    
    console.log(`💳 [CreateCheckoutSession] Configuration de la session Stripe:`);
    console.log(`   - paymentType: ${paymentType}`);
    console.log(`   - isAuthorization: ${isAuthorization}`);
    console.log(`   - amount: ${input.amount}€ (${Math.round(input.amount * 100)} centimes)`);
    
    // Créer la session de paiement Stripe avec personnalisation aux couleurs du site
    // Pour les paiements supplémentaires de modification, expiration après 3 heures
    // Pour les paiements normaux, expiration après 24 heures (défaut Stripe)
    const expirationHours = input.isModificationPayment ? 3 : 24;
    const expiresAt = Math.floor(Date.now() / 1000) + (expirationHours * 60 * 60);
    
    const checkoutSessionConfig: any = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Réservation ${booking.reference}`,
              description: input.description,
              metadata: {
                bookingId: booking.id,
                bookingReference: booking.reference,
                vehicle: `${booking.vehicle.brand} ${booking.vehicle.model}`,
              },
            },
            unit_amount: Math.round(input.amount * 100), // Convertir en centimes
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      expires_at: expiresAt, // Expiration explicite de la session (timestamp Unix)
      success_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/bookings/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/bookings/payment/cancel?booking_id=${booking.id}`,
      // Utiliser l'email du client propriétaire de la réservation, pas celui de l'admin
      customer_email: booking.user?.email || session.user.email || undefined,
      metadata: {
        bookingId: booking.id,
        userId: session.user.id,
        bookingReference: booking.reference,
        paymentType: paymentType,
        isModificationPayment: input.isModificationPayment ? "true" : "false",
        // Ajouter les métadonnées de modification si présentes
        ...(input.modificationMetadata ? {
          originalTotalPrice: input.modificationMetadata.originalTotalPrice,
          originalDepositPaid: input.modificationMetadata.originalDepositPaid,
          originalRemainingAmount: input.modificationMetadata.originalRemainingAmount,
          depositDifference: input.modificationMetadata.depositDifference,
          securityDepositPaid: input.modificationMetadata.securityDepositPaid,
        } : {}),
      },
      custom_text: {
        submit: {
          message: isAuthorization 
            ? "En cliquant sur ce bouton, vous confirmez l'empreinte bancaire (aucun débit ne sera effectué)."
            : "En cliquant sur ce bouton, vous confirmez votre paiement sécurisé.",
        },
      },
      payment_intent_data: {
        description: `Paiement pour la réservation ${booking.reference}`,
        capture_method: isAuthorization ? "manual" : "automatic", // Pour l'empreinte, on ne capture pas immédiatement
      },
    };

    console.log(`💳 [CreateCheckoutSession] Configuration complète:`);
    console.log(`   - customer_email: ${checkoutSessionConfig.customer_email ?? "N/A"}`);
    console.log(`   - expires_at: ${new Date(expiresAt * 1000).toISOString()} (${expirationHours}h)`);
    console.log(`   - success_url: ${checkoutSessionConfig.success_url}`);
    console.log(`   - cancel_url: ${checkoutSessionConfig.cancel_url}`);
    console.log(`   - metadata.bookingId: ${checkoutSessionConfig.metadata.bookingId}`);
    console.log(`   - metadata.userId: ${checkoutSessionConfig.metadata.userId}`);
    console.log(`   - metadata.paymentType: ${checkoutSessionConfig.metadata.paymentType}`);
    console.log(`   - isModificationPayment: ${input.isModificationPayment ? "OUI" : "NON"}`);
    console.log(`💳 [CreateCheckoutSession] Création de la session Stripe...`);
    
    const checkoutSession = await stripe.checkout.sessions.create(checkoutSessionConfig);

    console.log(`\n✅ [CreateCheckoutSession] Session Stripe créée avec succès:`);
    console.log(`   - Session ID: ${checkoutSession.id}`);
    console.log(`   - URL: ${checkoutSession.url ?? "N/A"}`);
    console.log(`   - Status: ${checkoutSession.status ?? "N/A"}`);
    console.log(`\n💳 [CreateCheckoutSession] ==========================================`);
    console.log(`💳 [CreateCheckoutSession] 🎉 FIN createCheckoutSessionAction - SUCCÈS`);
    console.log(`💳 [CreateCheckoutSession] ==========================================\n`);

    return {
      success: true,
      url: checkoutSession.url || undefined,
    };
  } catch (error) {
    console.error(`\n❌ [CreateCheckoutSession] ERREUR lors de la création de la session Stripe:`);
    console.error(`   - Erreur:`, error);
    console.error(`   - Stack:`, error instanceof Error ? error.stack : "N/A");
    console.error(`\n💳 [CreateCheckoutSession] ==========================================`);
    console.error(`💳 [CreateCheckoutSession] ❌ FIN createCheckoutSessionAction - ÉCHEC`);
    console.error(`💳 [CreateCheckoutSession] ==========================================\n`);
    
    console.error("[Payment] Erreur lors de la création de la session Stripe:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la création de la session de paiement.",
    };
  }
}

