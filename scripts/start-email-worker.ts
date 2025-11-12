#!/usr/bin/env tsx
/**
 * Script pour démarrer le worker email
 * Usage: npx tsx scripts/start-email-worker.ts
 */

import dotenv from "dotenv";
import { resolve } from "path";

// IMPORTANT: Charger les variables d'environnement AVANT d'importer le worker
// pour que les credentials soient disponibles lors du chargement du module
dotenv.config({ path: resolve(__dirname, "../.env") });

// Vérifier que les variables sont chargées
console.log("🔍 Vérification des variables d'environnement...");
console.log(`GMAIL_USER: ${process.env.GMAIL_USER ? "✅ Configuré" : "❌ Non configuré"}`);
console.log(`GMAIL_PASSWORD: ${process.env.GMAIL_PASSWORD ? "✅ Configuré" : "❌ Non configuré"}`);
console.log(`REDIS_URL: ${process.env.REDIS_URL ? "✅ Configuré" : "❌ Non configuré"}`);

import { createEmailWorker } from "../workers/email-worker";

console.log("🚀 Démarrage du worker email...");

try {
  const worker = createEmailWorker();

  // Gérer l'arrêt gracieux
  process.on("SIGINT", async () => {
    console.log("\n⏹️  Arrêt du worker...");
    await worker.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n⏹️  Arrêt du worker...");
    await worker.close();
    process.exit(0);
  });

  console.log("✅ Worker email démarré avec succès");
  console.log("📧 En attente de jobs email...");
} catch (error) {
  console.error("❌ Erreur lors du démarrage du worker:", error);
  process.exit(1);
}

