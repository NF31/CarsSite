/**
 * Gestion du consentement aux cookies côté serveur
 */

import { cookies } from "next/headers";

export const COOKIE_CONSENT_KEY = "cookie-consent";

export type CookieConsentStatus = "accepted" | "rejected" | null;

/**
 * Récupère le statut du consentement aux cookies depuis les cookies HTTP (côté serveur)
 * Utilisable dans les Server Components, Server Actions, et API routes
 */
export async function getCookieConsentServer(): Promise<CookieConsentStatus> {
  try {
    const cookieStore = await cookies();
    const consent = cookieStore.get(COOKIE_CONSENT_KEY);

    if (consent?.value === "accepted" || consent?.value === "rejected") {
      return consent.value;
    }

    return null;
  } catch (error) {
    console.error("[getCookieConsentServer] Erreur:", error);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur a accepté les cookies analytiques (côté serveur)
 * Utilisable dans les Server Components, Server Actions, et API routes
 */
export async function hasAcceptedAnalyticsCookiesServer(): Promise<boolean> {
  const consent = await getCookieConsentServer();
  return consent === "accepted";
}

