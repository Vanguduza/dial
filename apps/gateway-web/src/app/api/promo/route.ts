/**
 * Customer promo / referral API (PD21 / Pack §9.6 / D-42).
 * Session SoR; never body userId/role. Promo credit never cash-outs.
 */
import { NextResponse } from "next/server";
import {
  applyPromoCodeDraft,
  attachReferralAsCustomer,
  attemptCustomerPromoCashOut,
  getPromoCreditBalance,
  listPromoAdminSnapshot,
  shareReferral,
  validatePromoCode,
} from "@dial/promotions";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../lib/auth/session";

export const runtime = "nodejs";

function sessionOr401(req: Request) {
  return getSessionFromToken(parseSessionCookie(req.headers.get("cookie")));
}

function customerIdFromSession(email: string): string {
  return `cust_${email.split("@")[0]!.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
}

export async function GET(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  if (url.searchParams.has("userId") || url.searchParams.has("role")) {
    return NextResponse.json(
      { error: "role/userId from query rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  const customerId = customerIdFromSession(session.email);
  const view = url.searchParams.get("view") ?? "home";

  if (view === "balance") {
    return NextResponse.json({
      balance: getPromoCreditBalance(customerId),
      cashOutAllowed: false,
    });
  }

  if (view === "referral_programs") {
    const snap = listPromoAdminSnapshot();
    const programs = snap.referralPrograms
      .filter((p) => {
        const c = snap.campaigns.find((x) => x.id === p.campaignId);
        return c?.status === "active";
      })
      .map((p) => ({
        campaignId: p.campaignId,
        codePrefix: p.codePrefix,
        rewardKind: "promo_credit" as const,
        cashOutAllowed: false,
      }));
    return NextResponse.json({ programs, cashOutAllowed: false });
  }

  return NextResponse.json({
    customerId,
    cashOutAllowed: false,
    payableFromAi: false,
    note: "PD21 — validate promo codes; share referral; never cash-out (D-42)",
  });
}

export async function POST(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as Record<string, unknown>;
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }

  const customerId = customerIdFromSession(session.email);
  const action = String(body.action ?? "");

  try {
    if (action === "validate_code") {
      const code = String(body.code ?? "");
      const vertical =
        body.vertical === "spare" ||
        body.vertical === "tech" ||
        body.vertical === "care" ||
        body.vertical === "fleet"
          ? body.vertical
          : undefined;
      const result = validatePromoCode({
        code,
        ...(vertical ? { vertical } : {}),
      });
      return NextResponse.json({ ...result, cashOutAllowed: false });
    }

    if (action === "apply_draft") {
      const code = String(body.code ?? "");
      const cartId = String(body.cartId ?? "");
      if (!cartId) {
        return NextResponse.json({ error: "cartId required" }, { status: 400 });
      }
      const vertical =
        body.vertical === "spare" ||
        body.vertical === "tech" ||
        body.vertical === "care" ||
        body.vertical === "fleet"
          ? body.vertical
          : undefined;
      const applied = applyPromoCodeDraft({
        customerId,
        cartId,
        code,
        ...(vertical ? { vertical } : {}),
      });
      return NextResponse.json({
        ok: true,
        applied,
        note: "Draft adjustment only — pricing engine applies payable (D-42)",
      });
    }

    if (action === "share_referral") {
      const campaignId = String(body.campaignId ?? "");
      if (!campaignId) {
        return NextResponse.json({ error: "campaignId required" }, { status: 400 });
      }
      const share = shareReferral({
        customerId,
        campaignId,
        ...(body.codeSuffix != null
          ? { codeSuffix: String(body.codeSuffix) }
          : {}),
      });
      return NextResponse.json({ ok: true, share });
    }

    if (action === "attach_referral") {
      const campaignId = String(body.campaignId ?? "");
      const referrerCustomerId = String(body.referrerCustomerId ?? "");
      const code = String(body.code ?? "");
      if (!campaignId || !referrerCustomerId || !code) {
        return NextResponse.json(
          { error: "campaignId, referrerCustomerId, code required" },
          { status: 400 },
        );
      }
      const edge = attachReferralAsCustomer({
        campaignId,
        referrerCustomerId,
        refereeCustomerId: customerId,
        code,
      });
      return NextResponse.json({
        ok: true,
        edge,
        balance: getPromoCreditBalance(customerId),
      });
    }

    if (action === "attempt_cash_out") {
      try {
        attemptCustomerPromoCashOut({
          customerId,
          amountMinor: BigInt(String(body.amountMinor ?? "0")),
        });
      } catch (e) {
        if (
          e instanceof Error &&
          e.message === "promo_credit_cash_out_forbidden"
        ) {
          return NextResponse.json(
            {
              ok: false,
              error: "promo_credit_cash_out_forbidden",
              cashOutAllowed: false,
            },
            { status: 403 },
          );
        }
        throw e;
      }
    }

    return NextResponse.json(
      {
        error:
          "action must be validate_code|apply_draft|share_referral|attach_referral|attempt_cash_out",
      },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "promo failed" },
      { status: 400 },
    );
  }
}
