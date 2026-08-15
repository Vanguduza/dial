/**
 * Catalogue Factory review queue (D-53 / PD15) — CSV ingest, human approve/reject,
 * Meili publish (spare + grocery). Fail closed without INTERNAL_API_SECRET.
 * No AI auto-publish (D-54). AI never writes payable amounts.
 */
import { NextResponse } from "next/server";
import {
  approveCatalogueReview,
  claimCatalogueReview,
  enqueueCatalogueIngest,
  getDemandGapSnapshot,
  ingestCatalogueCsv,
  listCatalogueReviewQueue,
  listPendingReviewItems,
  publishApprovedBatchToMeili,
  publishApprovedGroceryToMeili,
  rejectCatalogueReview,
  type StubOffer,
} from "@dial/catalogue";

export const runtime = "nodejs";

function assertInternalSecret(req: Request): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INTERNAL_API_SECRET unset — fail closed" },
      { status: 503 },
    );
  }
  const header = req.headers.get("x-internal-secret") ?? "";
  if (header !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

function serializeQueueItem(r: ReturnType<typeof listCatalogueReviewQueue>[number]) {
  return {
    ...r,
    draft: r.draft
      ? {
          ...r.draft,
          unitPriceUsdMinor: r.draft.unitPriceUsdMinor.toString(),
        }
      : undefined,
  };
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const url = new URL(req.url);
  if (url.searchParams.get("view") === "demand_gap") {
    return NextResponse.json({ demandGap: getDemandGapSnapshot() });
  }
  return NextResponse.json({
    queue: listCatalogueReviewQueue().map(serializeQueueItem),
    pending: listPendingReviewItems().map(serializeQueueItem),
    demandGap: getDemandGapSnapshot(),
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;

  const body = (await req.json()) as {
    action?:
      | "enqueue"
      | "ingest_csv"
      | "claim"
      | "approve"
      | "reject"
      | "publish"
      | "publish_grocery"
      | "demand_gap";
    rowCount?: number;
    csvText?: string;
    reviewId?: string;
    claimedBy?: string;
    batchId?: string;
    offer?: StubOffer & { unitPriceUsdMinor?: string | number | bigint };
  };

  try {
    if (body.action === "demand_gap") {
      return NextResponse.json({ demandGap: getDemandGapSnapshot() });
    }
    if (body.action === "enqueue") {
      const batch = enqueueCatalogueIngest(body.rowCount ?? 1);
      return NextResponse.json({
        ok: true,
        batch,
        queue: listCatalogueReviewQueue().map(serializeQueueItem),
        pending: listPendingReviewItems().map(serializeQueueItem),
        demandGap: getDemandGapSnapshot(),
      });
    }
    if (body.action === "ingest_csv") {
      if (!body.csvText || typeof body.csvText !== "string") {
        return NextResponse.json({ error: "csvText required" }, { status: 400 });
      }
      const ingested = ingestCatalogueCsv(body.csvText);
      return NextResponse.json({
        ok: true,
        batches: ingested.batches,
        reviews: ingested.reviews.map(serializeQueueItem),
        rejectedRows: ingested.rejectedRows,
        queue: listCatalogueReviewQueue().map(serializeQueueItem),
        pending: listPendingReviewItems().map(serializeQueueItem),
        demandGap: getDemandGapSnapshot(),
      });
    }
    if (body.action === "claim") {
      if (!body.reviewId) {
        return NextResponse.json({ error: "reviewId required" }, { status: 400 });
      }
      const item = claimCatalogueReview({
        reviewId: body.reviewId,
        claimedBy: String(body.claimedBy ?? "ops_review"),
      });
      return NextResponse.json({
        ok: true,
        item: serializeQueueItem(item),
        pending: listPendingReviewItems().map(serializeQueueItem),
        demandGap: getDemandGapSnapshot(),
        note: "PD64 — claim pending_review",
      });
    }
    if (body.action === "approve") {
      if (!body.reviewId) {
        return NextResponse.json({ error: "reviewId required" }, { status: 400 });
      }
      const item = approveCatalogueReview(body.reviewId);
      return NextResponse.json({
        ok: true,
        item: serializeQueueItem(item),
        pending: listPendingReviewItems().map(serializeQueueItem),
        demandGap: getDemandGapSnapshot(),
      });
    }
    if (body.action === "reject") {
      if (!body.reviewId) {
        return NextResponse.json({ error: "reviewId required" }, { status: 400 });
      }
      const item = rejectCatalogueReview(body.reviewId);
      return NextResponse.json({
        ok: true,
        item: serializeQueueItem(item),
        pending: listPendingReviewItems().map(serializeQueueItem),
      });
    }
    if (body.action === "publish_grocery") {
      if (!body.batchId) {
        return NextResponse.json({ error: "batchId required" }, { status: 400 });
      }
      const published = await publishApprovedGroceryToMeili({
        batchId: body.batchId,
      });
      return NextResponse.json({
        ok: true,
        offerId: published.offerId,
        taskUid: published.taskUid,
        indexUid: published.indexUid,
        demandGap: getDemandGapSnapshot(),
      });
    }
    if (body.action === "publish") {
      if (!body.batchId || !body.offer) {
        return NextResponse.json(
          { error: "batchId and offer required for spare publish" },
          { status: 400 },
        );
      }
      const raw = body.offer;
      const minor =
        typeof raw.unitPriceUsdMinor === "bigint"
          ? raw.unitPriceUsdMinor
          : BigInt(String(raw.unitPriceUsdMinor ?? "0"));
      const offer: StubOffer = {
        offerId: String(raw.offerId),
        title: String(raw.title),
        unitPriceUsdMinor: minor,
        qualityTier: raw.qualityTier,
        offerSource: "MARKETPLACE",
        supplierFormality: raw.supplierFormality,
        oem: String(raw.oem),
        brand: String(raw.brand),
      };
      if (offer.supplierFormality !== "formal" && offer.supplierFormality !== "informal") {
        return NextResponse.json(
          { error: "supplierFormality must be formal|informal" },
          { status: 400 },
        );
      }
      const published = await publishApprovedBatchToMeili({
        batchId: body.batchId,
        offer,
      });
      return NextResponse.json({
        ok: true,
        doc: published.doc,
        taskUid: published.taskUid,
        indexUid: published.indexUid,
        demandGap: getDemandGapSnapshot(),
      });
    }
    return NextResponse.json(
      {
        error:
          "action must be enqueue | ingest_csv | claim | approve | reject | publish | publish_grocery | demand_gap",
      },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "catalogue review failed" },
      { status: 400 },
    );
  }
}
