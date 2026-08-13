/**
 * Durable processed_events claim (SQL table in supabase/migrations/0001_core_tables.sql).
 * Fixture / no Supabase URL: delegates to in-memory claimProcessedEvent.
 * Sandbox/live: POST to Supabase REST; unique violation ⇒ duplicate. Fail closed without URL.
 */
import { claimProcessedEvent, type IdempotencyClaim } from "./idempotency.js";

export type IntegrationMode = "fixture" | "sandbox" | "live";

export function integrationMode(
  env: NodeJS.ProcessEnv = process.env,
): IntegrationMode {
  const m = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (m === "sandbox" || m === "live") return m;
  return "fixture";
}

/**
 * Claim against processed_events (memory or Supabase).
 * Call only after signature verification.
 */
export async function claimProcessedEventDurable(
  input: { eventId: string; source: string },
  env: NodeJS.ProcessEnv = process.env,
): Promise<IdempotencyClaim> {
  const mode = integrationMode(env);
  if (mode === "fixture") {
    return claimProcessedEvent(input);
  }

  const url = env.SUPABASE_URL?.trim();
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY?.trim() || env.SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / key unset — fail closed for durable processed_events",
    );
  }

  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/processed_events`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      event_id: input.eventId,
      source: input.source,
    }),
  });

  if (res.status === 409 || res.status === 23505) {
    return "duplicate";
  }
  // PostgREST unique violation often 409; some setups return 400 with code.
  if (!res.ok) {
    const text = await res.text();
    if (/duplicate|unique|23505/i.test(text)) return "duplicate";
    throw new Error(`processed_events HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  // Keep memory in sync for same-process duplicates before DB round-trip.
  claimProcessedEvent(input);
  return "accepted";
}
