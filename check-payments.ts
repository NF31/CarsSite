import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkPayments() {
  const bookingId = "cmi6j5wk40005ft1kk3hftmb1";
  const bookingReference = "BK-2025-0006";

  console.log("=".repeat(80));
  console.log("🔍 VÉRIFICATION DES PAIEMENTS POUR LA RÉSERVATION");
  console.log("=".repeat(80));
  console.log(`Booking ID: ${bookingId}`);
  console.log(`Booking Reference: ${bookingReference}`);
  console.log("");

  // 1. Récupérer la réservation
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      reference: true,
      depositPaid: true,
      originalDepositPaid: true,
      totalPrice: true,
      status: true,
    },
  });

  if (!booking) {
    console.log("❌ Réservation introuvable");
    await prisma.$disconnect();
    return;
  }

  console.log("📋 INFORMATIONS DE LA RÉSERVATION:");
  console.log(`   - Référence: ${booking.reference}`);
  console.log(`   - Statut: ${booking.status}`);
  console.log(`   - Prix total: ${booking.totalPrice.toFixed(2)}€`);
  console.log(`   - Acompte payé: ${(booking.depositPaid || 0).toFixed(2)}€`);
  console.log(`   - Acompte original: ${(booking.originalDepositPaid || 0).toFixed(2)}€`);
  console.log("");

  // 2. Récupérer TOUS les paiements (sans AUCUN filtre - absolument tous)
  const allPayments = await prisma.payment.findMany({
    where: {
      bookingId: bookingId,
    },
    orderBy: {
      createdAt: "asc",
    },
    // Pas de select, on veut TOUT
  });

  console.log("=".repeat(80));
  console.log(`💰 TOUS LES PAIEMENTS (${allPayments.length} total):`);
  console.log("=".repeat(80));

  if (allPayments.length === 0) {
    console.log("❌ Aucun paiement trouvé pour cette réservation");
  } else {
    allPayments.forEach((payment, index) => {
      const metadata = payment.metadata as any;
      const isRefund = payment.transactionId?.startsWith("re_") || payment.amount < 0;
      const isCheckoutSession = payment.transactionId?.startsWith("cs_");
      const isPaymentIntent = payment.transactionId?.startsWith("pi_");
      
      console.log("");
      console.log(`📦 Paiement #${index + 1}:`);
      console.log(`   - ID: ${payment.id}`);
      console.log(`   - Montant: ${payment.amount.toFixed(2)}€ ${isRefund ? "🔴 (REMBOURSEMENT)" : "🟢 (PAIEMENT)"}`);
      console.log(`   - Statut: ${payment.status}`);
      console.log(`   - Méthode: ${payment.method}`);
      console.log(`   - Transaction ID: ${payment.transactionId || "N/A"}`);
      if (isRefund) {
        console.log(`   - ⚠️  TYPE: REMBOURSEMENT STRIPE (re_)`);
      } else if (isCheckoutSession) {
        console.log(`   - ℹ️  TYPE: Checkout Session (cs_)`);
      } else if (isPaymentIntent) {
        console.log(`   - ℹ️  TYPE: Payment Intent (pi_)`);
      }
      console.log(`   - Date: ${payment.createdAt.toISOString()}`);
      console.log(`   - isModificationPayment: ${metadata?.isModificationPayment ?? "N/A"}`);
      if (metadata) {
        console.log(`   - Métadonnées complètes:`, JSON.stringify(metadata, null, 2));
      } else {
        console.log(`   - Métadonnées: Aucune`);
      }
    });
  }

  console.log("");
  console.log("=".repeat(80));
  console.log("📊 RÉSUMÉ:");
  console.log("=".repeat(80));
  console.log(`   - Total paiements: ${allPayments.length}`);
  console.log(`   - Paiements positifs: ${allPayments.filter(p => p.amount > 0).length}`);
  console.log(`   - Remboursements (négatifs): ${allPayments.filter(p => p.amount < 0).length}`);
  console.log(`   - Remboursements Stripe (re_): ${allPayments.filter(p => p.transactionId?.startsWith("re_")).length}`);
  console.log(`   - Paiements Stripe: ${allPayments.filter(p => p.method === "STRIPE").length}`);
  console.log(`   - Paiements COMPLETED: ${allPayments.filter(p => p.status === "COMPLETED").length}`);
  console.log(`   - Paiements PENDING: ${allPayments.filter(p => p.status === "PENDING").length}`);
  console.log(`   - Paiements FAILED: ${allPayments.filter(p => p.status === "FAILED").length}`);
  console.log(`   - Paiements de modification: ${allPayments.filter(p => {
    const metadata = p.metadata as any;
    return metadata?.isModificationPayment === true;
  }).length}`);
  console.log(`   - Montant total (positif): ${allPayments.filter(p => p.amount > 0).reduce((sum, p) => sum + p.amount, 0).toFixed(2)}€`);
  console.log(`   - Montant total (négatif/remboursements): ${allPayments.filter(p => p.amount < 0).reduce((sum, p) => sum + p.amount, 0).toFixed(2)}€`);
  
  // Afficher les remboursements séparément
  const refunds = allPayments.filter(p => p.transactionId?.startsWith("re_") || p.amount < 0);
  if (refunds.length > 0) {
    console.log("");
    console.log("🔴 REMBOURSEMENTS TROUVÉS:");
    refunds.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.amount.toFixed(2)}€ - ${r.transactionId} - ${r.status} - ${r.createdAt.toISOString()}`);
    });
  }

  // 3. Paiements filtrés (comme dans create-refund.ts)
  const filteredPayments = allPayments.filter(p => {
    return p.method === "STRIPE" && 
           (p.status === "COMPLETED" || p.status === "PENDING") && 
           p.amount > 0;
  });

  console.log("");
  console.log("=".repeat(80));
  console.log(`🔍 PAIEMENTS FILTRÉS (utilisés pour remboursement): ${filteredPayments.length}`);
  console.log("=".repeat(80));
  console.log("Critères: method=STRIPE, status=COMPLETED|PENDING, amount>0");
  console.log("");

  if (filteredPayments.length === 0) {
    console.log("❌ Aucun paiement ne correspond aux critères de filtrage");
    console.log("");
    console.log("🔍 Paiements exclus et raisons:");
    allPayments.forEach((p, index) => {
      const reasons = [];
      if (p.method !== "STRIPE") reasons.push("method !== STRIPE");
      if (p.status !== "COMPLETED" && p.status !== "PENDING") reasons.push(`status=${p.status}`);
      if (p.amount <= 0) reasons.push("amount <= 0");
      
      if (reasons.length > 0) {
        console.log(`   - Paiement #${index + 1} (${p.amount.toFixed(2)}€): ${reasons.join(", ")}`);
      }
    });
  } else {
    filteredPayments.forEach((payment, index) => {
      const metadata = payment.metadata as any;
      console.log(`   ${index + 1}. ${payment.amount.toFixed(2)}€ - ${payment.status} - ${payment.transactionId || "N/A"} - Modification: ${metadata?.isModificationPayment ?? "N/A"}`);
    });
  }

  // 4. Recherche du paiement initial (originalDepositPaid)
  if (booking.originalDepositPaid) {
    console.log("");
    console.log("=".repeat(80));
    console.log(`🎯 RECHERCHE DU PAIEMENT INITIAL (${booking.originalDepositPaid.toFixed(2)}€):`);
    console.log("=".repeat(80));
    
    const matchingPayments = allPayments.filter(p => {
      const amountMatches = Math.abs(p.amount - booking.originalDepositPaid!) < 5;
      const metadata = p.metadata as any;
      const isNotModification = metadata?.isModificationPayment !== true;
      return amountMatches && isNotModification && p.amount > 0;
    });

    if (matchingPayments.length > 0) {
      console.log(`✅ ${matchingPayments.length} paiement(s) correspondant trouvé(s):`);
      matchingPayments.forEach((p, index) => {
        console.log(`   ${index + 1}. ID: ${p.id}, Montant: ${p.amount.toFixed(2)}€, Date: ${p.createdAt.toISOString()}`);
      });
    } else {
      console.log("❌ Aucun paiement initial trouvé correspondant à originalDepositPaid");
      console.log("");
      console.log("🔍 Paiements proches (tolérance 5€):");
      allPayments
        .filter(p => p.amount > 0)
        .map(p => ({
          payment: p,
          diff: Math.abs(p.amount - booking.originalDepositPaid!),
        }))
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 5)
        .forEach(({ payment, diff }) => {
          const metadata = payment.metadata as any;
          console.log(`   - ${payment.amount.toFixed(2)}€ (diff: ${diff.toFixed(2)}€) - Modification: ${metadata?.isModificationPayment ?? "N/A"} - ID: ${payment.id}`);
        });
    }
  }

  await prisma.$disconnect();
}

checkPayments()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  });

