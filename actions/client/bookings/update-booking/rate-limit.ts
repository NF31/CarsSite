import { headers } from "next/headers";
import { checkRateLimit, recordRateLimitAttempt } from "@/lib/rate-limit-redis";
import type { RateLimitConfig } from "./types";

export interface RateLimitResult {
  allowed: boolean;
  error?: string;
}

/**
 * Vérifie et enregistre une tentative de rate limiting pour la modification de réservation
 */
export async function checkBookingUpdateRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const headersList = await headers();
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  const rateLimitKey = `booking-edit:${userId}`;
  const rateLimit = await checkRateLimit(rateLimitKey, "email", config);

  if (!rateLimit.allowed) {
    const minutes = Math.max(
      1,
      Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000)
    );
    return {
      allowed: false,
      error: `Trop de tentatives de modification. Réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.`,
    };
  }

  await recordRateLimitAttempt(rateLimitKey, "email");
  if (ipAddress !== "unknown") {
    await recordRateLimitAttempt(`booking-edit-ip:${ipAddress}`, "ip");
  }

  return { allowed: true };
}

