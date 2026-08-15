/**
 * PD72 — promo approve queue (Pack §10). SUPPLIER_COOP awaiting ops.
 */
import { NextResponse } from "next/server";
import {
  acceptSupplierCoop,
  approveSupplierCoop,
  listPendingPromoApprovals,
  proposeSupplierCoop,
  rejectSupplierCoop,
} from "@dial/promotions";

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
    ok: true,
    pending: listPendingPromoApprovals(),
    payableFromAi: false,
    cashOutAllowed: false,
    note: "PD72 — promo approve queue (SUPPLIER_COOP)",
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session/secret SoR only (D-47)" },
      { status: 400 },
    );
  }
  const action = String(body.action ?? "");
  try {
    switch (action) {
      case "seed_pending": {
        const { campaign } = proposeSupplierCoop({
          name: String(body.name ?? "Ops Coop Seed"),
          supplierId: String(body.supplierId ?? "sup_promo_approve"),
          offerIds: [String(body.offerId ?? "off_promo_approve")],
          supplierFundShareBps: 5000,
          dialFundShareBps: 5000,
          budgetSpendLimitMinor: BigInt(String(body.budgetUsdMinor ?? "10000")),
        });
        acceptSupplierCoop(campaign.id);
        return NextResponse.json({
          ok: true,
          campaignId: campaign.id,
          pending: listPendingPromoApprovals(),
          payableFromAi: false,
        });
      }
      case "approve": {
        const out = approveSupplierCoop(String(body.campaignId ?? ""));
        return NextResponse.json({
          ok: true,
          campaign: { id: out.campaign.id, status: out.campaign.status },
          pending: listPendingPromoApprovals(),
          payableFromAi: false,
          cashOutAllowed: false,
        });
      }
      case "reject": {
        const agreement = rejectSupplierCoop(String(body.campaignId ?? ""));
        return NextResponse.json({
          ok: true,
          agreement: {
            campaignId: agreement.campaignId,
            status: agreement.status,
          },
          pending: listPendingPromoApprovals(),
          payableFromAi: false,
        });
      }
      default:
        return NextResponse.json(
          { error: "action must be seed_pending | approve | reject" },
          { status: 400 },
        );
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "promo approve failed" },
      { status: 400 },
    );
  }
}
