/**
 * Script pour créer les factures manquantes pour les réservations confirmées
 */

import dotenv from "dotenv";
import { resolve } from "path";

// Charger .env depuis la racine du projet
dotenv.config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient, InvoiceStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { addDays } from "date-fns";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Génère un numéro de facture unique au format INV-YYYY-NNN
 */
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: "desc",
    },
    select: {
      invoiceNumber: true,
    },
  });

  let nextNumber = 1;

  if (lastInvoice) {
    const match = lastInvoice.invoiceNumber.match(/-(\d+)$/);
    if (match) {
      const lastNumber = parseInt(match[1], 10);
      nextNumber = lastNumber + 1;
    }
  }

  const formattedNumber = String(nextNumber).padStart(3, "0");
  return `${prefix}${formattedNumber}`;
}

async function createMissingInvoices() {
  console.log("\n📋 Recherche des réservations confirmées sans facture...\n");

  const confirmedBookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      invoices: {
        none: {},
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`📋 ${confirmedBookings.length} réservation(s) trouvée(s)\n`);

  if (confirmedBookings.length === 0) {
    console.log("✅ Toutes les réservations confirmées ont déjà une facture.\n");
    return;
  }

  let created = 0;
  let errors = 0;

  for (const booking of confirmedBookings) {
    try {
      // Générer le numéro de facture
      const invoiceNumber = await generateInvoiceNumber();

      // Calculer les montants
      const subtotal = booking.totalPrice;
      const tax = 0;
      const total = subtotal + tax;
      const dueDate = addDays(new Date(), 30);

      // Créer la facture
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          bookingId: booking.id,
          userId: booking.userId,
          subtotal,
          tax,
          total,
          status: InvoiceStatus.DRAFT,
          dueDate,
        },
      });

      console.log(`✅ ${booking.reference}: Facture ${invoice.invoiceNumber} créée (${total.toFixed(2)}€)`);
      created++;
    } catch (error) {
      console.log(`❌ ${booking.reference}: Erreur - ${error instanceof Error ? error.message : "Erreur inconnue"}`);
      errors++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   - ${created} facture(s) créée(s)`);
  console.log(`   - ${errors} erreur(s)\n`);
}

createMissingInvoices()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
