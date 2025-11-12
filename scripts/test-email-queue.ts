#!/usr/bin/env tsx
/**
 * Script pour tester la queue email
 * Usage: npx tsx scripts/test-email-queue.ts
 */

import dotenv from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement
dotenv.config({ path: resolve(__dirname, "../.env") });

import { getEmailQueue, addEmailToQueue, getQueueStats, closeEmailQueue } from "../lib/email-queue";
import { EmailJobData } from "../lib/email-queue";

async function testEmailQueue() {
  console.log("🚀 Test de la queue email...\n");

  try {
    // Test 1: Créer la queue
    console.log("🔍 Test 1: Création de la queue...");
    const queue = getEmailQueue();
    console.log("  ✅ Queue créée avec succès");

    // Test 2: Ajouter un email de test à la queue
    console.log("\n🔍 Test 2: Ajout d'un email de test à la queue...");
    const testEmail: EmailJobData = {
      type: "verification",
      to: "jeaneudes.woto31@gmail.com",
      subject: "Test Email Queue",
      html: "<h1>Test Email</h1><p>Ceci est un email de test.</p>",
      text: "Test Email\n\nCeci est un email de test.",
      metadata: {
        name: "Test User",
        token: "test-token-123",
      },
    };

    await addEmailToQueue(testEmail);
    console.log("  ✅ Email ajouté à la queue avec succès");

    // Test 3: Obtenir les statistiques de la queue
    console.log("\n🔍 Test 3: Statistiques de la queue...");
    const stats = await getQueueStats();
    if (stats) {
      console.log(`  📊 Statistiques:`);
      console.log(`    - En attente: ${stats.waiting}`);
      console.log(`    - En cours: ${stats.active}`);
      console.log(`    - Complétés: ${stats.completed}`);
      console.log(`    - Échoués: ${stats.failed}`);
      console.log(`    - Total: ${stats.total}`);
      console.log("  ✅ Statistiques récupérées avec succès");
    } else {
      console.log("  ❌ Impossible de récupérer les statistiques");
    }

    // Test 4: Ajouter plusieurs emails de types différents
    console.log("\n🔍 Test 4: Ajout de plusieurs emails de types différents...");
    const emails: EmailJobData[] = [
      {
        type: "password-reset",
        to: "jeaneudes.woto31@gmail.com",
        subject: "Réinitialisation de mot de passe",
        html: "<h1>Reset Password</h1>",
        metadata: { name: "User", token: "reset-token" },
      },
      {
        type: "booking-confirmation",
        to: "jeaneudes.woto31@gmail.com",
        subject: "Confirmation de réservation",
        html: "<h1>Booking Confirmed</h1>",
        metadata: { name: "User", bookingReference: "BOOK-123" },
      },
    ];

    for (const email of emails) {
      await addEmailToQueue(email);
      console.log(`  ✅ Email ${email.type} ajouté à la queue`);
    }

    // Test 5: Vérifier les statistiques après ajout
    console.log("\n🔍 Test 5: Statistiques après ajout...");
    const statsAfter = await getQueueStats();
    if (statsAfter) {
      console.log(`  📊 Statistiques:`);
      console.log(`    - En attente: ${statsAfter.waiting}`);
      console.log(`    - En cours: ${statsAfter.active}`);
      console.log(`    - Total: ${statsAfter.total}`);
      console.log("  ✅ Statistiques mises à jour");
    }

    console.log("\n✅ Tous les tests sont passés !");
    console.log("\n💡 Pour traiter les emails, démarrez le worker avec:");
    console.log("   npm run worker:email");
    console.log("   ou");
    console.log("   npx tsx scripts/start-email-worker.ts");

  } catch (error) {
    console.error("❌ Erreur lors des tests:", error);
    throw error;
  } finally {
    // Fermer la connexion
    await closeEmailQueue();
  }
}

// Exécuter les tests
testEmailQueue()
  .then(() => {
    console.log("\n🎉 Tests terminés avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur lors des tests:", error);
    process.exit(1);
  });

