/**
 * PD34 — grocery take-rate ladder admin API.
 * Fail closed without INTERNAL_API_SECRET. Ops set bps — AI never writes payable amounts.
 */
import { NextResponse } from "next/server";
import {
  createGroceryTakeRateDraft,
  getPublishedGroceryTakeRate,
  listTakeRateLadders,
  publishTakeRateLadder,
  resolveTakeRateBps,
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

function serializeLadder(
  ladder: NonNullable<ReturnType<typeof getPublishedGroceryTakeRate>>,
) {
  return {
    ...ladder,
    tiers: ladder.tiers.map((t) => ({
      minGmvUsdMinor: t.minGmvUsdMinor.toString(),
      takeRateBps: t.takeRateBps,
    })),
  };
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const published = getPublishedGroceryTakeRate();
  return NextResponse.json({
    ladders: listTakeRateLadders().map(serializeLadder),
    published: published ? serializeLadder(published) : null,
    note: "Ops take-rate scaffold — draft economics; not a payable write",
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json()) as {
    action?: string;
    label?: string;
    setBy?: string;
    ladderId?: string;
    tiers?: Array<{ minGmvUsdMinor?: string; takeRateBps?: number }>;
    gmvUsdMinor?: string;
    userId?: string;
    role?: string;
  };
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected (D-47)" },
      { status: 400 },
    );
  }
  const setBy = (body.setBy ?? "ops").slice(0, 64);
  try {
    if (body.action === "draft") {
      if (!body.tiers?.length) {
        return NextResponse.json({ error: "tiers required" }, { status: 400 });
      }
      const draft = createGroceryTakeRateDraft({
        ...(body.label !== undefined ? { label: body.label } : {}),
        setBy,
        tiers: body.tiers.map((t) => ({
          minGmvUsdMinor: BigInt(t.minGmvUsdMinor ?? "0"),
          takeRateBps: Number(t.takeRateBps),
        })),
      });
      return NextResponse.json({
        ok: true,
        ladder: serializeLadder(draft),
        note: "Draft only — publish required; payableFromAi=false",
      });
    }
    if (body.action === "publish") {
      if (!body.ladderId) {
        return NextResponse.json({ error: "ladderId required" }, { status: 400 });
      }
      const published = publishTakeRateLadder(body.ladderId, setBy);
      return NextResponse.json({
        ok: true,
        ladder: serializeLadder(published),
        note: "Published take-rate ladder — ops set; AI never writes payable",
      });
    }
    if (body.action === "resolve") {
      const published = getPublishedGroceryTakeRate();
      if (!published) {
        return NextResponse.json(
          { error: "no published grocery take-rate" },
          { status: 404 },
        );
      }
      const gmv = BigInt(body.gmvUsdMinor ?? "0");
      return NextResponse.json({
        ok: true,
        takeRateBps: resolveTakeRateBps(published, gmv),
        gmvUsdMinor: gmv.toString(),
        ladderId: published.ladderId,
        note: "Echo bps only — not a payable amount write",
      });
    }
    return NextResponse.json(
      { error: "action must be draft|publish|resolve" },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "take-rate failed" },
      { status: 400 },
    );
  }
}
