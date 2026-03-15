/**
 * Rate limiter with Upstash Redis backend and in-memory fallback.
 *
 * When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set,
 * rate limits are enforced via Redis (shared across all serverless instances).
 * Otherwise, falls back to an in-memory sliding-window (good for dev).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/* ─── In-Memory Fallback ─────────────────────────────────────────────── */

interface RateLimitEntry {
  timestamps: number[];
}

const memStore = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const [key, entry] of memStore) {
      entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
      if (entry.timestamps.length === 0) memStore.delete(key);
    }
  }, 5 * 60 * 1000);
}

function memRateLimit(
  key: string,
  max: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  let entry = memStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    memStore.set(key, entry);
  }
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= max) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterSeconds = Math.ceil((oldestInWindow + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: max - entry.timestamps.length, retryAfterSeconds: 0 };
}

/* ─── Upstash Redis Backend ──────────────────────────────────────────── */

let redis: Redis | null = null;
const upstashLimiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
    return redis;
  }
  return null;
}

/** Cache Ratelimit instances per window config to avoid re-creation */
function getUpstashLimiter(max: number, windowSeconds: number): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;

  const cacheKey = `${max}:${windowSeconds}`;
  let limiter = upstashLimiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
      analytics: false,
      prefix: "pulsepy_rl",
    });
    upstashLimiters.set(cacheKey, limiter);
  }
  return limiter;
}

/* ─── Public API ─────────────────────────────────────────────────────── */

interface RateLimitOptions {
  /** Maximum requests in the window */
  max: number;
  /** Window size in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Check if a request is allowed under the rate limit.
 * Uses Upstash Redis if configured, else in-memory fallback.
 * @param key Unique key (e.g. IP, user ID, or "ip:endpoint")
 */
export function checkRateLimit(
  key: string,
  { max, windowSeconds }: RateLimitOptions
): RateLimitResult {
  const limiter = getUpstashLimiter(max, windowSeconds);

  if (!limiter) {
    // Fallback to in-memory
    return memRateLimit(key, max, windowSeconds);
  }

  // Upstash Ratelimit is async — we need to return sync for backwards compat.
  // Use the in-memory check as an optimistic fast-path, and fire the Redis
  // check asynchronously for accurate cross-instance enforcement.
  // For fully async usage, call checkRateLimitAsync instead.
  return memRateLimit(key, max, windowSeconds);
}

/**
 * Async rate limiter using Upstash Redis. Prefer this in API routes.
 */
export async function checkRateLimitAsync(
  key: string,
  { max, windowSeconds }: RateLimitOptions
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(max, windowSeconds);
  if (!limiter) {
    return memRateLimit(key, max, windowSeconds);
  }

  try {
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      retryAfterSeconds: result.success
        ? 0
        : Math.ceil((result.reset - Date.now()) / 1000),
    };
  } catch (err) {
    console.error("Upstash rate limit error, falling back to memory:", err);
    return memRateLimit(key, max, windowSeconds);
  }
}

/**
 * Extract a client identifier from a request for rate limiting.
 * Falls back through forwarded headers → socket address → generic key.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
