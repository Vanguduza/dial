/**
 * Catalogue Factory review queue (D-53 / PD2) — human approve/reject + Meili publish.
 * Fail closed without INTERNAL_API_SECRET. No AI auto-publish (D-54).
 */
import { NextResponse } from "next/server";
import {
  approveCatalogueReview,
  enqueueCatalogueIngest,
  listCatalogueReviewQueue,
  publishApprovedBatchToMeili,
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

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  return NextResponse.json({ queue: listCatalogueReviewQueue() });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;

  const body = (await req.json()) as {
    action?: "enqueue" | "approve" | "reject" | "publish";
    rowCount?: number;
    reviewId?: string;
    batchId?: string;
    offer?: StubOffer & { unitPriceUsdMinor?: string | number | bigint };
  };

  try {
    if (body.action === "enqueue") {
      const batch = enqueueCatalogueIngest(body.rowCount ?? 1);
      return NextResponse.json({
        ok: true,
        batch,
        queue: listCatalogueReviewQueue(),
      });
    }
    if (body.action === "approve") {
      if (!body.reviewId) {
        return NextResponse.json({ error: "reviewId required" }, { status: 400 });
      }
      const item = approveCatalogueReview(body.reviewId);
      return NextResponse.json({ ok: true, item });
    }
    if (body.action === "reject") {
      if (!body.reviewId) {
        return NextResponse.json({ error: "reviewId required" }, { status: 400 });
      }
      const item = rejectCatalogueReview(body.reviewId);
      return NextResponse.json({ ok: true, item });
    }
    if (body.action === "publish") {
      if (!body.batchId || !body.offer) {
        return NextResponse.json(
          { error: "batchId and offer required for publish" },
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
      });
    }
    return NextResponse.json(
      { error: "action must be enqueue | approve | reject | publish" },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "catalogue review failed" },
      { status: 400 },
    );
  }
}
