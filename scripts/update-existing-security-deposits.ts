/**
 * Script pour mettre à jour securityDepositPaid pour les réservations existantes
 * qui ont déjà payé la caution mais où securityDepositPaid = 0
 */

import { PrismaClient } from "@prisma/client";
import type { PaymentMetadata } from "../types/payment-metadata";

const prisma = new PrismaClient();

async function updateExistingSecurityDeposits() {
  console.log("\n🔍 Recherche des réservations avec paiements...\n");

  // Récupérer toutes les réservations avec des paiements
  const bookings = await prisma.booking.findMany({
    where: {
      payments: {
        some: {
          status: "COMPLETED",
        },
      },
      securityDepositPaid: 0, // Seulement celles où la caution n'est pas encore enregistrée
    },
    include: {
      payments: {
        where: {
          status: "COMPLETED",
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      vehicle: {
        select: {
          id: true,
          deposit: true,
        },
      },
    },
  });

  console.log(`📋 ${bookings.length} réservation(s) trouvée(s)\n`);

  let updated = 0;
  let skipped = 0;

  for (const booking of bookings) {
    // Récupérer le paiement le plus récent
    const latestPayment = booking.payments[0];

    if (!latestPayment || !latestPayment.metadata) {
      console.log(`⏭️  Réservation ${booking.reference}: Pas de métadonnées, ignorée`);
      skipped++;
      continue;
    }

    const metadata = latestPayment.metadata as PaymentMetadata | null;
    const securityDepositInMetadata = metadata?.securityDeposit || 0;

    if (securityDepositInMetadata === 0) {
      console.log(`⏭️  Réservation ${booking.reference}: Pas de caution dans les métadonnées, ignorée`);
      skipped++;
      continue;
    }

    // Mettre à jour la réservation
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        securityDepositPaid: securityDepositInMetadata,
      },
    });

    console.log(`✅ Réservation ${booking.reference}: Caution mise à jour à ${securityDepositInMetadata.toFixed(2)}€`);
    updated++;
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   - ${updated} réservation(s) mise(s) à jour`);
  console.log(`   - ${skipped} réservation(s) ignorée(s)\n`);
}

updateExistingSecurityDeposits()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

