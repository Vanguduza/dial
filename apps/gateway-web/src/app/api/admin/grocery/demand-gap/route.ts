/**
 * PD54 Grocery Meili demand-gap admin — food only; no liquor; no AI money.
 * Fail closed without INTERNAL_API_SECRET.
 */
import { NextResponse } from "next/server";
import {
  getGroceryDemandGapSnapshot,
  listSearchNoResultEvents,
  recordSearchNoResult,
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
  return NextResponse.json({
    demandGap: getGroceryDemandGapSnapshot(),
    recent: listSearchNoResultEvents({ vertical: "grocery" }).slice(0, 20),
    liquorAllowed: false,
    payableFromAi: false,
    note: "PD54 — grocery Meili demand-gap; food/pantry only",
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json()) as {
    action?: string;
    query?: string;
    sessionRole?: "b2c" | "b2b";
  };
  if (body.action === "record_no_result") {
    if (!body.query?.trim()) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }
    const event = recordSearchNoResult(
      body.query.trim().toLowerCase(),
      body.sessionRole ?? "b2c",
      "grocery",
    );
    return NextResponse.json({
      ok: true,
      event,
      demandGap: getGroceryDemandGapSnapshot(),
      liquorAllowed: false,
      payableFromAi: false,
    });
  }
  return NextResponse.json(
    { error: "action must be record_no_result" },
    { status: 400 },
  );
}
