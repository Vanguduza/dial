/**
 * Admin Compliance / WHT remittance centre (PD23 / Pack §9.5 / D-50).
 * PD105 — Idempotency-Key on record_payout (Pack §10).
 * Fail closed without INTERNAL_API_SECRET. AI never writes payable.
 */
import { NextResponse } from "next/server";
import {
  acknowledgeWhtRemittance,
  complianceWhtSnapshot,
  computeTechPayoutWithholding,
  createWhtRemittanceDraft,
  listWithholdingBalances,
  requireIdempotencyKey,
  serializeWhtRemittance,
  submitWhtRemittance,
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

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const year = Number(
    new URL(req.url).searchParams.get("year") ?? new Date().getFullYear(),
  );
  return NextResponse.json(complianceWhtSnapshot(year));
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json()) as Record<string, unknown>;
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected (D-47)" },
      { status: 400 },
    );
  }
  const action = String(body.action ?? "");
  try {
    if (action === "record_payout") {
      let idempotencyKey: string;
      try {
        idempotencyKey = requireIdempotencyKey(req.headers);
      } catch (e) {
        return NextResponse.json(
          {
            error:
              e instanceof Error ? e.message : "Idempotency-Key required",
          },
          { status: 400 },
        );
      }
      const technicianId = String(body.technicianId ?? "");
      const payoutUsdMinor = BigInt(String(body.payoutUsdMinor ?? ""));
      const year =
        typeof body.yearOfAssessment === "number"
          ? body.yearOfAssessment
          : new Date().getFullYear();
      if (!technicianId) {
        return NextResponse.json(
          { error: "technicianId required" },
          { status: 400 },
        );
      }
      const result = computeTechPayoutWithholding({
        technicianId,
        yearOfAssessment: year,
        payoutUsdMinor,
        hasItf263: Boolean(body.hasItf263),
        idempotencyKey,
      });
      return NextResponse.json({
        ok: true,
        netPayoutMinor: result.netPayoutMinor.toString(),
        withholdMinor: result.withholdMinor.toString(),
        rateBps: result.rateBps,
        snapshot: complianceWhtSnapshot(year),
        note: "PD105 — draft payout with Idempotency-Key; human + pricing engine write payable (D-50)",
      });
    }

    if (action === "create_remittance_draft") {
      const year =
        typeof body.yearOfAssessment === "number"
          ? body.yearOfAssessment
          : new Date().getFullYear();
      const draft = createWhtRemittanceDraft({
        yearOfAssessment: year,
        balances: listWithholdingBalances(),
      });
      return NextResponse.json({
        ok: true,
        batch: serializeWhtRemittance(draft),
        snapshot: complianceWhtSnapshot(year),
      });
    }

    if (action === "submit_remittance") {
      const batchId = String(body.batchId ?? "");
      const submittedBy = String(body.submittedBy ?? "ops");
      const batch = submitWhtRemittance({ batchId, submittedBy });
      return NextResponse.json({
        ok: true,
        batch: serializeWhtRemittance(batch),
        snapshot: complianceWhtSnapshot(batch.yearOfAssessment),
      });
    }

    if (action === "acknowledge_remittance") {
      const batchId = String(body.batchId ?? "");
      const batch = acknowledgeWhtRemittance(batchId);
      return NextResponse.json({
        ok: true,
        batch: serializeWhtRemittance(batch),
        snapshot: complianceWhtSnapshot(batch.yearOfAssessment),
      });
    }

    return NextResponse.json(
      {
        error:
          "action must be record_payout|create_remittance_draft|submit_remittance|acknowledge_remittance",
      },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "compliance failed" },
      { status: 400 },
    );
  }
}
