/**
 * PD48 Admin spare returns / refunds queue — human resolve only (no AI money).
 * Fail closed without INTERNAL_API_SECRET.
 */
import { NextResponse } from "next/server";
import {
  listSpareReturnClaims,
  resolveSpareReturnClaim,
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
  if ((req.headers.get("x-internal-secret") ?? "") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const status = new URL(req.url).searchParams.get("status");
  const claims = listSpareReturnClaims(
    status === "opened" || status === "resolved"
      ? { status }
      : undefined,
  );
  return NextResponse.json({
    claims: claims.map((c) => ({
      ...c,
      // bigint-safe: none on claim; keep payableFromAi explicit
      payableFromAi: false as const,
    })),
    payableFromAi: false,
    note: "PD48 — admin returns queue; refund|replace human-only",
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json()) as {
    claimId?: string;
    path?: "refund" | "replace";
  };
  if (!body.claimId || (body.path !== "refund" && body.path !== "replace")) {
    return NextResponse.json(
      { error: "claimId and path refund|replace required" },
      { status: 400 },
    );
  }
  try {
    const claim = resolveSpareReturnClaim({
      claimId: body.claimId,
      path: body.path,
    });
    return NextResponse.json({
      ok: true,
      claim: { ...claim, payableFromAi: false as const },
      payableFromAi: false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "resolve failed" },
      { status: 400 },
    );
  }
}
