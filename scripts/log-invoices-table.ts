#!/usr/bin/env tsx
/**
 * Script pour afficher le contenu de la table invoices dans les logs serveur
 * Usage: npx tsx scripts/log-invoices-table.ts
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
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Initialiser Prisma Client avec l'adaptateur pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function logInvoicesTable() {
  console.log("=".repeat(80));
  console.log("📋 CONTENU DE LA TABLE INVOICES");
  console.log("=".repeat(80));
  console.log("");

  try {
    // Récupérer toutes les factures avec leurs relations
    const invoices = await prisma.invoice.findMany({
      include: {
        booking: {
          select: {
            id: true,
            reference: true,
            startDate: true,
            endDate: true,
            totalPrice: true,
            depositPaid: true,
            vehicle: {
              select: {
                id: true,
                brand: true,
                model: true,
                licensePlate: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`📊 Nombre total de factures: ${invoices.length}`);
    console.log("");

    if (invoices.length === 0) {
      console.log("⚠️  Aucune facture trouvée dans la base de données.");
      return;
    }

    // Afficher chaque facture
    invoices.forEach((invoice, index) => {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`📄 FACTURE #${index + 1}`);
      console.log("=".repeat(80));
      console.log(`ID: ${invoice.id}`);
      console.log(`Numéro de facture: ${invoice.invoiceNumber}`);
      console.log(`Statut: ${invoice.status}`);
      console.log(`Utilisateur: ${invoice.user.name} (${invoice.user.email})`);
      console.log(`Sous-total: ${invoice.subtotal.toFixed(2)}€`);
      console.log(`TVA: ${invoice.tax.toFixed(2)}€`);
      console.log(`Total: ${invoice.total.toFixed(2)}€`);
      console.log(`Date d'émission: ${invoice.issuedAt.toISOString()}`);
      console.log(`Date d'échéance: ${invoice.dueDate.toISOString()}`);
      console.log(`Date de paiement: ${invoice.paidAt ? invoice.paidAt.toISOString() : "Non payée"}`);
      console.log(`Date de création: ${invoice.createdAt.toISOString()}`);
      console.log(`Date de mise à jour: ${invoice.updatedAt.toISOString()}`);
      
      // Informations sur le PDF
      if (invoice.pdfUrl) {
        console.log(`\n📎 URL PDF: ${invoice.pdfUrl}`);
        
        // Extraire les informations Cloudinary si possible
        try {
          const url = new URL(invoice.pdfUrl);
          if (url.hostname.includes("cloudinary.com")) {
            console.log(`   ✓ URL Cloudinary détectée`);
            if (invoice.pdfUrl.includes("/private/")) {
              console.log(`   ✓ Type: PRIVÉ`);
            } else {
              console.log(`   ✓ Type: PUBLIC`);
            }
            
            // Extraire le public_id si possible
            const privateMatch = url.pathname.match(/\/raw\/private\/s--[^\/]+--\/v\d+\/(.+?)(?:\?|$)/);
            if (privateMatch) {
              console.log(`   📁 Public ID: ${privateMatch[1]}`);
            } else {
              const publicMatch = url.pathname.match(/\/raw\/upload\/(?:v\d+\/)?(.+)/);
              if (publicMatch) {
                console.log(`   📁 Public ID: ${publicMatch[1]}`);
              }
            }
          }
        } catch (e) {
          // Ignorer les erreurs d'extraction
        }
      } else {
        console.log(`\n⚠️  Aucun PDF généré pour cette facture`);
      }

      // Informations sur la réservation
      if (invoice.booking) {
        console.log(`\n🚗 Réservation associée:`);
        console.log(`   Référence: ${invoice.booking.reference}`);
        console.log(`   Véhicule: ${invoice.booking.vehicle.brand} ${invoice.booking.vehicle.model} (${invoice.booking.vehicle.licensePlate})`);
        console.log(`   Période: ${invoice.booking.startDate.toISOString()} → ${invoice.booking.endDate.toISOString()}`);
        console.log(`   Prix total: ${invoice.booking.totalPrice.toFixed(2)}€`);
        console.log(`   Acompte payé: ${(invoice.booking.depositPaid || 0).toFixed(2)}€`);
      }

      // Informations sur les paiements
      if (invoice.payments && invoice.payments.length > 0) {
        console.log(`\n💰 Paiements (${invoice.payments.length}):`);
        invoice.payments.forEach((payment, pIndex) => {
          console.log(`   ${pIndex + 1}. ${payment.amount.toFixed(2)}€ - ${payment.status} (${payment.createdAt.toISOString()})`);
        });
        
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
        console.log(`   Total payé: ${totalPaid.toFixed(2)}€`);
        console.log(`   Solde restant: ${(invoice.total - totalPaid).toFixed(2)}€`);
      } else {
        console.log(`\n💰 Aucun paiement associé`);
      }
    });

    // Statistiques générales
    console.log(`\n${"=".repeat(80)}`);
    console.log("📊 STATISTIQUES");
    console.log("=".repeat(80));
    
    const withPdf = invoices.filter(inv => inv.pdfUrl).length;
    const withoutPdf = invoices.length - withPdf;
    const paid = invoices.filter(inv => inv.status === "PAID").length;
    const draft = invoices.filter(inv => inv.status === "DRAFT").length;
    const overdue = invoices.filter(inv => inv.status === "OVERDUE").length;
    const sent = invoices.filter(inv => inv.status === "SENT").length;
    const cancelled = invoices.filter(inv => inv.status === "CANCELLED").length;
    
    console.log(`Total factures: ${invoices.length}`);
    console.log(`  ✓ Avec PDF: ${withPdf}`);
    console.log(`  ⚠️  Sans PDF: ${withoutPdf}`);
    console.log(`\nPar statut:`);
    console.log(`  ✓ Payées: ${paid}`);
    console.log(`  📝 Brouillons: ${draft}`);
    console.log(`  ⚠️  En retard: ${overdue}`);
    console.log(`  📧 Envoyées: ${sent}`);
    console.log(`  ❌ Annulées: ${cancelled}`);
    
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = invoices
      .filter(inv => inv.status === "PAID")
      .reduce((sum, inv) => sum + inv.total, 0);
    
    console.log(`\nMontants:`);
    console.log(`  Total facturé: ${totalAmount.toFixed(2)}€`);
    console.log(`  Total payé: ${paidAmount.toFixed(2)}€`);
    console.log(`  Total en attente: ${(totalAmount - paidAmount).toFixed(2)}€`);

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des factures:", error);
    throw error;
  }
}

logInvoicesTable()
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

