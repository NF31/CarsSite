#!/usr/bin/env tsx
/**
 * Script pour nettoyer les jobs échoués de la queue email
 * Usage: npx tsx scripts/clean-failed-jobs.ts
 */

import dotenv from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement
dotenv.config({ path: resolve(__dirname, "../.env") });

import { getEmailQueue, closeEmailQueue } from "../lib/email-queue";

async function cleanFailedJobs() {
  console.log("🧹 Nettoyage des jobs échoués...\n");

  try {
    const queue = getEmailQueue();
    await queue.waitUntilReady();

    // Obtenir le nombre de jobs échoués
    const failedCount = await queue.getFailedCount();
    console.log(`📊 Jobs échoués: ${failedCount}`);

    if (failedCount === 0) {
      console.log("✅ Aucun job échoué à nettoyer");
      return;
    }

    // Obtenir les jobs échoués
    const failedJobs = await queue.getFailed(0, failedCount);
    console.log(`📋 ${failedJobs.length} jobs échoués trouvés\n`);

    // Option 1: Supprimer les jobs échoués
    console.log("🗑️  Suppression des jobs échoués...");
    for (const job of failedJobs) {
      await job.remove();
      console.log(`  ✅ Job ${job.id} supprimé`);
    }

    // Vérifier les statistiques après nettoyage
    const statsAfter = await queue.getFailedCount();
    console.log(`\n📊 Jobs échoués après nettoyage: ${statsAfter}`);

    console.log("\n✅ Nettoyage terminé avec succès");

  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
    throw error;
  } finally {
    await closeEmailQueue();
  }
}

// Exécuter le nettoyage
cleanFailedJobs()
  .then(() => {
    console.log("\n🎉 Nettoyage terminé");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur lors du nettoyage:", error);
    process.exit(1);
  });

