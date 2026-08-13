/**
 * S116 — drain money outbox from the queue worker host.
 * Fixture-safe; used by run.ts and tests.
 */
import {
  drainMoneyOutbox,
  listMoneyOutbox,
} from "@dial/ledger";

export async function runMoneyOutboxDrain(input?: {
  enqueueSideEffects?: boolean;
}): Promise<{
  drained: Awaited<ReturnType<typeof drainMoneyOutbox>>;
  remaining: number;
}> {
  const drained = await drainMoneyOutbox(
    input?.enqueueSideEffects === true
      ? { enqueueSideEffects: true }
      : undefined,
  );
  return { drained, remaining: listMoneyOutbox().length };
}
