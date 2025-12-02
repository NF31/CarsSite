import type { RateLimitConfig } from "./types";

export const RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 10 * 60 * 1000, // 10 minutes
};

