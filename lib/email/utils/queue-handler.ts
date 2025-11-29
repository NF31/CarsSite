import { isRedisAvailable } from "@/lib/redis";

export interface QueueResult {
  success: boolean;
  queued: boolean;
  messageId?: string;
}

export async function tryQueueEmail(
  queueFunction: () => Promise<QueueResult>
): Promise<QueueResult | null> {
  const useQueue = await isRedisAvailable().catch(() => false);

  if (!useQueue) {
    return null;
  }

  try {
    const result = await queueFunction();
    if (result.success && result.queued) {
      return result;
    }
  } catch {
    // Silently fail and fallback to direct send
  }

  return null;
}

