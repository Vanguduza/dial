/**
 * Admin Daily ZiG rate (D-57) — fail closed without INTERNAL_API_SECRET.
 * Persists audited rate via @dial/payments; EcoCash checkout reads fx_rate_id from active row.
 */
import { NextResponse } from "next/server";
import {
  getActiveFxRate,
  listFxRateAudit,
  setDailyZigRate,
} from "@dial/payments";

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

function serializeRate(row: {
  fxRateId: string;
  zigMinorPerUsd: bigint;
  effectiveAt: string;
  setBy: string;
}) {
  return {
    fxRateId: row.fxRateId,
    zigMinorPerUsd: row.zigMinorPerUsd.toString(),
    effectiveAt: row.effectiveAt,
    setBy: row.setBy,
  };
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const active = getActiveFxRate();
  return NextResponse.json({
    active: active ? serializeRate(active) : null,
    audit: listFxRateAudit().map(serializeRate),
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;

  const body = (await req.json()) as {
    zigMinorPerUsd?: string;
    setBy?: string;
    effectiveAt?: string;
  };

  if (!body.zigMinorPerUsd || !body.setBy) {
    return NextResponse.json(
      { error: "zigMinorPerUsd (string integer) and setBy required" },
      { status: 400 },
    );
  }

  let zigMinorPerUsd: bigint;
  try {
    zigMinorPerUsd = BigInt(body.zigMinorPerUsd);
  } catch {
    return NextResponse.json(
      { error: "zigMinorPerUsd must be integer string (minor units)" },
      { status: 400 },
    );
  }

  try {
    const row = setDailyZigRate({
      zigMinorPerUsd,
      setBy: body.setBy,
      ...(body.effectiveAt ? { effectiveAt: body.effectiveAt } : {}),
    });
    return NextResponse.json({ ok: true, rate: serializeRate(row) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "rate set failed" },
      { status: 400 },
    );
  }
}
