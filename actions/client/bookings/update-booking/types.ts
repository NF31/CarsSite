export interface UpdateBookingResult {
  success: boolean;
  error?: string;
  requiresPayment?: boolean;
  paymentUrl?: string;
  refundAmount?: number;
}

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

