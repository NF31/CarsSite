import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAllPayments() {
  console.log("=".repeat(80));
  console.log("🔍 TOUS LES PAIEMENTS DE LA TABLE Payment");
  console.log("=".repeat(80));
  console.log("");

  // Récupérer TOUS les paiements sans filtre
  const allPayments = await prisma.payment.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`📊 Total de paiements dans la table: ${allPayments.length}`);
  console.log("");

  // Grouper par bookingId
  const paymentsByBooking = allPayments.reduce((acc, payment) => {
    const bookingId = payment.bookingId;
    if (!acc[bookingId]) {
      acc[bookingId] = [];
    }
    acc[bookingId].push(payment);
    return acc;
  }, {} as Record<string, typeof allPayments>);

  console.log(`📋 Nombre de réservations différentes: ${Object.keys(paymentsByBooking).length}`);
  console.log("");

  // Afficher pour chaque réservation
  for (const [bookingId, payments] of Object.entries(paymentsByBooking)) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        reference: true,
        status: true,
      },
    });

    console.log("=".repeat(80));
    console.log(`📦 Réservation: ${booking?.reference || "N/A"} (${bookingId})`);
    console.log(`   Statut: ${booking?.status || "N/A"}`);
    console.log(`   Nombre de paiements: ${payments.length}`);
    console.log("");

    payments.forEach((payment, index) => {
      const metadata = payment.metadata as any;
      const isRefund = payment.transactionId?.startsWith("re_") || payment.amount < 0;
      const isCheckoutSession = payment.transactionId?.startsWith("cs_");
      const isPaymentIntent = payment.transactionId?.startsWith("pi_");
      
      console.log(`   ${index + 1}. ${payment.amount.toFixed(2)}€ ${isRefund ? "🔴 (REMBOURSEMENT)" : "🟢"}`);
      console.log(`      - ID: ${payment.id}`);
      console.log(`      - Statut: ${payment.status}`);
      console.log(`      - Méthode: ${payment.method}`);
      console.log(`      - Transaction ID: ${payment.transactionId || "N/A"}`);
      if (isRefund) {
        console.log(`      - ⚠️  TYPE: REMBOURSEMENT STRIPE (re_)`);
      } else if (isCheckoutSession) {
        console.log(`      - ℹ️  TYPE: Checkout Session (cs_)`);
      } else if (isPaymentIntent) {
        console.log(`      - ℹ️  TYPE: Payment Intent (pi_)`);
      }
      console.log(`      - Date: ${payment.createdAt.toISOString()}`);
      console.log(`      - isModificationPayment: ${metadata?.isModificationPayment ?? "N/A"}`);
      console.log("");
    });
  }

  // Rechercher spécifiquement les paiements avec transactionId commençant par re_
  const refunds = allPayments.filter(p => p.transactionId?.startsWith("re_"));
  if (refunds.length > 0) {
    console.log("=".repeat(80));
    console.log(`🔴 REMBOURSEMENTS TROUVÉS (${refunds.length}):`);
    console.log("=".repeat(80));
    refunds.forEach((r, i) => {
      const booking = paymentsByBooking[r.bookingId]?.[0];
      console.log(`${i + 1}. ${r.amount.toFixed(2)}€ - ${r.transactionId} - Booking: ${r.bookingId} - Date: ${r.createdAt.toISOString()}`);
    });
  }

  await prisma.$disconnect();
}

checkAllPayments()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  });



