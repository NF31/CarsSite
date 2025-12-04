import { Worker, Job } from "bullmq";
import { EmailJobData } from "../lib/email-queue";
import nodemailer from "nodemailer";
import IORedis from "ioredis";

/**
 * Obtient la connexion Redis pour BullMQ
 * Selon la documentation BullMQ, il faut créer une instance IORedis
 * avec maxRetriesPerRequest: null
 */
let redisConnection: IORedis | null = null;

function getRedisConnection(): IORedis {
  // Réutiliser la connexion existante si elle existe
  if (redisConnection) {
    return redisConnection;
  }

  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is not set");
  }

  // Créer une instance IORedis avec maxRetriesPerRequest: null
  // Utiliser l'URL directement, IORedis la parse automatiquement
  redisConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // Requis pour BullMQ selon la doc
    enableReadyCheck: false,
    lazyConnect: true, // Ne pas se connecter immédiatement
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  // Gérer les événements de connexion
  redisConnection.on("connect", () => {
    console.log("[Email Worker] Connexion Redis établie");
  });

  redisConnection.on("error", (error) => {
    console.error("[Email Worker] Erreur Redis:", error);
  });

  return redisConnection;
}

// Configuration du transporter email
// Note: Les variables d'environnement doivent être chargées avant l'import de ce module
function getEmailCredentials() {
  // Vérifier les variables d'environnement à chaque appel pour s'assurer qu'elles sont disponibles
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_PASSWORD;
  
  // Log de diagnostic (uniquement si les credentials sont manquants pour ne pas surcharger les logs)
  if (!gmailUser || !gmailPassword) {
    console.warn("[Email Worker] ⚠️  Credentials manquants au moment de la vérification");
    console.warn(`[Email Worker] GMAIL_USER: ${gmailUser ? `✅ "${gmailUser.substring(0, 3)}..."` : "❌ Non défini"}`);
    console.warn(`[Email Worker] GMAIL_PASSWORD: ${gmailPassword ? "✅ Configuré" : "❌ Non défini"}`);
  }
  
  return {
    hasCredentials: !!(gmailUser && gmailPassword),
    user: gmailUser,
    password: gmailPassword,
  };
}

// Transporter email (créé dynamiquement à chaque utilisation pour s'assurer que les credentials sont à jour)
function getTransporter(): nodemailer.Transporter | null {
  const credentials = getEmailCredentials();
  
  if (!credentials.hasCredentials) {
    console.warn("[Email Worker] ⚠️  Transporter non créé car credentials manquants");
    console.warn(`[Email Worker] GMAIL_USER: ${credentials.user ? "✅ Configuré" : "❌ Non configuré"}`);
    console.warn(`[Email Worker] GMAIL_PASSWORD: ${credentials.password ? "✅ Configuré" : "❌ Non configuré"}`);
    return null;
  }
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: credentials.user,
        pass: credentials.password,
      },
    });
    
    return transporter;
  } catch (error) {
    console.error("[Email Worker] ❌ Erreur lors de la création du transporter:", error);
    return null;
  }
}

/**
 * Traite un job email
 */
async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { type, to, subject, html, text } = job.data;

  console.log(`[Email Worker] Traitement de l'email ${type} pour ${to}`);

  // Vérifier si les credentials sont configurés et créer le transporter
  const credentials = getEmailCredentials();
  const transporter = getTransporter();
  
  if (!credentials.hasCredentials || !transporter) {
    const errorMsg = `[Email Worker] ⚠️  Email credentials non configurés. L'email ${type} n'a pas pu être envoyé.`;
    console.warn(errorMsg);
    console.warn(`[Email Worker] GMAIL_USER: ${credentials.user ? "✅ Configuré" : "❌ Non configuré"}`);
    console.warn(`[Email Worker] GMAIL_PASSWORD: ${credentials.password ? "✅ Configuré" : "❌ Non configuré"}`);
    console.warn(`[Email Worker] Vérifiez que les variables d'environnement sont chargées dans le script de démarrage du worker.`);
    throw new Error("Configuration email manquante");
  }

  try {
    // Préparer les options d'email
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"CarRental" <${credentials.user}>`,
      to,
      subject,
      html,
      text: text || undefined,
    };

    // Ajouter les pièces jointes si présentes (décoder depuis base64)
    if (job.data.attachments && job.data.attachments.length > 0) {
      mailOptions.attachments = job.data.attachments.map((att) => ({
        filename: att.filename,
        content: Buffer.from(att.contentBase64, "base64"),
        contentType: att.contentType || "application/pdf",
      }));
      console.log(`[Email Worker] 📎 ${job.data.attachments.length} pièce(s) jointe(s) ajoutée(s)`);
    }

    console.log(`[Email Worker] 📧 Envoi de l'email ${type} à ${to}...`);
    console.log(`[Email Worker] 📧 Depuis: ${credentials.user}`);
    
    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);

    console.log(
      `[Email Worker] ✅ Email ${type} envoyé avec succès pour ${to} (messageId: ${info.messageId})`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error(
      `[Email Worker] ❌ Erreur lors de l'envoi de l'email ${type} pour ${to}:`
    );
    console.error(`[Email Worker] Message: ${errorMessage}`);
    if (errorStack) {
      console.error(`[Email Worker] Stack: ${errorStack}`);
    }

    // Relancer l'erreur pour que BullMQ puisse gérer les tentatives
    throw error;
  }
}

/**
 * Crée et démarre le worker email
 */
export function createEmailWorker(): Worker<EmailJobData> {
  try {
    // Vérifier les credentials au démarrage du worker
    console.log("[Email Worker] 🔍 Vérification des credentials au démarrage...");
    const credentials = getEmailCredentials();
    if (credentials.hasCredentials) {
      console.log("[Email Worker] ✅ Credentials email disponibles");
      console.log(`[Email Worker] 📧 GMAIL_USER: ${credentials.user?.substring(0, 3)}...`);
    } else {
      console.warn("[Email Worker] ⚠️  Credentials email non disponibles au démarrage");
      console.warn("[Email Worker] ⚠️  Les emails échoueront jusqu'à ce que les credentials soient configurés");
      console.warn("[Email Worker] 💡 Vérifiez que dotenv.config() est appelé AVANT l'import du worker");
      console.warn("[Email Worker] 💡 Vérifiez que GMAIL_USER et GMAIL_PASSWORD sont dans le fichier .env");
    }
    
    const connection = getRedisConnection();
    
    const worker = new Worker<EmailJobData>(
      "email-queue",
      async (job: Job<EmailJobData>) => {
        await processEmailJob(job);
      },
      {
        connection,
        concurrency: 5, // Traiter 5 emails en parallèle
        limiter: {
          max: 10, // Maximum 10 emails
          duration: 1000, // Par seconde
        },
      }
    );

    // Événements du worker
    worker.on("completed", (job) => {
      console.log(`[Email Worker] ✅ Job ${job.id} complété`);
    });

    worker.on("failed", (job, err) => {
      console.error(
        `[Email Worker] ❌ Job ${job?.id} échoué:`,
        err.message
      );
    });

    worker.on("error", (err) => {
      console.error("[Email Worker] ❌ Erreur du worker:", err);
    });

    console.log("[Email Worker] ✅ Worker email démarré");

    return worker;
  } catch (error) {
    console.error("[Email Worker] ❌ Erreur lors de la création du worker:", error);
    throw error;
  }
}

// Si ce fichier est exécuté directement, démarrer le worker
if (require.main === module) {
  console.log("[Email Worker] 🚀 Démarrage du worker email...");
  const worker = createEmailWorker();

  // Gérer l'arrêt gracieux
  process.on("SIGINT", async () => {
    console.log("[Email Worker] ⏹️  Arrêt du worker...");
    await worker.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("[Email Worker] ⏹️  Arrêt du worker...");
    await worker.close();
    process.exit(0);
  });
}
