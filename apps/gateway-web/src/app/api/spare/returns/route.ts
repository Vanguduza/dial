/**
 * PD18 Spare returns API — open / resolve ERP stub (no AI payable).
 */
import { NextResponse } from "next/server";
import {
  getSpareReturnClaim,
  openSpareReturnClaim,
  resolveSpareReturnClaim,
} from "@dial/catalogue";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const claimId = new URL(req.url).searchParams.get("claimId");
  if (!claimId) {
    return NextResponse.json({ error: "claimId required" }, { status: 400 });
  }
  const claim = getSpareReturnClaim(claimId);
  if (!claim) {
    return NextResponse.json({ error: "Unknown claim" }, { status: 404 });
  }
  return NextResponse.json({ claim });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    action?: "open" | "resolve";
    orderId?: string;
    claimId?: string;
    path?: "refund" | "replace" | "refund_or_replace";
  };
  try {
    if (body.action === "open") {
      if (!body.orderId) {
        return NextResponse.json({ error: "orderId required" }, { status: 400 });
      }
      const claim = openSpareReturnClaim({
        orderId: body.orderId,
        path:
          body.path === "refund" || body.path === "replace"
            ? body.path
            : "refund_or_replace",
      });
      return NextResponse.json({ ok: true, claim });
    }
    if (body.action === "resolve") {
      if (!body.claimId || (body.path !== "refund" && body.path !== "replace")) {
        return NextResponse.json(
          { error: "claimId and path refund|replace required" },
          { status: 400 },
        );
      }
      const claim = resolveSpareReturnClaim({
        claimId: body.claimId,
        path: body.path,
      });
      return NextResponse.json({ ok: true, claim });
    }
    return NextResponse.json(
      { error: "action must be open|resolve" },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "returns failed" },
      { status: 400 },
    );
  }
}
