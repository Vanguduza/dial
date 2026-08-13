/**
 * BullMQ / Redis queue host (D-29) — outbox consumers for search + side-effects.
 * Fixture: in-memory drain (no Redis). Sandbox/live: fail closed without REDIS_URL.
 */
import { Queue, Worker, type Job, type ConnectionOptions } from "bullmq";
import { Redis } from "ioredis";

export type IntegrationMode = "fixture" | "sandbox" | "live";

export function integrationMode(
  env: NodeJS.ProcessEnv = process.env,
): IntegrationMode {
  const m = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (m === "sandbox" || m === "live") return m;
  return "fixture";
}

export const QUEUE_SEARCH_INDEXER = "dial-search-indexer";
export const QUEUE_OUTBOX_SIDE_EFFECTS = "dial-outbox-side-effects";
export const QUEUE_FDMS_DAY = "dial-fdms-day";

export type SearchIndexerJobPayload =
  | { type: "OfferInvalidated"; offerId: string }
  | { type: "MasterProductPublished"; masterProductId: string }
  | { type: "StockHeartbeatReceived"; supplierId: string }
  | { type: "ReindexAll" };

export type OutboxSideEffectPayload = {
  topic: string;
  payload: Record<string, unknown>;
  requireInternalSecret?: boolean;
};

export type FdmsDayJobPayload = {
  action: "open" | "close";
  requestedBy?: string;
};

type FixtureJob<T> = { id: string; name: string; data: T };

const fixtureSearch: FixtureJob<SearchIndexerJobPayload>[] = [];
const fixtureOutbox: FixtureJob<OutboxSideEffectPayload>[] = [];
const fixtureFdmsDay: FixtureJob<FdmsDayJobPayload>[] = [];

function requireRedisUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.REDIS_URL?.trim();
  if (!url) throw new Error("REDIS_URL unset — fail closed for BullMQ");
  return url;
}

function redisConnection(env: NodeJS.ProcessEnv = process.env): Redis {
  return new Redis(requireRedisUrl(env), { maxRetriesPerRequest: null });
}

export async function enqueueSearchIndexerJob(
  data: SearchIndexerJobPayload,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ jobId: string; mode: IntegrationMode }> {
  const mode = integrationMode(env);
  if (mode === "fixture") {
    const id = `fx_si_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    fixtureSearch.push({ id, name: data.type, data });
    return { jobId: id, mode };
  }
  const connection = redisConnection(env);
  try {
    const queue = new Queue(QUEUE_SEARCH_INDEXER, { connection });
    const job = await queue.add(data.type, data, {
      removeOnComplete: 100,
      removeOnFail: 50,
    });
    await queue.close();
    return { jobId: String(job.id), mode };
  } finally {
    connection.disconnect();
  }
}

export async function enqueueOutboxSideEffect(
  data: OutboxSideEffectPayload,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ jobId: string; mode: IntegrationMode }> {
  const mode = integrationMode(env);
  if (mode !== "fixture" && data.requireInternalSecret !== false) {
    if (!env.INTERNAL_API_SECRET?.trim()) {
      throw new Error("INTERNAL_API_SECRET unset — fail closed for outbox side-effects");
    }
  }
  if (mode === "fixture") {
    const id = `fx_ob_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    fixtureOutbox.push({ id, name: data.topic, data });
    return { jobId: id, mode };
  }
  const connection = redisConnection(env);
  try {
    const queue = new Queue(QUEUE_OUTBOX_SIDE_EFFECTS, { connection });
    const job = await queue.add(data.topic, data, {
      removeOnComplete: 100,
      removeOnFail: 50,
    });
    await queue.close();
    return { jobId: String(job.id), mode };
  } finally {
    connection.disconnect();
  }
}

export async function enqueueFdmsDayJob(
  data: FdmsDayJobPayload,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ jobId: string; mode: IntegrationMode }> {
  const mode = integrationMode(env);
  if (mode !== "fixture") {
    if (!env.INTERNAL_API_SECRET?.trim()) {
      throw new Error("INTERNAL_API_SECRET unset — fail closed for FDMS day jobs");
    }
  }
  if (mode === "fixture") {
    const id = `fx_fd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    fixtureFdmsDay.push({ id, name: data.action, data });
    return { jobId: id, mode };
  }
  const connection = redisConnection(env);
  try {
    const queue = new Queue(QUEUE_FDMS_DAY, { connection });
    const job = await queue.add(data.action, data, {
      removeOnComplete: 100,
      removeOnFail: 50,
    });
    await queue.close();
    return { jobId: String(job.id), mode };
  } finally {
    connection.disconnect();
  }
}

/** Drain fixture queues (tests / local without Redis). */
export function drainFixtureSearchJobs(): SearchIndexerJobPayload[] {
  const jobs = fixtureSearch.map((j) => j.data);
  fixtureSearch.length = 0;
  return jobs;
}

export function drainFixtureOutboxJobs(): OutboxSideEffectPayload[] {
  const jobs = fixtureOutbox.map((j) => j.data);
  fixtureOutbox.length = 0;
  return jobs;
}

export function drainFixtureFdmsDayJobs(): FdmsDayJobPayload[] {
  const jobs = fixtureFdmsDay.map((j) => j.data);
  fixtureFdmsDay.length = 0;
  return jobs;
}

export function __resetQueuesForTests(): void {
  fixtureSearch.length = 0;
  fixtureOutbox.length = 0;
  fixtureFdmsDay.length = 0;
}

/**
 * Start a BullMQ worker for search indexer. Returns stop() handle.
 * Fixture mode: no-op stop (use drainFixtureSearchJobs + processIndexerJob).
 */
export async function startSearchIndexerWorker(input: {
  processor: (data: SearchIndexerJobPayload) => Promise<void>;
  env?: NodeJS.ProcessEnv;
}): Promise<{ stop: () => Promise<void>; mode: IntegrationMode }> {
  const env = input.env ?? process.env;
  const mode = integrationMode(env);
  if (mode === "fixture") {
    return {
      mode,
      stop: async () => undefined,
    };
  }
  const connection = redisConnection(env);
  const worker = new Worker(
    QUEUE_SEARCH_INDEXER,
    async (job: Job<SearchIndexerJobPayload>) => {
      await input.processor(job.data);
    },
    { connection },
  );
  return {
    mode,
    stop: async () => {
      await worker.close();
      connection.disconnect();
    },
  };
}

/**
 * Start BullMQ worker for FDMS fiscal-day open/close.
 * Fixture: no-op (use drainFixtureFdmsDayJobs + tax runFdmsOpen/CloseDay).
 */
export async function startFdmsDayWorker(input: {
  processor: (data: FdmsDayJobPayload) => Promise<void>;
  env?: NodeJS.ProcessEnv;
}): Promise<{ stop: () => Promise<void>; mode: IntegrationMode }> {
  const env = input.env ?? process.env;
  const mode = integrationMode(env);
  if (mode === "fixture") {
    return {
      mode,
      stop: async () => undefined,
    };
  }
  const connection = redisConnection(env);
  const worker = new Worker(
    QUEUE_FDMS_DAY,
    async (job: Job<FdmsDayJobPayload>) => {
      await input.processor(job.data);
    },
    { connection },
  );
  return {
    mode,
    stop: async () => {
      await worker.close();
      connection.disconnect();
    },
  };
}
