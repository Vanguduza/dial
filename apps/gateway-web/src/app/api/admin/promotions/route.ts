/**
 * Admin Promotions & referrals (PD16 / Pack §9.5 / D-42).
 * Fail closed without INTERNAL_API_SECRET. Promo credit never cash-outs.
 */
import { NextResponse } from "next/server";
import {
  acceptSupplierCoop,
  activatePromoCampaign,
  approveSupplierCoop,
  attachReferralForAdmin,
  attemptPromoCreditCashOut,
  createPromoCampaign,
  listPromoAdminSnapshot,
  placeFraudHold,
  proposeSupplierCoop,
  recordCoopSpend,
  rejectSupplierCoop,
  releaseFraudHold,
  type PromoCampaignType,
  type ReferralReward,
  type Vertical,
} from "@dial/promotions";
import { addStatementLine } from "@dial/suppliers";

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

function serializeSnapshot() {
  const snap = listPromoAdminSnapshot();
  return {
    ...snap,
    campaigns: snap.campaigns.map((c) => ({
      ...c,
      startsAt: c.startsAt.toISOString(),
      endsAt: c.endsAt ? c.endsAt.toISOString() : null,
      budgets: c.budgets.map((b) => ({
        ...b,
        limit: b.limit.toString(),
        used: b.used.toString(),
      })),
    })),
    referralPrograms: snap.referralPrograms.map((p) => ({
      ...p,
      referrerReward: serializeReward(p.referrerReward),
      refereeReward: serializeReward(p.refereeReward),
    })),
    coopAgreements: snap.coopAgreements.map((a) => {
      const base = {
        campaignId: a.campaignId,
        supplierId: a.supplierId,
        offerIds: a.offerIds,
        supplierFundShareBps: a.supplierFundShareBps,
        dialFundShareBps: a.dialFundShareBps,
        status: a.status,
      };
      if (a.floorNetMinor !== undefined) {
        return { ...base, floorNetMinor: a.floorNetMinor.toString() };
      }
      return base;
    }),
  };
}

function serializeReward(r: ReferralReward) {
  if (r.kind === "promo_credit") {
    return {
      kind: r.kind,
      amountMinor: r.amountMinor.toString(),
      currency: r.currency,
    };
  }
  const out: {
    kind: "percent_service_fee";
    percent: number;
    maxMinor?: string;
  } = {
    kind: r.kind,
    percent: r.percent,
  };
  if (r.maxMinor !== undefined) out.maxMinor = r.maxMinor.toString();
  return out;
}

function parseReward(raw: {
  kind?: string;
  amountMinor?: string | number;
  currency?: string;
  percent?: number;
  maxMinor?: string | number;
}): ReferralReward {
  if (raw.kind === "percent_service_fee") {
    const reward: ReferralReward = {
      kind: "percent_service_fee",
      percent: Number(raw.percent ?? 0),
    };
    if (raw.maxMinor !== undefined) {
      reward.maxMinor = BigInt(String(raw.maxMinor));
    }
    return reward;
  }
  return {
    kind: "promo_credit",
    amountMinor: BigInt(String(raw.amountMinor ?? "0")),
    currency: (raw.currency as "USD" | "ZWG") ?? "USD",
  };
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  return NextResponse.json({ snapshot: serializeSnapshot() });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;

  const body = (await req.json()) as {
    action?: string;
    type?: PromoCampaignType;
    name?: string;
    budgetSpendLimitMinor?: string | number;
    verticals?: Vertical[];
    campaignId?: string;
    supplierId?: string;
    offerIds?: string[];
    supplierFundShareBps?: number;
    dialFundShareBps?: number;
    codePrefix?: string;
    referrerReward?: Parameters<typeof parseReward>[0];
    refereeReward?: Parameters<typeof parseReward>[0];
    referrerCustomerId?: string;
    refereeCustomerId?: string;
    codeSuffix?: string;
    edgeId?: string;
    reason?: string;
    customerId?: string;
    amountMinor?: string | number;
    spendMinor?: string | number;
  };

  try {
    if (body.action === "create_campaign") {
      if (
        body.type !== "PLATFORM" &&
        body.type !== "FLASH" &&
        body.type !== "REFERRAL"
      ) {
        return NextResponse.json(
          { error: "type must be PLATFORM|FLASH|REFERRAL (coop via propose_coop)" },
          { status: 400 },
        );
      }
      if (!body.name || body.budgetSpendLimitMinor === undefined) {
        return NextResponse.json(
          { error: "name and budgetSpendLimitMinor required" },
          { status: 400 },
        );
      }
      const createInput: Parameters<typeof createPromoCampaign>[0] = {
        type: body.type,
        name: body.name,
        budgetSpendLimitMinor: BigInt(String(body.budgetSpendLimitMinor)),
      };
      if (body.verticals) createInput.verticals = body.verticals;
      if (body.type === "REFERRAL") {
        createInput.referral = {
          codePrefix: body.codePrefix ?? "DIAL",
          referrerReward: parseReward(body.referrerReward ?? {}),
          refereeReward: parseReward(body.refereeReward ?? {}),
        };
      }
      const campaign = createPromoCampaign(createInput);
      return NextResponse.json({
        ok: true,
        campaignId: campaign.id,
        snapshot: serializeSnapshot(),
      });
    }
    if (body.action === "activate") {
      if (!body.campaignId) {
        return NextResponse.json({ error: "campaignId required" }, { status: 400 });
      }
      activatePromoCampaign(body.campaignId);
      return NextResponse.json({ ok: true, snapshot: serializeSnapshot() });
    }
    if (body.action === "propose_coop") {
      if (
        !body.name ||
        !body.supplierId ||
        !body.offerIds?.length ||
        body.budgetSpendLimitMinor === undefined ||
        body.supplierFundShareBps === undefined ||
        body.dialFundShareBps === undefined
      ) {
        return NextResponse.json(
          { error: "propose_coop fields incomplete" },
          { status: 400 },
        );
      }
      const { campaign, agreement } = proposeSupplierCoop({
        name: body.name,
        supplierId: body.supplierId,
        offerIds: body.offerIds,
        supplierFundShareBps: body.supplierFundShareBps,
        dialFundShareBps: body.dialFundShareBps,
        budgetSpendLimitMinor: BigInt(String(body.budgetSpendLimitMinor)),
      });
      return NextResponse.json({
        ok: true,
        campaignId: campaign.id,
        agreementStatus: agreement.status,
        snapshot: serializeSnapshot(),
      });
    }
    if (body.action === "accept_coop") {
      if (!body.campaignId) {
        return NextResponse.json({ error: "campaignId required" }, { status: 400 });
      }
      acceptSupplierCoop(body.campaignId);
      return NextResponse.json({ ok: true, snapshot: serializeSnapshot() });
    }
    if (body.action === "approve_coop") {
      if (!body.campaignId) {
        return NextResponse.json({ error: "campaignId required" }, { status: 400 });
      }
      const out = approveSupplierCoop(body.campaignId);
      return NextResponse.json({
        ok: true,
        agreementStatus: out.agreement.status,
        snapshot: serializeSnapshot(),
      });
    }
    if (body.action === "record_coop_spend") {
      if (!body.campaignId || body.spendMinor === undefined) {
        return NextResponse.json(
          { error: "campaignId and spendMinor required" },
          { status: 400 },
        );
      }
      const spendMinor = BigInt(String(body.spendMinor));
      const spent = recordCoopSpend({
        campaignId: body.campaignId,
        spendMinor,
      });
      const line = addStatementLine({
        supplierId: spent.agreement.supplierId,
        kind: "coop_spend",
        amountUsdMinor: spendMinor,
        label: `SUPPLIER_COOP spend ${body.campaignId}`,
      });
      return NextResponse.json({
        ok: true,
        agreementStatus: spent.agreement.status,
        budgetUsedMinor: spent.budget.used.toString(),
        statementLineId: line.lineId,
        cashOutForbidden: true,
        payableFromAi: false,
        snapshot: serializeSnapshot(),
      });
    }
    if (body.action === "reject_coop") {
      if (!body.campaignId) {
        return NextResponse.json({ error: "campaignId required" }, { status: 400 });
      }
      rejectSupplierCoop(body.campaignId);
      return NextResponse.json({ ok: true, snapshot: serializeSnapshot() });
    }
    if (body.action === "attach_referral") {
      if (
        !body.campaignId ||
        !body.referrerCustomerId ||
        !body.refereeCustomerId ||
        !body.codeSuffix
      ) {
        return NextResponse.json(
          { error: "attach_referral fields incomplete" },
          { status: 400 },
        );
      }
      const edge = attachReferralForAdmin({
        campaignId: body.campaignId,
        referrerCustomerId: body.referrerCustomerId,
        refereeCustomerId: body.refereeCustomerId,
        codeSuffix: body.codeSuffix,
      });
      return NextResponse.json({
        ok: true,
        edgeId: edge.edgeId,
        snapshot: serializeSnapshot(),
      });
    }
    if (body.action === "fraud_hold") {
      if (!body.edgeId || !body.reason) {
        return NextResponse.json(
          { error: "edgeId and reason required" },
          { status: 400 },
        );
      }
      placeFraudHold({ edgeId: body.edgeId, reason: body.reason });
      return NextResponse.json({ ok: true, snapshot: serializeSnapshot() });
    }
    if (body.action === "fraud_release") {
      if (!body.edgeId) {
        return NextResponse.json({ error: "edgeId required" }, { status: 400 });
      }
      releaseFraudHold(body.edgeId);
      return NextResponse.json({ ok: true, snapshot: serializeSnapshot() });
    }
    if (body.action === "attempt_cash_out") {
      try {
        attemptPromoCreditCashOut({
          customerId: body.customerId ?? "unknown",
          amountMinor: BigInt(String(body.amountMinor ?? "0")),
        });
      } catch (e) {
        return NextResponse.json({
          ok: false,
          blocked: true,
          error: e instanceof Error ? e.message : "cash_out_blocked",
          snapshot: serializeSnapshot(),
        });
      }
    }
    return NextResponse.json(
      {
        error:
          "action must be create_campaign|activate|propose_coop|accept_coop|approve_coop|record_coop_spend|reject_coop|attach_referral|fraud_hold|fraud_release|attempt_cash_out",
      },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "promotions admin failed" },
      { status: 400 },
    );
  }
}
