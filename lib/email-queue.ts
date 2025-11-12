import { Queue } from "bullmq";
import IORedis from "ioredis";

// Types de jobs email
export type EmailJobType =
  | "verification"
  | "password-reset"
  | "account-deletion"
  | "booking-confirmation"
  | "booking-update"
  | "booking-cancellation"
  | "booking-cancellation-rejected"
  | "booking-cancellation-request";

// Interface pour les données d'un job email
export interface EmailJobData {
  type: EmailJobType;
  to: string;
  subject: string;
  html: string;
  text?: string;
  // Données spécifiques pour chaque type d'email
  metadata?: Record<string, string | undefined>;
}

// Configuration de la queue
const queueName = "email-queue";

// Créer la queue email
let emailQueue: Queue<EmailJobData> | null = null;

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
  // C'est la méthode recommandée par la documentation BullMQ
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
    console.log("[Email Queue] Connexion Redis établie");
  });

  redisConnection.on("error", (error) => {
    console.error("[Email Queue] Erreur Redis:", error);
  });

  return redisConnection;
}

/**
 * Obtient ou crée la queue email
 */
export function getEmailQueue(): Queue<EmailJobData> {
  if (emailQueue) {
    return emailQueue;
  }

  try {
    const connection = getRedisConnection();
    
    emailQueue = new Queue<EmailJobData>(queueName, {
      connection,
      defaultJobOptions: {
        attempts: 3, // Nombre de tentatives en cas d'échec
        backoff: {
          type: "exponential",
          delay: 2000, // Délai initial de 2 secondes
        },
        removeOnComplete: {
          age: 24 * 3600, // Garder les jobs complétés pendant 24h
          count: 1000, // Garder les 1000 derniers jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Garder les jobs échoués pendant 7 jours
        },
      },
    });

    // Gérer les événements de la queue
    emailQueue.on("error", (error) => {
      console.error("[Email Queue] Erreur de la queue:", error);
    });

    emailQueue.on("waiting", (job) => {
      console.log(`[Email Queue] Job ${job.id} en attente`);
    });

    return emailQueue;
  } catch (error) {
    console.error("Error creating email queue:", error);
    throw error;
  }
}

/**
 * Ajoute un email à la queue
 */
export async function addEmailToQueue(data: EmailJobData): Promise<void> {
  try {
    const queue = getEmailQueue();
    
    // Vérifier que la queue est connectée avant d'ajouter
    await queue.waitUntilReady();
    
    await queue.add(
      data.type, // Nom du job
      data, // Données du job
      {
        // Priorité : les emails de vérification et reset sont prioritaires
        priority: 
          data.type === "verification" || data.type === "password-reset" ? 1 : 10,
      }
    );

    console.log(`[Email Queue] Email ${data.type} ajouté à la queue pour ${data.to}`);
  } catch (error) {
    console.error("[Email Queue] Erreur lors de l'ajout à la queue:", error);
    // Ne pas throw l'erreur pour permettre le fallback dans lib/email.ts
    throw error;
  }
}

/**
 * Obtient les statistiques de la queue
 */
export async function getQueueStats() {
  try {
    const queue = getEmailQueue();
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed,
    };
  } catch (error) {
    console.error("[Email Queue] Erreur lors de la récupération des stats:", error);
    return null;
  }
}

/**
 * Ferme la connexion de la queue
 */
export async function closeEmailQueue(): Promise<void> {
  if (emailQueue) {
    await emailQueue.close();
    emailQueue = null;
  }
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }
}
