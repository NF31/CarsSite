#!/usr/bin/env tsx
/**
 * Script pour tester le worker et voir les logs en temps réel
 * Usage: npx tsx scripts/test-worker-logs.ts
 */

import dotenv from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement
dotenv.config({ path: resolve(__dirname, "../.env") });

import { getEmailQueue, addEmailToQueue, getQueueStats, closeEmailQueue } from "../lib/email-queue";
import { EmailJobData } from "../lib/email-queue";

async function testWorkerWithLogs() {
  console.log("🚀 Test du worker avec logs...\n");

  try {
    // Vérifier les credentials
    console.log("🔍 Vérification des credentials...");
    console.log(`GMAIL_USER: ${process.env.GMAIL_USER ? "✅ Configuré" : "❌ Non configuré"}`);
    console.log(`GMAIL_PASSWORD: ${process.env.GMAIL_PASSWORD ? "✅ Configuré" : "❌ Non configuré"}`);
    console.log(`REDIS_URL: ${process.env.REDIS_URL ? "✅ Configuré" : "❌ Non configuré"}\n`);

    // Créer la queue
    const queue = getEmailQueue();
    await queue.waitUntilReady();
    console.log("✅ Queue prête\n");

    // Ajouter un email de test
    console.log("📧 Ajout d'un email de test à la queue...");
    const testEmail: EmailJobData = {
      type: "verification",
      to: "jeaneudes.woto31@gmail.com",
      subject: "Test Email Queue",
      html: "<h1>Test Email</h1><p>Ceci est un email de test pour vérifier le worker.</p>",
      text: "Test Email\n\nCeci est un email de test pour vérifier le worker.",
      metadata: {
        name: "Test User",
        token: "test-token-123",
      },
    };

    await addEmailToQueue(testEmail);
    console.log("✅ Email ajouté à la queue\n");

    // Attendre un peu pour que le worker traite
    console.log("⏳ Attente de 5 secondes pour que le worker traite le job...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Vérifier les statistiques
    console.log("\n📊 Statistiques de la queue:");
    const stats = await getQueueStats();
    if (stats) {
      console.log(`  - En attente: ${stats.waiting}`);
      console.log(`  - En cours: ${stats.active}`);
      console.log(`  - Complétés: ${stats.completed}`);
      console.log(`  - Échoués: ${stats.failed}`);
      console.log(`  - Total: ${stats.total}`);

      if (stats.failed > 0) {
        console.log("\n⚠️  Des jobs ont échoué. Vérifiez les logs du worker pour plus de détails.");
        console.log("💡 Pour voir les logs du worker, exécutez: npm run worker:email");
      }

      if (stats.completed > 0) {
        console.log("\n✅ Des jobs ont été complétés avec succès !");
      }
    }

    console.log("\n✅ Test terminé");
    console.log("\n💡 Pour démarrer le worker et voir les logs:");
    console.log("   npm run worker:email");

  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
    throw error;
  } finally {
    // Fermer la connexion
    await closeEmailQueue();
  }
}

// Exécuter les tests
testWorkerWithLogs()
  .then(() => {
    console.log("\n🎉 Test terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur lors du test:", error);
    process.exit(1);
  });

