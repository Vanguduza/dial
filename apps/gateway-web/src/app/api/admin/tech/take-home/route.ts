/**
 * Tech Take-Home / WHT economics (D-50 / D-53 / PD10 + PD52 polish).
 * Fail closed without INTERNAL_API_SECRET. AI never writes payable amounts.
 */
import { NextResponse } from "next/server";
import {
  computeTakeHomeBreakdown,
  computeTechPayoutWithholding,
  getItf263Record,
  getWithholdingBalance,
  listItf263Records,
  listWithholdingBalances,
  setItf263Status,
  uploadItf263Document,
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
      itf263: listItf263Records().filter((r) => r.yearOfAssessment === year),
      note: "PD52 — durable withholding_balances + ITF263 (D-50)",
      payableFromAi: false,
    });
  }

  if (!technicianId) {
    return NextResponse.json({ error: "technicianId required" }, { status: 400 });
  }

  const bal = getWithholdingBalance(technicianId, year);
  const itf = getItf263Record(technicianId, year);
  return NextResponse.json({
    technicianId,
    yearOfAssessment: year,
    balance: bal ? serializeBalance(bal) : null,
    itf263: itf ?? null,
    payableFromAi: false,
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json()) as {
    action?: string;
    technicianId?: string;
    yearOfAssessment?: number;
    payoutUsdMinor?: string;
    grossUsdMinor?: string;
    dialFeeUsdMinor?: string;
    hasItf263?: boolean;
    documentRef?: string;
    status?: "verified" | "rejected" | "expired";
    setBy?: string;
  };
  if (!body.technicianId) {
    return NextResponse.json({ error: "technicianId required" }, { status: 400 });
  }
  const year = body.yearOfAssessment ?? new Date().getFullYear();
  const action = body.action ?? "apply_wht";

  try {
    if (action === "upload_itf263") {
      const uploaded = uploadItf263Document({
        technicianId: body.technicianId,
        yearOfAssessment: year,
        documentRef:
          body.documentRef ??
          `fixture://itf263/${body.technicianId}/${year}.pdf`,
      });
      return NextResponse.json({
        ok: true,
        itf263: uploaded,
        payableFromAi: false,
        note: "PD52 — ITF263 uploaded pending verify",
      });
    }
    if (action === "verify_itf263" || action === "set_itf263_status") {
      const status = body.status ?? "verified";
      const updated = setItf263Status({
        technicianId: body.technicianId,
        yearOfAssessment: year,
        status,
        setBy: body.setBy ?? "ops_take_home",
      });
      return NextResponse.json({
        ok: true,
        itf263: updated,
        payableFromAi: false,
      });
    }
    if (action === "breakdown") {
      const gross = BigInt(body.grossUsdMinor ?? body.payoutUsdMinor ?? "0");
      const fee = BigInt(body.dialFeeUsdMinor ?? "0");
      const breakdown = computeTakeHomeBreakdown({
        technicianId: body.technicianId,
        yearOfAssessment: year,
        grossUsdMinor: gross,
        dialFeeUsdMinor: fee,
      });
      return NextResponse.json({
        ok: true,
        breakdown,
        payableFromAi: false,
        note: "PD52 — Take-Home breakdown draft only",
      });
    }

    // default: apply_wht (PD10 path)
    if (body.payoutUsdMinor === undefined) {
      return NextResponse.json(
        { error: "payoutUsdMinor required for apply_wht" },
        { status: 400 },
      );
    }
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
      itf263: getItf263Record(body.technicianId, year) ?? null,
      note: "Draft economics only — human + pricing engine write payable amounts",
      payableFromAi: false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "take-home failed" },
      { status: 400 },
    );
  }
}
