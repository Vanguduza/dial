/**
 * Tech Take-Home / WHT economics (D-50 / D-53 / PD10 durable balances).
 * Fail closed without INTERNAL_API_SECRET. AI never writes payable amounts.
 */
import { NextResponse } from "next/server";
import {
  computeTechPayoutWithholding,
  getWithholdingBalance,
  listWithholdingBalances,
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
  if ((req.headers.get("x-internal-secret") ?? "") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

function serializeBalance(
  bal: NonNullable<ReturnType<typeof getWithholdingBalance>>,
) {
  return {
    ...bal,
    grossPaidMinor: bal.grossPaidMinor.toString(),
    withheldMinor: bal.withheldMinor.toString(),
  };
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const url = new URL(req.url);
  const technicianId = url.searchParams.get("technicianId") ?? "";
  const year = Number(url.searchParams.get("year") ?? new Date().getFullYear());
  const view = url.searchParams.get("view") ?? "one";

  if (view === "all") {
    return NextResponse.json({
      yearOfAssessment: year,
      balances: listWithholdingBalances()
        .filter((b) => b.yearOfAssessment === year)
        .map(serializeBalance),
      note: "Durable withholding_balances SoR (@dial/payments) — D-50",
    });
  }

  if (!technicianId) {
    return NextResponse.json({ error: "technicianId required" }, { status: 400 });
  }

  const bal = getWithholdingBalance(technicianId, year);
  return NextResponse.json({
    technicianId,
    yearOfAssessment: year,
    balance: bal ? serializeBalance(bal) : null,
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json()) as {
    technicianId?: string;
    yearOfAssessment?: number;
    payoutUsdMinor?: string;
    hasItf263?: boolean;
  };
  if (!body.technicianId || body.payoutUsdMinor === undefined) {
    return NextResponse.json(
      { error: "technicianId and payoutUsdMinor required" },
      { status: 400 },
    );
  }
  try {
    const year = body.yearOfAssessment ?? new Date().getFullYear();
    const result = computeTechPayoutWithholding({
      technicianId: body.technicianId,
      yearOfAssessment: year,
      payoutUsdMinor: BigInt(body.payoutUsdMinor),
      hasItf263: Boolean(body.hasItf263),
    });
    const bal = getWithholdingBalance(body.technicianId, year);
    return NextResponse.json({
      ok: true,
      netPayoutMinor: result.netPayoutMinor.toString(),
      withholdMinor: result.withholdMinor.toString(),
      rateBps: result.rateBps,
      balance: bal ? serializeBalance(bal) : null,
      note: "Draft economics only — human + pricing engine write payable amounts",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "take-home failed" },
      { status: 400 },
    );
  }
}
