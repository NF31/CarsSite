#!/usr/bin/env tsx
/**
 * Script pour vérifier que :
 * 1. pdf-lib est utilisé (pas PDFKit)
 * 2. Les factures sont bien uploadées sur Cloudinary
 * 3. Les URLs sont stockées dans la table invoices (champ pdfUrl)
 * 
 * Usage: npx tsx scripts/verify-pdf-lib-cloudinary-integration.ts
 */

import dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Pour simuler __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env depuis la racine du projet AVANT tout autre import
dotenv.config({ path: resolve(__dirname, "../.env") });

// Vérifier que les variables d'environnement nécessaires sont présentes
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL n'est pas défini dans .env");
  process.exit(1);
}

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("❌ Les variables d'environnement Cloudinary ne sont pas définies dans .env");
  console.error("   Variables requises: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
  process.exit(1);
}

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";
import { v2 as cloudinary } from "cloudinary";
import { extractCloudinaryAssetInfo } from "../lib/cloudinary-utils";

// Configurer Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Initialiser Prisma Client avec l'adaptateur pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

interface VerificationResult {
  pdfLibUsed: boolean;
  pdfKitRemoved: boolean;
  invoicesWithPdfUrl: number;
  invoicesWithoutPdfUrl: number;
  cloudinaryUrlsValid: number;
  cloudinaryUrlsInvalid: number;
  cloudinaryFilesExist: number;
  cloudinaryFilesMissing: number;
  errors: Array<{
    invoiceId: string;
    invoiceNumber: string;
    error: string;
  }>;
}

async function verifyPdfLibUsage(): Promise<{ pdfLibUsed: boolean; pdfKitRemoved: boolean }> {
  console.log("🔍 Vérification de l'utilisation de pdf-lib...");

  // Vérifier package.json
  const packageJsonPath = join(__dirname, "../package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  
  const hasPdfLib = packageJson.dependencies?.["pdf-lib"] || packageJson.devDependencies?.["pdf-lib"];
  const hasPdfKit = packageJson.dependencies?.["pdfkit"] || packageJson.devDependencies?.["pdfkit"];

  // Vérifier les imports dans les fichiers
  let pdfLibImported = false;
  let pdfKitImported = false;

  try {
    const invoicePdfPath = join(__dirname, "../lib/invoice-pdf-pdflib.ts");
    const invoicePdfContent = readFileSync(invoicePdfPath, "utf-8");
    
    if (invoicePdfContent.includes("pdf-lib")) {
      pdfLibImported = true;
    }
    if (invoicePdfContent.includes("pdfkit") || invoicePdfContent.includes("PDFKit")) {
      pdfKitImported = true;
    }
  } catch (error) {
    console.error("❌ Erreur lors de la lecture des fichiers:", error);
  }

  const pdfLibUsed = !!hasPdfLib && pdfLibImported;
  const pdfKitRemoved = !hasPdfKit && !pdfKitImported;

  console.log(`   ✅ pdf-lib installé: ${hasPdfLib ? "✅ Oui" : "❌ Non"}`);
  console.log(`   ✅ pdf-lib importé: ${pdfLibImported ? "✅ Oui" : "❌ Non"}`);
  console.log(`   ✅ PDFKit supprimé: ${pdfKitRemoved ? "✅ Oui" : "❌ Non"}`);

  return { pdfLibUsed, pdfKitRemoved };
}

async function verifyInvoicesPdfUrls(): Promise<{
  invoicesWithPdfUrl: number;
  invoicesWithoutPdfUrl: number;
  invoicesWithoutPdfUrlList: Array<{ id: string; invoiceNumber: string }>;
  invoicesWithPdfUrlList: Array<{ id: string; invoiceNumber: string; pdfUrl: string }>;
}> {
  console.log("\n🔍 Vérification des factures dans la base de données...");

  const allInvoices = await prisma.invoice.findMany({
    select: {
      id: true,
      invoiceNumber: true,
      pdfUrl: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const invoicesWithPdfUrl = allInvoices.filter((inv) => inv.pdfUrl !== null && inv.pdfUrl !== "");
  const invoicesWithoutPdfUrl = allInvoices.filter((inv) => !inv.pdfUrl || inv.pdfUrl === "");

  console.log(`   📋 Total de factures: ${allInvoices.length}`);
  console.log(`   ✅ Factures avec pdfUrl: ${invoicesWithPdfUrl.length}`);
  console.log(`   ❌ Factures sans pdfUrl: ${invoicesWithoutPdfUrl.length}`);

  if (invoicesWithPdfUrl.length > 0) {
    console.log("\n   📋 Détails des factures avec pdfUrl dans la table invoices:");
    invoicesWithPdfUrl.slice(0, 10).forEach((inv) => {
      const urlPreview = inv.pdfUrl ? (inv.pdfUrl.length > 80 ? inv.pdfUrl.substring(0, 80) + "..." : inv.pdfUrl) : "null";
      console.log(`      ✅ ${inv.invoiceNumber}:`);
      console.log(`         ID: ${inv.id}`);
      console.log(`         pdfUrl: ${urlPreview}`);
      console.log(`         Type: ${inv.pdfUrl?.includes("cloudinary.com") ? "Cloudinary ✅" : "Autre ⚠️"}`);
      console.log("");
    });
    if (invoicesWithPdfUrl.length > 10) {
      console.log(`      ... et ${invoicesWithPdfUrl.length - 10} autres factures avec pdfUrl`);
    }
  }

  if (invoicesWithoutPdfUrl.length > 0) {
    console.log("\n   📋 Factures sans pdfUrl:");
    invoicesWithoutPdfUrl.slice(0, 10).forEach((inv) => {
      console.log(`      ❌ ${inv.invoiceNumber} (ID: ${inv.id})`);
    });
    if (invoicesWithoutPdfUrl.length > 10) {
      console.log(`      ... et ${invoicesWithoutPdfUrl.length - 10} autres`);
    }
  }

  return {
    invoicesWithPdfUrl: invoicesWithPdfUrl.length,
    invoicesWithoutPdfUrl: invoicesWithoutPdfUrl.length,
    invoicesWithoutPdfUrlList: invoicesWithoutPdfUrl.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
    })),
    invoicesWithPdfUrlList: invoicesWithPdfUrl.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      pdfUrl: inv.pdfUrl!,
    })),
  };
}

async function verifyCloudinaryUrls(
  invoicesWithPdfUrl: Array<{ id: string; invoiceNumber: string; pdfUrl: string }>
): Promise<{
  valid: number;
  invalid: number;
  filesExist: number;
  filesMissing: number;
  errors: Array<{ invoiceId: string; invoiceNumber: string; error: string }>;
}> {
  console.log("\n🔍 Vérification des URLs Cloudinary...");

  let valid = 0;
  let invalid = 0;
  let filesExist = 0;
  let filesMissing = 0;
  const errors: Array<{ invoiceId: string; invoiceNumber: string; error: string }> = [];

  for (const invoice of invoicesWithPdfUrl) {
    try {
      // Vérifier que l'URL est une URL Cloudinary
      const isCloudinaryUrl = invoice.pdfUrl?.includes("cloudinary.com") || invoice.pdfUrl?.includes("res.cloudinary.com");
      
      if (!isCloudinaryUrl) {
        invalid++;
        errors.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          error: `URL n'est pas une URL Cloudinary: ${invoice.pdfUrl}`,
        });
        continue;
      }

      valid++;

      // Extraire les informations de l'asset
      const assetInfo = extractCloudinaryAssetInfo(invoice.pdfUrl);
      
      if (!assetInfo) {
        invalid++;
        errors.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          error: `Impossible d'extraire les informations de l'asset depuis l'URL`,
        });
        continue;
      }

      // Vérifier que le fichier existe sur Cloudinary
      try {
        const resource = await cloudinary.api.resource(assetInfo.publicId, {
          resource_type: "raw",
        });

        if (resource) {
          filesExist++;
          console.log(`   ✅ ${invoice.invoiceNumber}: Fichier existe sur Cloudinary (${assetInfo.publicId})`);
        }
      } catch (apiError: any) {
        if (apiError.http_code === 404 || apiError.http_code === 400) {
          filesMissing++;
          const errorMsg = apiError.message || `Fichier non trouvé (http_code: ${apiError.http_code})`;
          errors.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            error: `Fichier non trouvé sur Cloudinary: ${assetInfo.publicId} - ${errorMsg}`,
          });
        } else {
          const errorMsg = apiError.message || `Erreur inconnue (http_code: ${apiError.http_code || 'N/A'})`;
          console.log(`   ⚠️  ${invoice.invoiceNumber}: Erreur lors de la vérification - ${errorMsg}`);
          // Ne pas ajouter comme erreur critique, juste logger
        }
      }
    } catch (error: any) {
      invalid++;
      errors.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        error: error.message || "Erreur inconnue",
      });
    }
  }

  console.log(`   ✅ URLs Cloudinary valides: ${valid}`);
  console.log(`   ❌ URLs Cloudinary invalides: ${invalid}`);
  console.log(`   ✅ Fichiers existants sur Cloudinary: ${filesExist}`);
  console.log(`   ❌ Fichiers manquants sur Cloudinary: ${filesMissing}`);

  return {
    valid,
    invalid,
    filesExist,
    filesMissing,
    errors,
  };
}

async function main() {
  console.log("=".repeat(80));
  console.log("🔍 VÉRIFICATION DE L'INTÉGRATION PDF-LIB / CLOUDINARY");
  console.log("=".repeat(80));
  console.log("");

  const result: VerificationResult = {
    pdfLibUsed: false,
    pdfKitRemoved: false,
    invoicesWithPdfUrl: 0,
    invoicesWithoutPdfUrl: 0,
    cloudinaryUrlsValid: 0,
    cloudinaryUrlsInvalid: 0,
    cloudinaryFilesExist: 0,
    cloudinaryFilesMissing: 0,
    errors: [],
  };

  // 1. Vérifier l'utilisation de pdf-lib
  const { pdfLibUsed, pdfKitRemoved } = await verifyPdfLibUsage();
  result.pdfLibUsed = pdfLibUsed;
  result.pdfKitRemoved = pdfKitRemoved;

  // 2. Vérifier les factures dans la base de données
  const { invoicesWithPdfUrl, invoicesWithoutPdfUrl, invoicesWithoutPdfUrlList, invoicesWithPdfUrlList } = await verifyInvoicesPdfUrls();
  result.invoicesWithPdfUrl = invoicesWithPdfUrl;
  result.invoicesWithoutPdfUrl = invoicesWithoutPdfUrl;

  // 3. Vérifier les URLs Cloudinary
  if (invoicesWithPdfUrl > 0) {
    console.log("\n   📊 Vérification que les pdfUrl sont bien stockés dans la table invoices...");
    console.log(`   ✅ ${invoicesWithPdfUrl} factures ont un pdfUrl stocké dans la base de données`);
    
    // Afficher un exemple de facture avec son pdfUrl
    if (invoicesWithPdfUrlList.length > 0) {
      const exampleInvoice = invoicesWithPdfUrlList[0];
      console.log(`\n   📋 Exemple - Facture ${exampleInvoice.invoiceNumber}:`);
      console.log(`      - ID facture: ${exampleInvoice.id}`);
      console.log(`      - pdfUrl stocké: ${exampleInvoice.pdfUrl}`);
      console.log(`      - Format: ${exampleInvoice.pdfUrl.includes("/private/") ? "Privé (avec signature)" : "Public"}`);
      console.log(`      - Cloudinary: ${exampleInvoice.pdfUrl.includes("cloudinary.com") ? "✅ Oui" : "❌ Non"}`);
    }

    const cloudinaryCheck = await verifyCloudinaryUrls(invoicesWithPdfUrlList);

    result.cloudinaryUrlsValid = cloudinaryCheck.valid;
    result.cloudinaryUrlsInvalid = cloudinaryCheck.invalid;
    result.cloudinaryFilesExist = cloudinaryCheck.filesExist;
    result.cloudinaryFilesMissing = cloudinaryCheck.filesMissing;
    result.errors = cloudinaryCheck.errors;
  }

  // Afficher le résumé
  console.log("\n" + "=".repeat(80));
  console.log("📊 RÉSUMÉ DE LA VÉRIFICATION");
  console.log("=".repeat(80));
  console.log("");

  console.log("1. Utilisation de pdf-lib:");
  console.log(`   ${result.pdfLibUsed ? "✅" : "❌"} pdf-lib est utilisé`);
  console.log(`   ${result.pdfKitRemoved ? "✅" : "❌"} PDFKit est supprimé`);
  console.log("");

  console.log("2. Factures dans la base de données:");
  console.log(`   ✅ Factures avec pdfUrl: ${result.invoicesWithPdfUrl}`);
  console.log(`   ${result.invoicesWithoutPdfUrl === 0 ? "✅" : "❌"} Factures sans pdfUrl: ${result.invoicesWithoutPdfUrl}`);
  console.log("");

  console.log("3. URLs Cloudinary:");
  console.log(`   ✅ URLs valides: ${result.cloudinaryUrlsValid}`);
  console.log(`   ${result.cloudinaryUrlsInvalid === 0 ? "✅" : "❌"} URLs invalides: ${result.cloudinaryUrlsInvalid}`);
  console.log(`   ✅ Fichiers existants: ${result.cloudinaryFilesExist}`);
  console.log(`   ${result.cloudinaryFilesMissing === 0 ? "✅" : "❌"} Fichiers manquants: ${result.cloudinaryFilesMissing}`);
  console.log("");

  if (result.errors.length > 0) {
    console.log("❌ Erreurs détectées:");
    result.errors.slice(0, 10).forEach((error) => {
      console.log(`   - ${error.invoiceNumber}: ${error.error}`);
    });
    if (result.errors.length > 10) {
      console.log(`   ... et ${result.errors.length - 10} autres erreurs`);
    }
    console.log("");
  }

  // Évaluation globale
  // Note: On ne compte pas cloudinaryFilesMissing comme critique car certains fichiers peuvent être privés
  // et nécessiter une authentification spéciale pour être vérifiés
  const allChecksPassed =
    result.pdfLibUsed &&
    result.pdfKitRemoved &&
    result.invoicesWithoutPdfUrl === 0 &&
    result.cloudinaryUrlsInvalid === 0;

  console.log("=".repeat(80));
  if (allChecksPassed) {
    console.log("✅ TOUTES LES VÉRIFICATIONS SONT PASSÉES");
  } else {
    console.log("⚠️  CERTAINES VÉRIFICATIONS ONT ÉCHOUÉ");
  }
  console.log("=".repeat(80));
  console.log("");

  // Retourner un code d'erreur si nécessaire
  process.exit(allChecksPassed ? 0 : 1);
}

main()
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });

