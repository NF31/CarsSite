/**
 * Script pour vérifier la répartition des montants d'un paiement
 * Usage: npx tsx scripts/check-payment-breakdown.ts <bookingId>
 */

import { PrismaClient } from "@prisma/client";
import type { PaymentMetadata } from "../types/payment-metadata";

const prisma = new PrismaClient();

async function checkPaymentBreakdown(bookingId: string) {
  console.log(`\n🔍 Analyse du paiement pour la réservation: ${bookingId}\n`);

  // Récupérer la réservation avec tous les détails
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      vehicle: {
        select: {
          id: true,
          brand: true,
          model: true,
          pricePerDay: true,
          deposit: true, // Caution du véhicule
        },
      },
      payments: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!booking) {
    console.error(`❌ Réservation ${bookingId} introuvable`);
    return;
  }

  console.log("📋 DÉTAILS DE LA RÉSERVATION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Référence: ${booking.reference}`);
  console.log(`Véhicule: ${booking.vehicle.brand} ${booking.vehicle.model}`);
  console.log(`Prix par jour: ${booking.vehicle.pricePerDay.toFixed(2)}€`);
  console.log(`Caution du véhicule: ${booking.vehicle.deposit.toFixed(2)}€`);
  console.log(`\nTotal de la location: ${booking.totalPrice.toFixed(2)}€`);
  console.log(`Acompte payé (dans booking): ${booking.depositPaid.toFixed(2)}€`);
  console.log(`Solde restant (dans booking): ${booking.remainingAmount.toFixed(2)}€`);

  // Calculer les montants attendus
  const expectedDownPayment = booking.totalPrice * 0.3; // 30% du total
  const expectedSecurityDeposit = booking.vehicle.deposit; // Caution du véhicule
  const expectedTotalToPay = expectedDownPayment + expectedSecurityDeposit;

  console.log("\n💰 CALCUL DES MONTANTS ATTENDUS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Acompte (30% de ${booking.totalPrice.toFixed(2)}€): ${expectedDownPayment.toFixed(2)}€`);
  console.log(`Caution de garantie: ${expectedSecurityDeposit.toFixed(2)}€`);
  console.log(`TOTAL À PAYER: ${expectedTotalToPay.toFixed(2)}€`);

  // Vérifier les paiements
  console.log("\n💳 PAIEMENTS ENREGISTRÉS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (booking.payments.length === 0) {
    console.log("⚠️  Aucun paiement enregistré");
  } else {
    booking.payments.forEach((payment, index) => {
      console.log(`\nPaiement #${index + 1}:`);
      console.log(`  ID: ${payment.id}`);
      console.log(`  Montant total payé: ${payment.amount.toFixed(2)}€`);
      console.log(`  Méthode: ${payment.method}`);
      console.log(`  Statut: ${payment.status}`);
      console.log(`  Transaction ID: ${payment.transactionId || "N/A"}`);
      console.log(`  Date: ${payment.createdAt.toLocaleString("fr-FR")}`);

      if (payment.metadata) {
        const metadata = payment.metadata as PaymentMetadata;
        console.log(`  Métadonnées:`);
        console.log(`    - Acompte: ${metadata.downPayment?.toFixed(2) || "N/A"}€`);
        console.log(`    - Caution: ${metadata.securityDeposit?.toFixed(2) || "N/A"}€`);
      }

      // Vérifier la cohérence
      const metadata = payment.metadata as PaymentMetadata | null;
      const downPaymentInMetadata = metadata?.downPayment || 0;
      const securityDepositInMetadata = metadata?.securityDeposit || 0;
      const totalInMetadata = downPaymentInMetadata + securityDepositInMetadata;

      console.log(`\n  🔍 VÉRIFICATION:`);
      console.log(`    Montant payé (Stripe): ${payment.amount.toFixed(2)}€`);
      console.log(`    Acompte (métadonnées): ${downPaymentInMetadata.toFixed(2)}€`);
      console.log(`    Caution (métadonnées): ${securityDepositInMetadata.toFixed(2)}€`);
      console.log(`    Total (métadonnées): ${totalInMetadata.toFixed(2)}€`);

      if (Math.abs(payment.amount - totalInMetadata) < 0.01) {
        console.log(`    ✅ Les montants correspondent`);
      } else {
        console.log(`    ⚠️  Écart détecté: ${Math.abs(payment.amount - totalInMetadata).toFixed(2)}€`);
      }

      // Vérifier avec les montants attendus
      if (Math.abs(payment.amount - expectedTotalToPay) < 0.01) {
        console.log(`    ✅ Le montant payé correspond au total attendu`);
      } else {
        console.log(`    ⚠️  Écart avec le total attendu: ${Math.abs(payment.amount - expectedTotalToPay).toFixed(2)}€`);
      }

      // Vérifier avec depositPaid dans booking
      if (Math.abs(booking.depositPaid - downPaymentInMetadata) < 0.01) {
        console.log(`    ✅ L'acompte dans booking correspond aux métadonnées`);
      } else {
        console.log(`    ⚠️  Écart entre booking.depositPaid et métadonnées: ${Math.abs(booking.depositPaid - downPaymentInMetadata).toFixed(2)}€`);
      }
    });
  }

  // Résumé
  console.log("\n📊 RÉSUMÉ");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const totalPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0);
  console.log(`Total payé (tous paiements): ${totalPaid.toFixed(2)}€`);
  console.log(`Acompte enregistré (booking.depositPaid): ${booking.depositPaid.toFixed(2)}€`);
  console.log(`Caution (véhicule.deposit): ${expectedSecurityDeposit.toFixed(2)}€`);
  console.log(`\n💡 EXPLICATION:`);
  console.log(`   - Le client a payé ${totalPaid.toFixed(2)}€ au total`);
  console.log(`   - Cette somme comprend:`);
  console.log(`     • L'acompte de ${expectedDownPayment.toFixed(2)}€ (30% de la location)`);
  console.log(`     • La caution de ${expectedSecurityDeposit.toFixed(2)}€ (garantie, sera remboursée)`);
  console.log(`   - Dans la table Booking:`);
  console.log(`     • depositPaid = ${booking.depositPaid.toFixed(2)}€ (seulement l'acompte)`);
  console.log(`     • remainingAmount = ${booking.remainingAmount.toFixed(2)}€ (solde à payer à la remise)`);
  console.log(`   - La caution de ${expectedSecurityDeposit.toFixed(2)}€ est stockée dans Payment.metadata`);
  console.log(`     et sera remboursée après restitution du véhicule sans dégâts\n`);
}

// Exécuter le script
const bookingId = process.argv[2];

if (!bookingId) {
  console.error("❌ Usage: npx tsx scripts/check-payment-breakdown.ts <bookingId>");
  process.exit(1);
}

checkPaymentBreakdown(bookingId)
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

