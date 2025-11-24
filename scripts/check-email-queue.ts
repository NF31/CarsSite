#!/usr/bin/env tsx
/**
 * Script pour vérifier l'état de la queue email
 * Usage: npx tsx scripts/check-email-queue.ts
 */

import dotenv from "dotenv";
import { resolve } from "path";

// Charger .env depuis la racine du projet
dotenv.config({ path: resolve(__dirname, "../.env") });

import { getQueueStats } from "../lib/email-queue";
import { isRedisAvailable } from "../lib/redis";

async function checkEmailQueue() {
  console.log("🔍 Vérification de l'état de la queue email...\n");

  // Vérifier Redis
  console.log("1. Vérification de Redis...");
  const redisAvailable = await isRedisAvailable().catch(() => false);
  if (redisAvailable) {
    console.log("   ✅ Redis est disponible\n");
  } else {
    console.log("   ❌ Redis n'est pas disponible\n");
    console.log("   ℹ️  Les emails seront envoyés directement (pas de queue)\n");
  }

  // Vérifier les credentials email
  console.log("2. Vérification des credentials email...");
  const hasGmailUser = !!process.env.GMAIL_USER;
  const hasGmailPassword = !!process.env.GMAIL_PASSWORD;
  
  if (hasGmailUser && hasGmailPassword) {
    console.log(`   ✅ Credentials configurés (${process.env.GMAIL_USER?.substring(0, 3)}...)\n`);
  } else {
    console.log("   ❌ Credentials non configurés");
    console.log("   ⚠️  GMAIL_USER:", hasGmailUser ? "✅ Configuré" : "❌ Non configuré");
    console.log("   ⚠️  GMAIL_PASSWORD:", hasGmailPassword ? "✅ Configuré" : "❌ Non configuré\n");
  }

  // Si Redis est disponible, vérifier les stats de la queue
  if (redisAvailable) {
    console.log("3. Statistiques de la queue email...");
    try {
      const stats = await getQueueStats();
      if (stats) {
        console.log(`   📊 Emails en attente: ${stats.waiting}`);
        console.log(`   📊 Emails en cours: ${stats.active}`);
        console.log(`   📊 Emails complétés: ${stats.completed}`);
        console.log(`   📊 Emails échoués: ${stats.failed}`);
        console.log(`   📊 Total: ${stats.total}\n`);

        if (stats.waiting > 0) {
          console.log("   ⚠️  Il y a des emails en attente dans la queue !");
          console.log("   💡 Vérifiez que le worker email est en cours d'exécution :");
          console.log("      npm run worker:email\n");
        } else if (stats.failed > 0) {
          console.log("   ⚠️  Il y a des emails échoués dans la queue !");
          console.log("   💡 Vérifiez les logs du worker pour plus de détails\n");
        } else {
          console.log("   ✅ Aucun email en attente\n");
        }
      } else {
        console.log("   ❌ Impossible de récupérer les statistiques de la queue\n");
      }
    } catch (error) {
      console.error("   ❌ Erreur lors de la récupération des stats:", error);
      console.log("\n");
    }
  }

  // Recommandations
  console.log("📋 Recommandations :");
  
  if (!redisAvailable) {
    console.log("   • Redis n'est pas disponible → les emails sont envoyés directement");
    if (!hasGmailUser || !hasGmailPassword) {
      console.log("   • ❌ Les credentials email ne sont pas configurés");
      console.log("   • 💡 Configurez GMAIL_USER et GMAIL_PASSWORD dans .env pour envoyer des emails\n");
    } else {
      console.log("   • ✅ Les credentials sont configurés → les emails devraient être envoyés directement\n");
    }
  } else {
    if (hasGmailUser && hasGmailPassword) {
      console.log("   • ✅ Redis disponible et credentials configurés");
      console.log("   • 💡 Assurez-vous que le worker email est en cours d'exécution :");
      console.log("      npm run worker:email\n");
    } else {
      console.log("   • ⚠️  Redis disponible mais credentials non configurés");
      console.log("   • 💡 Le worker ne pourra pas envoyer d'emails sans credentials\n");
    }
  }
}

checkEmailQueue().catch(console.error);


