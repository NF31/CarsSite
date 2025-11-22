"use server";

import { cookies } from "next/headers";

const COOKIE_CONSENT_KEY = "cookie-consent";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 an en secondes

export interface SetCookieConsentInput {
  status: "accepted" | "rejected";
}

export interface SetCookieConsentResult {
  success: boolean;
  error?: string;
}

/**
 * Action serveur pour enregistrer le consentement aux cookies
 * Stocke le consentement dans un cookie HTTP pour pouvoir le vérifier côté serveur
 */
export async function setCookieConsentAction(
  input: SetCookieConsentInput
): Promise<SetCookieConsentResult> {
  try {
    const cookieStore = await cookies();

    // Stocker le consentement dans un cookie HTTP
    cookieStore.set(COOKIE_CONSENT_KEY, input.status, {
      httpOnly: false, // Accessible côté client aussi pour JavaScript
      secure: process.env.NODE_ENV === "production", // HTTPS en production
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("[setCookieConsentAction] Erreur:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

