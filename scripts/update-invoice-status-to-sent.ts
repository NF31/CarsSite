#!/usr/bin/env tsx
/**
 * Script pour mettre à jour le statut des factures de DRAFT à SENT
 * pour les factures qui ont déjà un PDF généré
 * Usage: npx tsx scripts/update-invoice-status-to-sent.ts
 */

import dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Pour simuler __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env depuis la racine du projet
dotenv.config({ path: resolve(__dirname, "../.env") });

import { PrismaClient } from "@prisma/client";
import { InvoiceStatus } from "@/lib/types/invoice-status";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Initialiser Prisma Client avec l'adaptateur pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function updateInvoiceStatusToSent() {
  console.log("=".repeat(80));
  console.log("📋 MISE À JOUR DU STATUT DES FACTURES (DRAFT → SENT)");
  console.log("=".repeat(80));
  console.log("");

  try {
    // Trouver toutes les factures en DRAFT qui ont un PDF
    const draftInvoicesWithPdf = await prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.DRAFT,
        pdfUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        pdfUrl: true,
      },
    });

    console.log(`📊 Factures en DRAFT avec PDF: ${draftInvoicesWithPdf.length}`);
    console.log("");

    if (draftInvoicesWithPdf.length === 0) {
      console.log("✅ Toutes les factures avec PDF ont déjà le bon statut.");
      return;
    }

    console.log("📋 Liste des factures à mettre à jour:");
    draftInvoicesWithPdf.forEach((invoice, index) => {
      console.log(`   ${index + 1}. ${invoice.invoiceNumber} (${invoice.id})`);
    });
    console.log("");

    let updatedCount = 0;
    let errorCount = 0;

    for (const invoice of draftInvoicesWithPdf) {
      try {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: InvoiceStatus.SENT,
          },
        });

        console.log(`   ✅ ${invoice.invoiceNumber} : DRAFT → SENT`);
        updatedCount++;
      } catch (error) {
        console.error(`   ❌ Erreur pour ${invoice.invoiceNumber}:`, error);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("📊 RÉSUMÉ");
    console.log("=".repeat(80));
    console.log(`   ✅ Factures mises à jour: ${updatedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📋 Total traité: ${draftInvoicesWithPdf.length}`);
    console.log("");

    if (updatedCount > 0) {
      console.log("✅ Les factures avec PDF ont été mises à jour de DRAFT à SENT.");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des factures:", error);
    throw error;
  }
}

updateInvoiceStatusToSent()
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

