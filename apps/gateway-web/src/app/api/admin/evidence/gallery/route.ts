/**
 * PD127 — PicPeak evidence gallery (D-46 backlog). Fail closed without INTERNAL_API_SECRET.
 */
import { NextResponse } from "next/server";
import {
  listEvidenceGallery,
  navigateEvidenceGallery,
  reviewEvidence,
  runPd127PicPeakEvidenceGalleryThinVertical,
} from "@dial/jobs";

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
  const url = new URL(req.url);
  if (url.searchParams.get("view") === "thin") {
    const thin = await runPd127PicPeakEvidenceGalleryThinVertical();
    return NextResponse.json({
      ok: true,
      thin,
      note: "PD127 — PicPeak evidence gallery thin vertical",
    });
  }
  const jobId = url.searchParams.get("jobId") ?? undefined;
  const pendingOnly = url.searchParams.get("pendingOnly") === "1";
  const gallery = listEvidenceGallery({
    ...(jobId ? { jobId } : {}),
    pendingOnly,
  });
  return NextResponse.json({
    ok: true,
    gallery,
    note: "PD127 — PicPeak gallery; not customer photo-share",
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    evidenceId?: string;
    decision?: string;
    reviewedBy?: string;
    jobId?: string;
    direction?: string;
    userId?: string;
    role?: string;
  };
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  try {
    if (body.action === "navigate") {
      const item = navigateEvidenceGallery({
        evidenceId: String(body.evidenceId ?? ""),
        direction: body.direction === "prev" ? "prev" : "next",
        ...(body.jobId ? { jobId: String(body.jobId) } : {}),
      });
      return NextResponse.json({ ok: true, item });
    }
    if (body.action === "review") {
      const decision =
        body.decision === "reject" ? ("reject" as const) : ("approve" as const);
      const evidence = reviewEvidence({
        evidenceId: String(body.evidenceId ?? ""),
        decision,
        reviewedBy: String(body.reviewedBy ?? "ops"),
      });
      return NextResponse.json({
        ok: true,
        evidence,
        note: "PD127 — evidence review; never payable",
      });
    }
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "gallery action failed" },
      { status: 400 },
    );
  }
}
