/**
 * Script de test pour vérifier l'intégration Redis
 * Exécuter avec: npx tsx scripts/test-redis.ts
 */

// Charger les variables d'environnement
import dotenv from "dotenv";
import { resolve } from "path";

// Charger .env depuis la racine du projet
dotenv.config({ path: resolve(__dirname, "../.env") });

import { getRedisClient, isRedisAvailable, closeRedisConnection } from "../lib/redis";
import {
  getCache,
  setCache,
  deleteCache,
  getOrSetCache,
} from "../lib/cache";
import {
  checkRateLimitRedis,
  recordRateLimitAttemptRedis,
} from "../lib/rate-limit-redis";

async function testRedisConnection() {
  console.log("🔍 Test 1: Vérification de la connexion Redis...");
  try {
    const available = await isRedisAvailable();
    if (available) {
      console.log("✅ Redis est disponible et connecté");
    } else {
      console.log("❌ Redis n'est pas disponible");
      return false;
    }
  } catch (error) {
    console.error("❌ Erreur lors de la vérification Redis:", error);
    return false;
  }
  return true;
}

async function testCacheOperations() {
  console.log("\n🔍 Test 2: Test des opérations de cache...");
  try {
    const testKey = "test-key";
    const testValue = { message: "Hello Redis!", timestamp: Date.now() };

    // Test SET
    console.log("  → Test SET cache...");
    const setResult = await setCache(testKey, testValue, {
      prefix: "test",
      ttl: 60,
    });
    if (setResult) {
      console.log("  ✅ SET réussi");
    } else {
      console.log("  ❌ SET échoué");
      return false;
    }

    // Test GET
    console.log("  → Test GET cache...");
    const cached = await getCache<typeof testValue>(testKey, "test");
    if (cached && cached.message === testValue.message) {
      console.log("  ✅ GET réussi - Valeur récupérée:", cached.message);
    } else {
      console.log("  ❌ GET échoué ou valeur incorrecte");
      return false;
    }

    // Test DELETE
    console.log("  → Test DELETE cache...");
    const deleteResult = await deleteCache(testKey, "test");
    if (deleteResult) {
      console.log("  ✅ DELETE réussi");
    } else {
      console.log("  ❌ DELETE échoué");
      return false;
    }

    // Vérifier que la valeur est bien supprimée
    const afterDelete = await getCache<typeof testValue>(testKey, "test");
    if (afterDelete === null) {
      console.log("  ✅ Vérification suppression: OK");
    } else {
      console.log("  ❌ La valeur existe encore après suppression");
      return false;
    }

    // Test getOrSetCache
    console.log("  → Test getOrSetCache...");
    let callCount = 0;
    const cachedValue = await getOrSetCache(
      "get-or-set-test",
      async () => {
        callCount++;
        return { data: "fetched from function", count: callCount };
      },
      {
        prefix: "test",
        ttl: 10,
      }
    );

    if (cachedValue.count === 1) {
      console.log("  ✅ getOrSetCache: Fonction appelée une fois");
    } else {
      console.log("  ❌ getOrSetCache: Fonction appelée plusieurs fois");
      return false;
    }

    // Appeler à nouveau - devrait utiliser le cache
    const cachedValue2 = await getOrSetCache(
      "get-or-set-test",
      async () => {
        callCount++;
        return { data: "fetched from function", count: callCount };
      },
      {
        prefix: "test",
        ttl: 10,
      }
    );

    if (cachedValue2.count === 1 && callCount === 1) {
      console.log("  ✅ getOrSetCache: Cache utilisé correctement");
    } else {
      console.log("  ❌ getOrSetCache: Cache non utilisé");
      return false;
    }

    // Nettoyer
    await deleteCache("get-or-set-test", "test");

    return true;
  } catch (error) {
    console.error("  ❌ Erreur lors des tests de cache:", error);
    return false;
  }
}

async function testRateLimiting() {
  console.log("\n🔍 Test 3: Test du rate-limiting...");
  try {
    const testIdentifier = `test-${Date.now()}`;
    const testConfig = {
      maxAttempts: 3,
      windowMs: 60 * 1000, // 1 minute
    };

    // Test 1: Première vérification (avant enregistrement)
    console.log("  → Test première vérification (avant enregistrement)...");
    const limit1 = await checkRateLimitRedis(testIdentifier, "email", testConfig);
    if (limit1.allowed && limit1.remaining === 3) {
      console.log("  ✅ Première vérification: OK (remaining: 3)");
    } else {
      console.log(`  ❌ Première vérification échouée (remaining: ${limit1.remaining}, expected: 3)`);
      return false;
    }

    // Enregistrer la première tentative
    await recordRateLimitAttemptRedis(testIdentifier, "email");

    // Test 2: Deuxième vérification (après 1 tentative enregistrée)
    console.log("  → Test deuxième vérification (après 1 tentative)...");
    const limit2 = await checkRateLimitRedis(testIdentifier, "email", testConfig);
    if (limit2.allowed && limit2.remaining === 2) {
      console.log("  ✅ Deuxième vérification: OK (remaining: 2)");
    } else {
      console.log(`  ❌ Deuxième vérification échouée (remaining: ${limit2.remaining}, expected: 2)`);
      return false;
    }

    // Enregistrer la deuxième tentative
    await recordRateLimitAttemptRedis(testIdentifier, "email");

    // Test 3: Troisième vérification (après 2 tentatives enregistrées)
    console.log("  → Test troisième vérification (après 2 tentatives)...");
    const limit3 = await checkRateLimitRedis(testIdentifier, "email", testConfig);
    if (limit3.allowed && limit3.remaining === 1) {
      console.log("  ✅ Troisième vérification: OK (remaining: 1)");
    } else {
      console.log(`  ❌ Troisième vérification échouée (remaining: ${limit3.remaining}, expected: 1)`);
      return false;
    }

    // Enregistrer la troisième tentative
    await recordRateLimitAttemptRedis(testIdentifier, "email");

    // Test 4: Quatrième tentative (devrait être bloquée)
    console.log("  → Test quatrième tentative (devrait être bloquée)...");
    const limit4 = await checkRateLimitRedis(testIdentifier, "email", testConfig);
    if (!limit4.allowed && limit4.remaining === 0) {
      console.log("  ✅ Quatrième tentative: Bloquée correctement");
    } else {
      console.log("  ❌ Quatrième tentative: Devrait être bloquée");
      return false;
    }

    return true;
  } catch (error) {
    console.error("  ❌ Erreur lors des tests de rate-limiting:", error);
    return false;
  }
}

async function testPing() {
  console.log("\n🔍 Test 4: Test PING Redis...");
  try {
    const client = getRedisClient();
    const result = await client.ping();
    if (result === "PONG") {
      console.log("  ✅ PING réussi");
      return true;
    } else {
      console.log("  ❌ PING échoué");
      return false;
    }
  } catch (error) {
    console.error("  ❌ Erreur lors du PING:", error);
    return false;
  }
}

async function showRedisKeys() {
  console.log("\n🔍 Test 5: Affichage des clés Redis...");
  try {
    const client = getRedisClient();
    
    // Lister toutes les clés
    const allKeys = await client.keys("*");
    console.log(`  📊 Nombre total de clés: ${allKeys.length}`);
    
    if (allKeys.length === 0) {
      console.log("  ℹ️  Aucune clé trouvée dans Redis");
      return true;
    }

    // Grouper par préfixe
    const keysByPrefix: Record<string, string[]> = {};
    for (const key of allKeys) {
      const prefix = key.split(":")[0];
      if (!keysByPrefix[prefix]) {
        keysByPrefix[prefix] = [];
      }
      keysByPrefix[prefix].push(key);
    }

    console.log("\n  📋 Clés par préfixe:");
    for (const [prefix, keys] of Object.entries(keysByPrefix)) {
      console.log(`    ${prefix}: ${keys.length} clé(s)`);
    }

    // Afficher quelques exemples de valeurs
    console.log("\n  🔍 Exemples de valeurs (premières 10 clés):");
    const sampleKeys = allKeys.slice(0, 10);
    for (const key of sampleKeys) {
      try {
        const value = await client.get(key);
        const ttl = await client.ttl(key);
        if (value) {
          // Essayer de parser en JSON
          let parsedValue: unknown;
          try {
            parsedValue = JSON.parse(value);
          } catch {
            parsedValue = value;
          }
          
          const valueStr = typeof parsedValue === "object" 
            ? JSON.stringify(parsedValue).substring(0, 100) + "..."
            : String(value).substring(0, 100);
          
          console.log(`    ${key}:`);
          console.log(`      Valeur: ${valueStr}`);
          console.log(`      TTL: ${ttl > 0 ? `${ttl}s` : "pas d'expiration"}`);
        } else {
          const type = await client.type(key);
          console.log(`    ${key}: (type: ${type})`);
        }
      } catch {
        console.log(`    ${key}: (erreur lors de la lecture)`);
      }
    }

    return true;
  } catch (error) {
    console.error("  ❌ Erreur lors de l'affichage des clés:", error);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Démarrage des tests Redis...\n");

  const results = {
    connection: false,
    cache: false,
    rateLimit: false,
    ping: false,
    showKeys: false,
  };

  // Test 1: Connexion
  results.connection = await testRedisConnection();
  if (!results.connection) {
    console.log("\n❌ Les tests sont arrêtés car Redis n'est pas disponible.");
    console.log("   Vérifiez votre variable REDIS_URL dans .env");
    await closeRedisConnection();
    process.exit(1);
  }

  // Test 2: PING
  results.ping = await testPing();

  // Test 3: Cache
  results.cache = await testCacheOperations();

  // Test 4: Rate-limiting
  results.rateLimit = await testRateLimiting();

  // Test 5: Afficher les clés Redis
  results.showKeys = await showRedisKeys();

  // Résumé
  console.log("\n" + "=".repeat(50));
  console.log("📊 RÉSUMÉ DES TESTS");
  console.log("=".repeat(50));
  console.log(`Connexion Redis:     ${results.connection ? "✅" : "❌"}`);
  console.log(`PING Redis:          ${results.ping ? "✅" : "❌"}`);
  console.log(`Opérations Cache:    ${results.cache ? "✅" : "❌"}`);
  console.log(`Rate-limiting:       ${results.rateLimit ? "✅" : "❌"}`);
  console.log(`Affichage clés:      ${results.showKeys ? "✅" : "❌"}`);
  console.log("=".repeat(50));

  const allPassed = Object.values(results).every((r) => r === true);
  if (allPassed) {
    console.log("\n🎉 Tous les tests sont passés ! Redis fonctionne correctement.");
  } else {
    console.log("\n⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.");
  }

  await closeRedisConnection();
  process.exit(allPassed ? 0 : 1);
}

// Exécuter les tests
runTests().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  closeRedisConnection();
  process.exit(1);
});

