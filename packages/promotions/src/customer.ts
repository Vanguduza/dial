/**
 * PD21 customer promo / referral — Pack §9.6 / D-42.
 * Validate promo codes + referral share; promo credit never cash-outs.
 * Draft adjustments only — @dial/pricing applies payable amounts (AI never writes money).
 */
import {
  activatePromoCampaign,
  attemptPromoCreditCashOut,
  attachReferralForAdmin,
  createPromoCampaign,
  getPromoCampaign,
  listPromoAdminSnapshot,
  __resetPromoAdminForTests,
} from "./admin.js";
import { formatReferralCode } from "./referrals.js";
import type { Vertical } from "./types.js";

export type PromoCodeValidation = {
  ok: true;
  code: string;
  campaignId: string;
  campaignName: string;
  campaignType: string;
  /** Draft percent for pricing engine — not a payable amount. */
  draftDiscountPercent: number;
  currency: "USD";
  payableFromAi: false;
  cashOutAllowed: false;
};

export type PromoCodeReject = {
  ok: false;
  reason: string;
  cashOutAllowed: false;
};

export type ReferralSharePayload = {
  customerId: string;
  campaignId: string;
  shareCode: string;
  shareUrl: string;
  rewardKind: "promo_credit";
  cashOutAllowed: false;
};

export type PromoCreditBalance = {
  customerId: string;
  balanceMinor: string;
  currency: "USD";
  cashOutAllowed: false;
};

type PromoCodeRecord = {
  code: string;
  campaignId: string;
  draftDiscountPercent: number;
  verticals: Vertical[];
};

type CustomerPromoStore = {
  codes: Map<string, PromoCodeRecord>;
  /** Fixture promo_credit balances (never cash-out). */
  balances: Map<string, bigint>;
  appliedDrafts: Map<string, { code: string; cartId: string; draftDiscountPercent: number }>;
};

function store(): CustomerPromoStore {
  const g = globalThis as typeof globalThis & {
    __dialPromoCustomerStore?: CustomerPromoStore;
  };
  if (!g.__dialPromoCustomerStore) {
    g.__dialPromoCustomerStore = {
      codes: new Map(),
      balances: new Map(),
      appliedDrafts: new Map(),
    };
  }
  return g.__dialPromoCustomerStore;
}

export function __resetPromoCustomerForTests(): void {
  const s = store();
  s.codes.clear();
  s.balances.clear();
  s.appliedDrafts.clear();
  __resetPromoAdminForTests();
}

/** Ops/fixture: bind a customer-facing code to an active campaign. */
export function registerPromoCode(input: {
  code: string;
  campaignId: string;
  draftDiscountPercent: number;
  verticals?: Vertical[];
}): PromoCodeRecord {
  const campaign = getPromoCampaign(input.campaignId);
  if (!campaign) throw new Error(`Unknown campaign ${input.campaignId}`);
  if (campaign.status !== "active") {
    throw new Error("promo_code_requires_active_campaign");
  }
  if (input.draftDiscountPercent <= 0 || input.draftDiscountPercent > 100) {
    throw new Error("draftDiscountPercent must be 1–100");
  }
  const code = input.code.trim().toUpperCase();
  if (!code) throw new Error("code required");
  const rec: PromoCodeRecord = {
    code,
    campaignId: input.campaignId,
    draftDiscountPercent: input.draftDiscountPercent,
    verticals: input.verticals ?? campaign.verticals,
  };
  store().codes.set(code, rec);
  return { ...rec, verticals: [...rec.verticals] };
}

export function validatePromoCode(input: {
  code: string;
  vertical?: Vertical;
}): PromoCodeValidation | PromoCodeReject {
  const code = input.code.trim().toUpperCase();
  const rec = store().codes.get(code);
  if (!rec) {
    return { ok: false, reason: "unknown_code", cashOutAllowed: false };
  }
  const campaign = getPromoCampaign(rec.campaignId);
  if (!campaign || campaign.status !== "active") {
    return { ok: false, reason: "campaign_inactive", cashOutAllowed: false };
  }
  if (input.vertical && !rec.verticals.includes(input.vertical)) {
    return { ok: false, reason: "vertical_mismatch", cashOutAllowed: false };
  }
  return {
    ok: true,
    code: rec.code,
    campaignId: campaign.id,
    campaignName: campaign.name,
    campaignType: campaign.type,
    draftDiscountPercent: rec.draftDiscountPercent,
    currency: "USD",
    payableFromAi: false,
    cashOutAllowed: false,
  };
}

/**
 * Apply code as a cart draft adjustment marker — pricing engine owns payable.
 */
export function applyPromoCodeDraft(input: {
  customerId: string;
  cartId: string;
  code: string;
  vertical?: Vertical;
}): PromoCodeValidation {
  const validated = validatePromoCode({
    code: input.code,
    ...(input.vertical ? { vertical: input.vertical } : {}),
  });
  if (!validated.ok) {
    throw new Error(`promo_apply_${validated.reason}`);
  }
  store().appliedDrafts.set(input.cartId, {
    code: validated.code,
    cartId: input.cartId,
    draftDiscountPercent: validated.draftDiscountPercent,
  });
  return validated;
}

export function getAppliedPromoDraft(cartId: string): {
  code: string;
  draftDiscountPercent: number;
} | null {
  const d = store().appliedDrafts.get(cartId);
  return d ? { code: d.code, draftDiscountPercent: d.draftDiscountPercent } : null;
}

/** Credit fixture balance (referral grant stub) — never cash. */
export function grantPromoCredit(input: {
  customerId: string;
  amountMinor: bigint;
}): PromoCreditBalance {
  if (input.amountMinor <= 0n) throw new Error("amountMinor must be positive");
  const s = store();
  const prev = s.balances.get(input.customerId) ?? 0n;
  s.balances.set(input.customerId, prev + input.amountMinor);
  return getPromoCreditBalance(input.customerId);
}

export function getPromoCreditBalance(customerId: string): PromoCreditBalance {
  const bal = store().balances.get(customerId) ?? 0n;
  return {
    customerId,
    balanceMinor: bal.toString(),
    currency: "USD",
    cashOutAllowed: false,
  };
}

export function shareReferral(input: {
  customerId: string;
  campaignId: string;
  codeSuffix?: string;
}): ReferralSharePayload {
  const snap = listPromoAdminSnapshot();
  const program = snap.referralPrograms.find((p) => p.campaignId === input.campaignId);
  if (!program) throw new Error(`No referral program for ${input.campaignId}`);
  const campaign = getPromoCampaign(input.campaignId);
  if (!campaign || campaign.status !== "active") {
    throw new Error("referral_campaign_inactive");
  }
  const suffix =
    input.codeSuffix ??
    (input.customerId.replace(/[^a-zA-Z0-9]/g, "").slice(-8) || "user");
  const shareCode = formatReferralCode(program.codePrefix, suffix);
  return {
    customerId: input.customerId,
    campaignId: input.campaignId,
    shareCode,
    shareUrl: `https://dial.zw/r/${encodeURIComponent(shareCode)}`,
    rewardKind: "promo_credit",
    cashOutAllowed: false,
  };
}

export function attachReferralAsCustomer(input: {
  campaignId: string;
  referrerCustomerId: string;
  refereeCustomerId: string;
  code: string;
}): {
  edgeId: string;
  code: string;
  cashOutAllowed: false;
  rewardKind: "promo_credit";
} {
  const snap = listPromoAdminSnapshot();
  const program = snap.referralPrograms.find((p) => p.campaignId === input.campaignId);
  if (!program) throw new Error(`No referral program for ${input.campaignId}`);
  const expectedPrefix = program.codePrefix.endsWith("-")
    ? program.codePrefix
    : `${program.codePrefix}-`;
  const code = input.code.trim().toUpperCase();
  if (!code.startsWith(expectedPrefix.toUpperCase())) {
    throw new Error("referral_attach_invalid_prefix");
  }
  const suffix = code.slice(expectedPrefix.length);
  const edge = attachReferralForAdmin({
    campaignId: input.campaignId,
    referrerCustomerId: input.referrerCustomerId,
    refereeCustomerId: input.refereeCustomerId,
    codeSuffix: suffix,
  });
  // Fixture: grant referee promo_credit (non-cash).
  if (program.refereeReward.kind === "promo_credit") {
    grantPromoCredit({
      customerId: input.refereeCustomerId,
      amountMinor: program.refereeReward.amountMinor,
    });
  }
  return {
    edgeId: edge.edgeId,
    code: edge.code,
    cashOutAllowed: false,
    rewardKind: "promo_credit",
  };
}

/**
 * PD85 — Pack §10 referral status for a customer (referrer + referee edges).
 * Promo credit only — never cash-out (D-42).
 */
export function getReferralStatus(customerId: string): {
  customerId: string;
  asReferrer: Array<{
    edgeId: string;
    campaignId: string;
    refereeCustomerId: string;
    status: string;
    fraudHold: string;
  }>;
  asReferee: Array<{
    edgeId: string;
    campaignId: string;
    referrerCustomerId: string;
    status: string;
    fraudHold: string;
  }>;
  cashOutAllowed: false;
  rewardKind: "promo_credit";
  payableFromAi: false;
} {
  if (!customerId.trim()) throw new Error("customerId required");
  const snap = listPromoAdminSnapshot();
  const asReferrer = snap.referralEdges
    .filter((e) => e.referrerCustomerId === customerId)
    .map((e) => ({
      edgeId: e.edgeId,
      campaignId: e.campaignId,
      refereeCustomerId: e.refereeCustomerId,
      status: e.status,
      fraudHold: e.fraudHold,
    }));
  const asReferee = snap.referralEdges
    .filter((e) => e.refereeCustomerId === customerId)
    .map((e) => ({
      edgeId: e.edgeId,
      campaignId: e.campaignId,
      referrerCustomerId: e.referrerCustomerId,
      status: e.status,
      fraudHold: e.fraudHold,
    }));
  return {
    customerId,
    asReferrer,
    asReferee,
    cashOutAllowed: false,
    rewardKind: "promo_credit",
    payableFromAi: false,
  };
}

/** Always forbidden (D-42). */
export function attemptCustomerPromoCashOut(input: {
  customerId: string;
  amountMinor: bigint;
}): never {
  return attemptPromoCreditCashOut(input);
}

/**
 * PD21 thin vertical: active PLATFORM code → apply draft → referral share →
 * attach referee → cash-out blocked. Tech deep-link asserted at gateway (rate_card).
 */
export function runPd21CustomerMobilePromoThinVertical(input?: {
  referrerCustomerId?: string;
  refereeCustomerId?: string;
}): {
  campaignId: string;
  referralCampaignId: string;
  code: string;
  draftDiscountPercent: number;
  shareCode: string;
  edgeId: string;
  refereeBalanceMinor: string;
  cashOutForbidden: true;
  payableFromAi: false;
  channels: ["android", "ios"];
  noExpo: true;
} {
  __resetPromoCustomerForTests();

  const platform = createPromoCampaign({
    type: "PLATFORM",
    name: "PD21 Spare 10%",
    budgetSpendLimitMinor: 100_00n,
    verticals: ["spare"],
  });
  activatePromoCampaign(platform.id);
  registerPromoCode({
    code: "SPARE10",
    campaignId: platform.id,
    draftDiscountPercent: 10,
    verticals: ["spare"],
  });

  const validated = validatePromoCode({ code: "SPARE10", vertical: "spare" });
  if (!validated.ok) throw new Error(`PD21 validate failed: ${validated.reason}`);
  applyPromoCodeDraft({
    customerId: "cust_pd21_a",
    cartId: "cart_pd21",
    code: "SPARE10",
    vertical: "spare",
  });

  const referral = createPromoCampaign({
    type: "REFERRAL",
    name: "PD21 Refer-a-friend",
    budgetSpendLimitMinor: 200_00n,
    referral: {
      codePrefix: "PD21",
      referrerReward: {
        kind: "promo_credit",
        amountMinor: 5_00n,
        currency: "USD",
      },
      refereeReward: {
        kind: "promo_credit",
        amountMinor: 3_00n,
        currency: "USD",
      },
    },
  });
  activatePromoCampaign(referral.id);

  const referrer = input?.referrerCustomerId ?? "cust_pd21_ref";
  const referee = input?.refereeCustomerId ?? "cust_pd21_new";
  const share = shareReferral({
    customerId: referrer,
    campaignId: referral.id,
    codeSuffix: "alice",
  });
  const attached = attachReferralAsCustomer({
    campaignId: referral.id,
    referrerCustomerId: referrer,
    refereeCustomerId: referee,
    code: share.shareCode,
  });

  let cashOutForbidden = false;
  try {
    attemptCustomerPromoCashOut({ customerId: referee, amountMinor: 3_00n });
  } catch (e) {
    if (e instanceof Error && e.message === "promo_credit_cash_out_forbidden") {
      cashOutForbidden = true;
    } else {
      throw e;
    }
  }
  if (!cashOutForbidden) throw new Error("PD21 expected cash-out block");

  const bal = getPromoCreditBalance(referee);
  return {
    campaignId: platform.id,
    referralCampaignId: referral.id,
    code: validated.code,
    draftDiscountPercent: validated.draftDiscountPercent,
    shareCode: share.shareCode,
    edgeId: attached.edgeId,
    refereeBalanceMinor: bal.balanceMinor,
    cashOutForbidden: true,
    payableFromAi: false,
    channels: ["android", "ios"],
    noExpo: true,
  };
}

/**
 * PD96 thin vertical: validate → apply draft on cart → checkout reads draft (no AI payable).
 */
export function runPd96PromoCartCheckoutThinVertical(): {
  validated: true;
  draftOnCart: true;
  draftDiscountPercent: number;
  payableFromAi: false;
  cashOutAllowed: false;
} {
  __resetPromoCustomerForTests();
  const platform = createPromoCampaign({
    type: "PLATFORM",
    name: "PD96 Spare 15%",
    budgetSpendLimitMinor: 50_00n,
    verticals: ["spare"],
  });
  activatePromoCampaign(platform.id);
  registerPromoCode({
    code: "PD96SAVE",
    campaignId: platform.id,
    draftDiscountPercent: 15,
    verticals: ["spare"],
  });
  const cartId = "cart_pd96";
  const validated = validatePromoCode({ code: "PD96SAVE", vertical: "spare" });
  if (!validated.ok) throw new Error("PD96 validate failed");
  applyPromoCodeDraft({
    customerId: "cust_pd96",
    cartId,
    code: "PD96SAVE",
    vertical: "spare",
  });
  const draft = getAppliedPromoDraft(cartId);
  if (!draft || draft.code !== "PD96SAVE" || draft.draftDiscountPercent !== 15) {
    throw new Error("PD96 expected draft on cart for checkout wire");
  }
  return {
    validated: true,
    draftOnCart: true,
    draftDiscountPercent: draft.draftDiscountPercent,
    payableFromAi: false,
    cashOutAllowed: false,
  };
}

/**
 * PD70 thin vertical: grant promo_credit → balance read → cash-out blocked (D-42).
 * Web surface: /account/promo (Pack §9.6 credit balance + referral share).
 */
export function runPd70CustomerPromoBalanceThinVertical(): {
  balanceMinor: string;
  cashOutForbidden: true;
  currency: "USD";
  payableFromAi: false;
} {
  __resetPromoCustomerForTests();
  const customerId = "cust_pd70";
  grantPromoCredit({ customerId, amountMinor: 15_00n });
  const bal = getPromoCreditBalance(customerId);
  if (bal.balanceMinor !== "1500" || bal.cashOutAllowed !== false) {
    throw new Error("PD70 expected non-cash promo credit balance");
  }
  let blocked = false;
  try {
    attemptCustomerPromoCashOut({ customerId, amountMinor: 5_00n });
  } catch (e) {
    if (e instanceof Error && e.message === "promo_credit_cash_out_forbidden") {
      blocked = true;
    } else {
      throw e;
    }
  }
  if (!blocked) throw new Error("PD70 must forbid cash-out");
  return {
    balanceMinor: bal.balanceMinor,
    cashOutForbidden: true,
    currency: "USD",
    payableFromAi: false,
  };
}

/**
 * PD85 thin vertical: share → attach → getReferralStatus as referrer + referee.
 */
export function runPd85ReferralStatusThinVertical(): {
  asReferrerCount: number;
  asRefereeCount: number;
  cashOutAllowed: false;
  payableFromAi: false;
} {
  __resetPromoCustomerForTests();
  const referral = createPromoCampaign({
    type: "REFERRAL",
    name: "PD85 Referral",
    budgetSpendLimitMinor: 100_00n,
    verticals: ["spare"],
    referral: {
      codePrefix: "PD85",
      attributionWindowDays: 30,
      referrerReward: {
        kind: "promo_credit",
        amountMinor: 5_00n,
        currency: "USD",
      },
      refereeReward: {
        kind: "promo_credit",
        amountMinor: 5_00n,
        currency: "USD",
      },
      maxReferralsPerReferrerMonth: 10,
    },
  });
  activatePromoCampaign(referral.id);
  const share = shareReferral({
    customerId: "cust_pd85_ref",
    campaignId: referral.id,
  });
  attachReferralAsCustomer({
    campaignId: referral.id,
    referrerCustomerId: "cust_pd85_ref",
    refereeCustomerId: "cust_pd85_ee",
    code: share.shareCode,
  });
  const referrerStatus = getReferralStatus("cust_pd85_ref");
  const refereeStatus = getReferralStatus("cust_pd85_ee");
  if (referrerStatus.asReferrer.length < 1) {
    throw new Error("PD85 expected referrer edge");
  }
  if (refereeStatus.asReferee.length < 1) {
    throw new Error("PD85 expected referee edge");
  }
  if (referrerStatus.cashOutAllowed !== false) {
    throw new Error("PD85 cash-out must stay forbidden");
  }
  return {
    asReferrerCount: referrerStatus.asReferrer.length,
    asRefereeCount: refereeStatus.asReferee.length,
    cashOutAllowed: false,
    payableFromAi: false,
  };
}

/**
 * PD138 thin vertical: referral share payload for customer UI (code + URL; never cash-out).
 */
export function runPd138ReferralShareThinVertical(): {
  hasShareCode: true;
  hasShareUrl: true;
  cashOutAllowed: false;
  payableFromAi: false;
} {
  __resetPromoCustomerForTests();
  const referral = createPromoCampaign({
    type: "REFERRAL",
    name: "PD138 Referral Share",
    budgetSpendLimitMinor: 50_00n,
    verticals: ["spare"],
    referral: {
      codePrefix: "PD138",
      attributionWindowDays: 30,
      referrerReward: {
        kind: "promo_credit",
        amountMinor: 3_00n,
        currency: "USD",
      },
      refereeReward: {
        kind: "promo_credit",
        amountMinor: 3_00n,
        currency: "USD",
      },
      maxReferralsPerReferrerMonth: 10,
    },
  });
  activatePromoCampaign(referral.id);
  const share = shareReferral({
    customerId: "cust_pd138",
    campaignId: referral.id,
  });
  if (!share.shareCode?.startsWith("PD138")) {
    throw new Error("PD138 expected shareCode with prefix");
  }
  if (!share.shareUrl?.includes(encodeURIComponent(share.shareCode))) {
    throw new Error("PD138 expected shareUrl containing code");
  }
  if (share.cashOutAllowed !== false || share.rewardKind !== "promo_credit") {
    throw new Error("PD138 cash-out must stay forbidden");
  }
  return {
    hasShareCode: true,
    hasShareUrl: true,
    cashOutAllowed: false,
    payableFromAi: false,
  };
}
