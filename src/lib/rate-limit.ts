import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Check if Upstash is configured
const isUpstashConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// Create Redis client only if configured
const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Rate limiters for different endpoints
// Generate is the most expensive operation (AI image generation)
export const generateRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 d'), // 10 generations per day for free tier
      analytics: true,
      prefix: 'ratelimit:generate',
    })
  : null;

// Analysis is cheaper but still uses AI
export const analyzeRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, '1 d'), // 50 analyses per day
      analytics: true,
      prefix: 'ratelimit:analyze',
    })
  : null;

// Resize uses AI for smart resizing
export const resizeRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 d'), // 100 resizes per day
      analytics: true,
      prefix: 'ratelimit:resize',
    })
  : null;

// General limiter for lighter operations (suggestions, prompts)
export const generalRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, '1 d'), // 200 requests per day
      analytics: true,
      prefix: 'ratelimit:general',
    })
  : null;

// Helper function to check rate limit
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
  limitName: string = 'requests'
): Promise<{ success: boolean; response?: NextResponse }> {
  // If rate limiting is not configured, allow all requests (for development)
  if (!limiter) {
    console.log(`Rate limiting not configured - allowing request for ${limitName}`);
    return { success: true };
  }

  const { success, limit, reset, remaining } = await limiter.limit(identifier);

  if (!success) {
    const resetDate = new Date(reset);
    const response = NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `You've reached your daily limit for ${limitName}. Limit resets at ${resetDate.toISOString()}.`,
        limit,
        remaining: 0,
        reset: resetDate.toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
    return { success: false, response };
  }

  return { success: true };
}

// Export a function to check if rate limiting is enabled
export function isRateLimitingEnabled(): boolean {
  return isUpstashConfigured;
}
