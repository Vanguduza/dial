/**
 * Shared HTTP request helpers — Zod body parse, uniform error envelope, token-bucket.
 * Applied by gateway mutating routes. Never trusts body userId/role (D-47).
 */
import { randomUUID } from "node:crypto";
import { z, type ZodType } from "zod";

export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  requestId: z.string(),
});

export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export function newRequestId(header?: string | null): string {
  const given = header?.trim();
  if (given && /^[A-Za-z0-9._-]{8,64}$/.test(given)) return given;
  return `req_${randomUUID()}`;
}

export function apiError(
  error: string,
  code: string,
  requestId: string,
): ApiErrorBody {
  return { error, code, requestId };
}

const IDENTITY_KEYS = new Set(["userId", "user_id", "email", "role"]);

export async function parseJsonBody<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; error: string; code: string }> {
  const raw: unknown = await req.json().catch(() => null);
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "JSON object required", code: "invalid_json" };
  }
  const obj = raw as Record<string, unknown>;
  for (const key of IDENTITY_KEYS) {
    if (key in obj) {
      return {
        ok: false,
        error: `${key} from body rejected (D-47)`,
        code: "identity_from_body",
      };
    }
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "invalid body",
      code: "invalid_body",
    };
  }
  return { ok: true, data: parsed.data };
}

type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Token bucket. Fixture / tests stay in-process. Sandbox/live callers should
 * pass a Redis-backed store later; the algorithm is the same.
 */
export function rateLimitTake(input: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = input.now ?? Date.now();
  const existing = buckets.get(input.key) ?? {
    tokens: input.limit,
    updatedAt: now,
  };
  const elapsed = Math.max(0, now - existing.updatedAt);
  const refill = (elapsed / input.windowMs) * input.limit;
  const tokens = Math.min(input.limit, existing.tokens + refill);
  if (tokens < 1) {
    buckets.set(input.key, { tokens, updatedAt: now });
    return {
      ok: false,
      retryAfterMs: Math.ceil((1 - tokens) * (input.windowMs / input.limit)),
    };
  }
  buckets.set(input.key, { tokens: tokens - 1, updatedAt: now });
  return { ok: true };
}

export function __resetRateLimitForTests(): void {
  buckets.clear();
}
