/**
 * Phase 4 prep — durable Catalogue Factory batches/reviews + take-rate ladders.
 * Fixture: no-op. Sandbox/live: Supabase REST — fail closed without URL/key.
 * Tables: supabase/migrations/0004_phase4_supplier_factory.sql.
 * Does not claim G4 green. No liquor / DIAL_OWNED / AI payable.
 */
import { integrationMode, type IntegrationMode } from "@dial/shared/processed-events";
import type { TakeRateLadder } from "./takeRate.js";

export type { IntegrationMode };

/** Minimal shapes — avoid circular import with index.ts */
type CatalogueIngestBatch = {
  batchId: string;
  status: string;
  rowCount: number;
  createdAt: string;
  publishedOfferId?: string;
  vertical?: "spare" | "grocery";
};

type CatalogueReviewItem = {
  reviewId: string;
  batchId: string;
  offerId: string;
  status: string;
  vertical?: "spare" | "grocery";
  claimedBy?: string;
  claimedAt?: string;
  draft?: {
    vertical: "spare" | "grocery";
    offerId: string;
    title: string;
    unitPriceUsdMinor: bigint;
    offerSource: string;
    supplierFormality: string;
    brand: string;
    /** Spare fitment fields carried through to the Meili document. */
    oem?: string;
    qualityTier?: "OEM" | "OES" | "Aftermarket";
    ageGateRequired?: boolean;
    payableFromAi?: boolean;
  };
};

function supabaseRestConfig(env: NodeJS.ProcessEnv = process.env): {
  url: string;
  key: string;
} {
  const url = (
    env.SUPABASE_URL?.trim() ||
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY?.trim() || env.SUPABASE_ANON_KEY?.trim() || "";
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / key unset — fail closed for durable catalogue factory",
    );
  }
  return { url, key };
}

async function restUpsert(
  table: string,
  row: Record<string, unknown>,
  onConflict: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const { url, key } = supabaseRestConfig(env);
  const res = await fetch(
    `${url}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${table} upsert HTTP ${res.status}: ${text.slice(0, 240)}`);
  }
}

export async function persistCatalogueBatchDurable(
  batch: CatalogueIngestBatch,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  await restUpsert(
    "catalogue_ingest_batches",
    {
      batch_id: batch.batchId,
      status: batch.status,
      row_count: batch.rowCount,
      vertical: batch.vertical ?? "spare",
      published_offer_id: batch.publishedOfferId ?? null,
      created_at: batch.createdAt,
    },
    "batch_id",
    env,
  );
  return "accepted";
}

export async function persistCatalogueReviewDurable(
  review: CatalogueReviewItem,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  if (review.draft?.payableFromAi !== undefined && review.draft.payableFromAi !== false) {
    throw new Error("AI payable drafts forbidden on durable review");
  }
  if (review.draft?.ageGateRequired === true) {
    throw new Error("Liquor/age-gate SKUs blocked on durable review");
  }
  if (review.draft?.offerSource && review.draft.offerSource !== "MARKETPLACE") {
    throw new Error("DIAL_OWNED forbidden on durable review (D-58)");
  }
  await restUpsert(
    "catalogue_review_queue",
    {
      review_id: review.reviewId,
      batch_id: review.batchId,
      offer_id: review.offerId,
      status: review.status,
      vertical: review.vertical ?? "spare",
      claimed_by: review.claimedBy ?? null,
      claimed_at: review.claimedAt ?? null,
      draft: review.draft
        ? {
            ...review.draft,
            unitPriceUsdMinor: review.draft.unitPriceUsdMinor.toString(),
            payableFromAi: false,
            offerSource: "MARKETPLACE",
          }
        : null,
    },
    "review_id",
    env,
  );
  return "accepted";
}

/** Ops-set integer bps ladder — never AI-written payable amounts. */
export async function persistTakeRateLadderDurable(
  ladder: TakeRateLadder,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  if (ladder.payableFromAi !== false) {
    throw new Error("payableFromAi must stay false on take-rate");
  }
  if (ladder.liquorAllowed !== false) {
    throw new Error("liquor take-rate not allowed");
  }
  for (const t of ladder.tiers) {
    if (!Number.isInteger(t.takeRateBps) || t.takeRateBps < 0 || t.takeRateBps > 10_000) {
      throw new Error("takeRateBps must be integer 0..10000");
    }
  }
  await restUpsert(
    "take_rate_ladders",
    {
      ladder_id: ladder.ladderId,
      vertical: "grocery",
      label: ladder.label,
      tiers: ladder.tiers.map((t) => ({
        minGmvUsdMinor: t.minGmvUsdMinor.toString(),
        takeRateBps: t.takeRateBps,
      })),
      status: ladder.status,
      published_at: ladder.publishedAt,
      set_by: ladder.setBy,
      payable_from_ai: false,
      liquor_allowed: false,
    },
    "ladder_id",
    env,
  );
  return "accepted";
}

export async function persistFactoryIngestDurable(
  input: {
    batches: CatalogueIngestBatch[];
    reviews: CatalogueReviewItem[];
  },
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ mode: IntegrationMode; batches: number; reviews: number }> {
  const mode = integrationMode(env);
  if (mode === "fixture") {
    return { mode, batches: 0, reviews: 0 };
  }
  for (const b of input.batches) {
    await persistCatalogueBatchDurable(b, env);
  }
  for (const r of input.reviews) {
    await persistCatalogueReviewDurable(r, env);
  }
  return { mode, batches: input.batches.length, reviews: input.reviews.length };
}

type RestReviewRow = {
  review_id: string;
  batch_id: string;
  offer_id: string;
  status: string;
  vertical?: "spare" | "grocery";
  draft?: Record<string, unknown> | null;
};

function mapRestReview(row: RestReviewRow): CatalogueReviewItem {
  const draftRaw = row.draft;
  let draft: CatalogueReviewItem["draft"];
  if (draftRaw && typeof draftRaw === "object") {
    draft = {
      vertical: (draftRaw.vertical as "spare" | "grocery") ?? "spare",
      offerId: String(draftRaw.offerId ?? row.offer_id),
      title: String(draftRaw.title ?? ""),
      unitPriceUsdMinor: BigInt(String(draftRaw.unitPriceUsdMinor ?? "0")),
      offerSource: String(draftRaw.offerSource ?? "MARKETPLACE"),
      supplierFormality: String(draftRaw.supplierFormality ?? "formal"),
      brand: String(draftRaw.brand ?? ""),
      payableFromAi: draftRaw.payableFromAi === true,
      ageGateRequired: draftRaw.ageGateRequired === true,
      ...(typeof draftRaw.oem === "string" ? { oem: draftRaw.oem } : {}),
      ...(draftRaw.qualityTier === "OEM" ||
      draftRaw.qualityTier === "OES" ||
      draftRaw.qualityTier === "Aftermarket"
        ? { qualityTier: draftRaw.qualityTier }
        : {}),
    };
  }
  return {
    reviewId: row.review_id,
    batchId: row.batch_id,
    offerId: row.offer_id,
    status: row.status,
    vertical: row.vertical ?? "spare",
    ...(draft ? { draft } : {}),
  };
}

/** Phase 4 — read durable Factory review queue from PostgREST (sandbox/live). */
export async function listCatalogueReviewsDurable(
  env: NodeJS.ProcessEnv = process.env,
): Promise<CatalogueReviewItem[]> {
  if (integrationMode(env) === "fixture") return [];
  const { url, key } = supabaseRestConfig(env);
  const res = await fetch(
    `${url}/rest/v1/catalogue_review_queue?select=review_id,batch_id,offer_id,status,vertical,draft&order=review_id.asc`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`catalogue_review_queue list HTTP ${res.status}: ${text.slice(0, 240)}`);
  }
  const rows = (await res.json()) as RestReviewRow[];
  return rows.map(mapRestReview);
}
