/**
 * Webhook / outbox idempotency store (D-47).
 * Fixture: in-memory. Maps to SQL processed_events when Supabase client lands.
 * Never trust body userId; claim only after signature verify.
 */
export type IdempotencyClaim = "accepted" | "duplicate";

const claimed = new Set<string>();

function key(source: string, eventId: string): string {
  return `${source}:${eventId}`;
}

/**
 * Claim an event id for a source. First claim wins; duplicates return "duplicate".
 */
export function claimProcessedEvent(input: {
  eventId: string;
  source: string;
}): IdempotencyClaim {
  const eventId = input.eventId?.trim();
  const source = input.source?.trim();
  if (!eventId || !source) {
    throw new TypeError("eventId and source required for idempotency claim");
  }
  const k = key(source, eventId);
  if (claimed.has(k)) return "duplicate";
  claimed.add(k);
  return "accepted";
}

export function hasProcessedEvent(input: {
  eventId: string;
  source: string;
}): boolean {
  return claimed.has(key(input.source, input.eventId));
}

export function __resetIdempotencyForTests(): void {
  claimed.clear();
}
