// src/middleware/rateLimiter.ts
import { rateLimiter } from 'hono-rate-limiter';

export const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 requests per window
  standardHeaders: true,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || 'anonymous',
});

export const otpLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 3, // 3 OTP requests per window
  standardHeaders: true,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || 'anonymous',
});