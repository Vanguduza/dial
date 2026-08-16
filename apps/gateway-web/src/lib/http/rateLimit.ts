/**
 * Redis token-bucket when REDIS_URL is set (sandbox/live). Fixture stays in-process.
 */
import { rateLimitTake } from "@dial/shared";
import type Redis from "ioredis";

let redisPromise: Promise<Redis | null> | null = null;

function redisOn(): boolean {
  const mode = (process.env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  return Boolean(process.env.REDIS_URL?.trim()) && mode !== "fixture";
}

async function client(): Promise<Redis | null> {
  if (!redisOn()) return null;
  if (!redisPromise) {
    redisPromise = import("ioredis")
      .then(({ default: RedisCtor }) => {
        const c = new RedisCtor(process.env.REDIS_URL!, {
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
        });
        c.on("error", () => undefined);
        return c;
      })
      .catch(() => null);
  }
  return redisPromise;
}

export async function takeRouteRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ ok: true } | { ok: false; retryAfterMs: number }> {
  const redis = await client();
  if (!redis) return rateLimitTake(input);
  const bucket = `dial:rl:${input.key}`;
  const n = await redis.incr(bucket);
  if (n === 1) await redis.pexpire(bucket, input.windowMs);
  if (n > input.limit) {
    const ttl = await redis.pttl(bucket);
    return { ok: false, retryAfterMs: Math.max(1, ttl) };
  }
  return { ok: true };
}
