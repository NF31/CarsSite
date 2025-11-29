import { hasEmailCredentials, getBaseUrl } from "../config";

export interface CredentialsCheckResult {
  hasCredentials: boolean;
  devUrl?: string;
}

export function checkEmailCredentials(devUrl?: string): CredentialsCheckResult {
  if (!hasEmailCredentials) {
    return {
      hasCredentials: false,
      devUrl: devUrl || `${getBaseUrl()}${devUrl ? "" : ""}`,
    };
  }

  return { hasCredentials: true };
}

export function throwMissingCredentialsError(): never {
  throw new Error(
    "Configuration email manquante. Veuillez configurer GMAIL_USER et GMAIL_PASSWORD dans votre fichier .env"
  );
}

