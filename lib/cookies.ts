/**
 * Gestion du consentement aux cookies côté client
 * Utilise uniquement les cookies HTTP pour plus de sécurité (pas de localStorage)
 */

export const COOKIE_CONSENT_KEY = "cookie-consent";

export type CookieConsentStatus = "accepted" | "rejected" | null;

/**
 * Récupère le consentement depuis les cookies HTTP (côté client)
 * Le cookie n'est pas httpOnly, donc accessible via JavaScript
 */
export function getCookieConsent(): CookieConsentStatus {
  if (typeof document === "undefined") {
    return null;
  }

  // Lire le cookie HTTP
  const cookies = document.cookie.split(";");
  const consentCookie = cookies.find((cookie) =>
    cookie.trim().startsWith(`${COOKIE_CONSENT_KEY}=`)
  );

  if (consentCookie) {
    const value = consentCookie.split("=")[1]?.trim();
    if (value === "accepted" || value === "rejected") {
      return value;
    }
  }

  return null;
}

/**
 * Vérifie si l'utilisateur a accepté les cookies analytiques
 * Utilise uniquement les cookies HTTP (pas de localStorage pour plus de sécurité)
 */
export function hasAcceptedAnalyticsCookies(): boolean {
  return getCookieConsent() === "accepted";
}

/**
 * Définit un cookie HTTP côté client (pour synchronisation immédiate avant action serveur)
 * Note: L'action serveur définira aussi le cookie de manière sécurisée
 */
export function setCookieConsentClient(status: "accepted" | "rejected"): void {
  if (typeof document === "undefined") {
    return;
  }

  // Calculer la date d'expiration (1 an)
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 1);

  // Définir le cookie HTTP côté client
  document.cookie = `${COOKIE_CONSENT_KEY}=${status}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

/**
 * Supprime le consentement aux cookies (pour permettre de redemander)
 */
export function clearCookieConsent(): void {
  if (typeof document === "undefined") {
    return;
  }

  // Supprimer le cookie HTTP
  document.cookie = `${COOKIE_CONSENT_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

