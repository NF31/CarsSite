import { PrismaClient } from "@prisma/client";
import { stripe } from "@/lib/stripe";

const prisma = new PrismaClient();

async function checkStripeRefunds() {
  console.log("=".repeat(80));
  console.log("🔍 VÉRIFICATION DES REMBOURSEMENTS DANS STRIPE");
  console.log("=".repeat(80));
  console.log("");

  // 1. Récupérer tous les remboursements de la base de données
  const refundsInDB = await prisma.payment.findMany({
    where: {
      transactionId: {
        startsWith: "re_",
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`📊 Remboursements trouvés en base de données: ${refundsInDB.length}`);
  console.log("");

  if (refundsInDB.length === 0) {
    console.log("❌ Aucun remboursement trouvé en base de données");
    await prisma.$disconnect();
    return;
  }

  // 2. Vérifier chaque remboursement dans Stripe
  for (const refund of refundsInDB) {
    const refundId = refund.transactionId;
    const booking = await prisma.booking.findUnique({
      where: { id: refund.bookingId },
      select: {
        reference: true,
        status: true,
      },
    });

    console.log("=".repeat(80));
    console.log(`🔴 Remboursement: ${refundId}`);
    console.log(`   - Réservation: ${booking?.reference || "N/A"}`);
    console.log(`   - Montant en DB: ${refund.amount.toFixed(2)}€`);
    console.log(`   - Statut en DB: ${refund.status}`);
    console.log(`   - Date en DB: ${refund.createdAt.toISOString()}`);
    console.log("");

    if (!refundId) {
      console.log(`   ⚠️  Pas d'ID de remboursement Stripe`);
      continue;
    }

    try {
      // Récupérer le remboursement depuis Stripe
      const stripeRefund = await stripe.refunds.retrieve(refundId);

      console.log(`   ✅ REMBOURSEMENT TROUVÉ DANS STRIPE:`);
      console.log(`      - ID: ${stripeRefund.id}`);
      console.log(`      - Montant: ${(stripeRefund.amount / 100).toFixed(2)}€`);
      console.log(`      - Statut Stripe: ${stripeRefund.status}`);
      console.log(`      - Raison: ${stripeRefund.reason || "N/A"}`);
      console.log(`      - Payment Intent: ${stripeRefund.payment_intent || "N/A"}`);
      console.log(`      - Charge: ${stripeRefund.charge || "N/A"}`);
      console.log(`      - Créé le: ${new Date(stripeRefund.created * 1000).toISOString()}`);
      console.log(`      - Métadonnées:`, JSON.stringify(stripeRefund.metadata, null, 2));
      console.log("");

      // Comparer les statuts
      const dbStatus = refund.status;
      const stripeStatus = stripeRefund.status;
      
      let statusMatch = false;
      if (dbStatus === "COMPLETED" && stripeStatus === "succeeded") {
        statusMatch = true;
      } else if (dbStatus === "PENDING" && (stripeStatus === "pending" || stripeStatus === "processing")) {
        statusMatch = true;
      } else if (dbStatus === "FAILED" && (stripeStatus === "failed" || stripeStatus === "canceled")) {
        statusMatch = true;
      }

      if (statusMatch) {
        console.log(`   ✅ Statuts synchronisés: DB=${dbStatus}, Stripe=${stripeStatus}`);
      } else {
        console.log(`   ⚠️  Statuts NON synchronisés: DB=${dbStatus}, Stripe=${stripeStatus}`);
        console.log(`   💡 Action recommandée: Mettre à jour le statut en base de données`);
      }

      // Comparer les montants
      const dbAmount = Math.abs(refund.amount);
      const stripeAmount = stripeRefund.amount / 100;
      const amountDiff = Math.abs(dbAmount - stripeAmount);

      if (amountDiff < 0.01) {
        console.log(`   ✅ Montants synchronisés: DB=${dbAmount.toFixed(2)}€, Stripe=${stripeAmount.toFixed(2)}€`);
      } else {
        console.log(`   ⚠️  Montants NON synchronisés: DB=${dbAmount.toFixed(2)}€, Stripe=${stripeAmount.toFixed(2)}€ (diff: ${amountDiff.toFixed(2)}€)`);
      }

      // Vérifier le Payment Intent associé
      if (stripeRefund.payment_intent && typeof stripeRefund.payment_intent === "string") {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(stripeRefund.payment_intent);
          console.log(`   📋 Payment Intent associé:`);
          console.log(`      - ID: ${paymentIntent.id}`);
          console.log(`      - Montant: ${(paymentIntent.amount / 100).toFixed(2)}€`);
          console.log(`      - Statut: ${paymentIntent.status}`);
          console.log(`      - Métadonnées:`, JSON.stringify(paymentIntent.metadata, null, 2));
        } catch (piError) {
          console.log(`   ⚠️  Impossible de récupérer le Payment Intent: ${piError}`);
        }
      }

    } catch (stripeError: unknown) {
      const error = stripeError as { code?: string; message?: string; type?: string };
      if (error.code === "resource_missing") {
        console.log(`   ❌ REMBOURSEMENT NON TROUVÉ DANS STRIPE`);
        console.log(`      - Le remboursement ${refundId} n'existe pas dans Stripe`);
        console.log(`      - Il a peut-être été supprimé ou n'a jamais été créé`);
      } else {
        console.log(`   ❌ ERREUR lors de la récupération depuis Stripe:`);
        console.log(`      - Code: ${error.code || "N/A"}`);
        console.log(`      - Message: ${error.message || "N/A"}`);
      }
    }

    console.log("");
  }

  // 3. Récupérer tous les remboursements depuis Stripe (pour comparaison)
  console.log("=".repeat(80));
  console.log("🔍 TOUS LES REMBOURSEMENTS DANS STRIPE (100 derniers):");
  console.log("=".repeat(80));
  console.log("");

  try {
    const stripeRefunds = await stripe.refunds.list({
      limit: 100,
    });

    console.log(`📊 Total remboursements dans Stripe: ${stripeRefunds.data.length}`);
    console.log("");

    // Grouper par réservation si possible
    const refundsByBooking: Record<string, typeof stripeRefunds.data> = {};
    const refundsWithoutBooking: typeof stripeRefunds.data = [];

    for (const refund of stripeRefunds.data) {
      const bookingId = refund.metadata?.bookingId;
      if (bookingId) {
        if (!refundsByBooking[bookingId]) {
          refundsByBooking[bookingId] = [];
        }
        refundsByBooking[bookingId].push(refund);
      } else {
        refundsWithoutBooking.push(refund);
      }
    }

    // Afficher les remboursements groupés par réservation
    for (const [bookingId, refunds] of Object.entries(refundsByBooking)) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          reference: true,
        },
      });

      console.log(`📦 Réservation: ${booking?.reference || "N/A"} (${bookingId})`);
      console.log(`   Nombre de remboursements: ${refunds.length}`);
      refunds.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.id} - ${(r.amount / 100).toFixed(2)}€ - ${r.status} - ${new Date(r.created * 1000).toISOString()}`);
      });
      console.log("");
    }

    // Afficher les remboursements sans bookingId
    if (refundsWithoutBooking.length > 0) {
      console.log(`📦 Remboursements sans bookingId (${refundsWithoutBooking.length}):`);
      refundsWithoutBooking.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.id} - ${(r.amount / 100).toFixed(2)}€ - ${r.status}`);
      });
      console.log("");
    }

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.log(`❌ Erreur lors de la récupération des remboursements Stripe:`, err.message || "Erreur inconnue");
  }

  await prisma.$disconnect();
}

checkStripeRefunds()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  });

