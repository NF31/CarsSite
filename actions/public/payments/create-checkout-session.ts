"use server";

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export interface CreateCheckoutSessionInput {
  bookingId: string;
  amount: number; // Montant en centimes (acompte + caution)
  description: string;
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
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: "Vous devez être connecté pour effectuer un paiement.",
      };
    }

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
      },
    });

    if (!booking) {
      return {
        success: false,
        error: "Réservation introuvable.",
      };
    }

    if (booking.userId !== session.user.id) {
      return {
        success: false,
        error: "Vous n'êtes pas autorisé à payer cette réservation.",
      };
    }

    // Vérifier que le montant est valide
    if (input.amount <= 0) {
      return {
        success: false,
        error: "Le montant doit être supérieur à zéro.",
      };
    }

    // Créer la session de paiement Stripe avec personnalisation aux couleurs du site
    const checkoutSession = await stripe.checkout.sessions.create({
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
      success_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/bookings/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/bookings/payment/cancel?booking_id=${booking.id}`,
      customer_email: session.user.email || undefined,
      metadata: {
        bookingId: booking.id,
        userId: session.user.id,
        bookingReference: booking.reference,
      },
      // Note: La personnalisation des couleurs doit être configurée dans Stripe Dashboard
      // Dashboard > Settings > Branding
      // Couleurs à utiliser:
      // - Primary Color: #3B82F6 (Bleu)
      // - Accent Color: #10B981 (Vert)
      // - Background: #FFFFFF (Blanc)
      // - Text: #111827 (Gris foncé)
      custom_text: {
        submit: {
          message: "En cliquant sur ce bouton, vous confirmez votre paiement sécurisé.",
        },
      },
      payment_intent_data: {
        description: `Paiement pour la réservation ${booking.reference}`,
      },
    });

    return {
      success: true,
      url: checkoutSession.url || undefined,
    };
  } catch (error) {
    console.error("[Payment] Erreur lors de la création de la session Stripe:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la création de la session de paiement.",
    };
  }
}

