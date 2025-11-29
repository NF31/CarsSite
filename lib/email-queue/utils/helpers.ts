/**
 * Utilitaires communs pour les fonctions de queue d'emails
 */

/**
 * Récupère l'URL de base de l'application
 */
export function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

/**
 * Génère l'URL du dashboard client
 */
export function getDashboardUrl(): string {
  return `${getBaseUrl()}/client/dashboard`;
}

/**
 * Convertit les attachments Buffer en base64 pour le stockage dans Redis
 */
export function convertAttachmentsToBase64(
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>
): Array<{
  filename: string;
  contentBase64: string;
  contentType: string;
}> | undefined {
  if (!attachments) return undefined;

  return attachments.map((att) => ({
    filename: att.filename,
    contentBase64: att.content.toString("base64"),
    contentType: att.contentType || "application/pdf",
  }));
}

/**
 * Wrapper pour gérer les erreurs dans les fonctions de queue
 */
export async function withQueueErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage: string
): Promise<{ success: boolean; queued: boolean }> {
  try {
    await fn();
    return { success: true, queued: true };
  } catch (error) {
    console.error(errorMessage, error);
    return { success: false, queued: false };
  }
}

/**
 * Récupère l'email de l'admin depuis les variables d'environnement
 */
export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL || process.env.GMAIL_USER || "admin@carrental.fr";
}

