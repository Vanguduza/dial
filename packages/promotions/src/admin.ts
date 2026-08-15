/**
 * PD16 admin promotions store — Pack §9.5 / D-42.
 * Create PLATFORM | FLASH | REFERRAL; approve SUPPLIER_COOP; budgets; fraud holds.
 * Promo credit never cash-outs. Fixture in-memory SoR for thin vertical.
 */
import {
  assertReferralRewardNonCash,
  formatReferralCode,
  validateReferralAttach,
} from "./referrals.js";
import { assertCoopShares } from "./supplier-coop.js";
import type {
  CampaignBudget,
  Currency,
  PromoCampaign,
  PromoCampaignType,
  PromotionStatus,
  ReferralProgram,
  ReferralReward,
  SupplierCoopAgreement,
  Vertical,
} from "./types.js";

export type FraudHoldStatus = "clear" | "held" | "released";

export type ReferralEdgeAdmin = {
  edgeId: string;
  campaignId: string;
  referrerCustomerId: string;
  refereeCustomerId: string;
  code: string;
  status: "pending" | "attributed" | "fraud_held" | "rejected";
  fraudHold: FraudHoldStatus;
  fraudReason?: string;
  createdAt: string;
};

export type PromoAdminSnapshot = {
  campaigns: PromoCampaign[];
  referralPrograms: ReferralProgram[];
  coopAgreements: SupplierCoopAgreement[];
  referralEdges: ReferralEdgeAdmin[];
  cashOutAttemptsBlocked: number;
};

type PromoAdminStore = {
  campaigns: Map<string, PromoCampaign>;
  referralPrograms: Map<string, ReferralProgram>;
  coopAgreements: Map<string, SupplierCoopAgreement>;
  referralEdges: Map<string, ReferralEdgeAdmin>;
  cashOutAttemptsBlocked: number;
};

function store(): PromoAdminStore {
  const g = globalThis as typeof globalThis & {
    __dialPromoAdminStore?: PromoAdminStore;
  };
  if (!g.__dialPromoAdminStore) {
    g.__dialPromoAdminStore = {
      campaigns: new Map(),
      referralPrograms: new Map(),
      coopAgreements: new Map(),
      referralEdges: new Map(),
      cashOutAttemptsBlocked: 0,
    };
  }
  return g.__dialPromoAdminStore;
}

export function __resetPromoAdminForTests(): void {
  const s = store();
  s.campaigns.clear();
  s.referralPrograms.clear();
  s.coopAgreements.clear();
  s.referralEdges.clear();
  s.cashOutAttemptsBlocked = 0;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function cloneCampaign(c: PromoCampaign): PromoCampaign {
  return {
    ...c,
    verticals: [...c.verticals],
    budgets: c.budgets.map((b) => ({ ...b })),
    startsAt: new Date(c.startsAt),
    endsAt: c.endsAt ? new Date(c.endsAt) : null,
  };
}

/**
 * Create PLATFORM / FLASH / REFERRAL campaign (ops). SUPPLIER_COOP must use propose path.
 */
export function createPromoCampaign(input: {
  type: Exclude<PromoCampaignType, "SUPPLIER_COOP">;
  name: string;
  verticals?: Vertical[];
  budgetSpendLimitMinor: bigint;
  currency?: Currency;
  stackingMode?: "exclusive" | "stackable";
  priority?: number;
  endsAt?: Date | null;
  /** REFERRAL only */
  referral?: {
    codePrefix: string;
    referrerReward: ReferralReward;
    refereeReward: ReferralReward;
    attributionWindowDays?: number;
    maxReferralsPerReferrerMonth?: number;
  };
}): PromoCampaign {
  if (input.type === "REFERRAL") {
    if (!input.referral) {
      throw new Error("REFERRAL campaign requires referral rewards");
    }
    assertReferralRewardNonCash(input.referral.referrerReward);
    assertReferralRewardNonCash(input.referral.refereeReward);
  }
  if (input.budgetSpendLimitMinor <= 0n) {
    throw new Error("budgetSpendLimitMinor must be positive");
  }

  const budget: CampaignBudget = {
    kind: "spend",
    limit: input.budgetSpendLimitMinor,
    used: 0n,
    currency: input.currency ?? "USD",
  };

  const campaign: PromoCampaign = {
    id: newId("pcamp"),
    type: input.type,
    name: input.name,
    status: "draft",
    verticals: input.verticals ?? ["spare"],
    stackingMode: input.stackingMode ?? "stackable",
    priority: input.priority ?? 100,
    startsAt: new Date(),
    endsAt: input.endsAt ?? null,
    budgets: [budget],
  };
  store().campaigns.set(campaign.id, campaign);

  if (input.type === "REFERRAL" && input.referral) {
    const program: ReferralProgram = {
      campaignId: campaign.id,
      codePrefix: input.referral.codePrefix,
      attributionWindowDays: input.referral.attributionWindowDays ?? 30,
      referrerReward: input.referral.referrerReward,
      refereeReward: input.referral.refereeReward,
      maxReferralsPerReferrerMonth:
        input.referral.maxReferralsPerReferrerMonth ?? 20,
    };
    store().referralPrograms.set(campaign.id, program);
  }

  return cloneCampaign(campaign);
}

export function activatePromoCampaign(campaignId: string): PromoCampaign {
  const c = store().campaigns.get(campaignId);
  if (!c) throw new Error(`Unknown campaign ${campaignId}`);
  if (c.type === "SUPPLIER_COOP") {
    throw new Error("SUPPLIER_COOP activates via ops approve → live");
  }
  c.status = "active";
  return cloneCampaign(c);
}

export function proposeSupplierCoop(input: {
  name: string;
  supplierId: string;
  offerIds: string[];
  supplierFundShareBps: number;
  dialFundShareBps: number;
  budgetSpendLimitMinor: bigint;
  floorNetMinor?: bigint;
  verticals?: Vertical[];
}): { campaign: PromoCampaign; agreement: SupplierCoopAgreement } {
  if (input.supplierFundShareBps + input.dialFundShareBps !== 10000) {
    throw new Error("coop_shares_must_sum_10000");
  }
  if (input.budgetSpendLimitMinor <= 0n) {
    throw new Error("budgetSpendLimitMinor must be positive");
  }
  const campaign: PromoCampaign = {
    id: newId("pcamp"),
    type: "SUPPLIER_COOP",
    name: input.name,
    status: "draft",
    verticals: input.verticals ?? ["spare"],
    stackingMode: "stackable",
    priority: 50,
    startsAt: new Date(),
    endsAt: null,
    budgets: [
      {
        kind: "spend",
        limit: input.budgetSpendLimitMinor,
        used: 0n,
        currency: "USD",
      },
    ],
  };
  const agreement: SupplierCoopAgreement = {
    campaignId: campaign.id,
    supplierId: input.supplierId,
    offerIds: [...input.offerIds],
    supplierFundShareBps: input.supplierFundShareBps,
    dialFundShareBps: input.dialFundShareBps,
    status: "proposed",
  };
  if (input.floorNetMinor !== undefined) {
    agreement.floorNetMinor = input.floorNetMinor;
  }
  store().campaigns.set(campaign.id, campaign);
  store().coopAgreements.set(campaign.id, agreement);
  return { campaign: cloneCampaign(campaign), agreement: { ...agreement, offerIds: [...agreement.offerIds] } };
}

/** Supplier accepts proposed co-op (portal path stub). */
export function acceptSupplierCoop(campaignId: string): SupplierCoopAgreement {
  const a = store().coopAgreements.get(campaignId);
  if (!a) throw new Error(`Unknown coop ${campaignId}`);
  if (a.status !== "proposed") {
    throw new Error(`coop_cannot_accept_from_${a.status}`);
  }
  a.status = "supplier_accepted";
  return { ...a, offerIds: [...a.offerIds] };
}

/** Ops approve SUPPLIER_COOP (Pack §9.5) — human gate before live. */
export function approveSupplierCoop(campaignId: string): {
  campaign: PromoCampaign;
  agreement: SupplierCoopAgreement;
} {
  const a = store().coopAgreements.get(campaignId);
  const c = store().campaigns.get(campaignId);
  if (!a || !c) throw new Error(`Unknown coop ${campaignId}`);
  if (a.status !== "supplier_accepted" && a.status !== "proposed") {
    throw new Error(`coop_cannot_ops_approve_from_${a.status}`);
  }
  a.status = "ops_approved";
  c.status = "active";
  // assertCoopShares requires ops_approved | live
  assertCoopShares(a);
  a.status = "live";
  return {
    campaign: cloneCampaign(c),
    agreement: { ...a, offerIds: [...a.offerIds] },
  };
}

export function rejectSupplierCoop(campaignId: string): SupplierCoopAgreement {
  const a = store().coopAgreements.get(campaignId);
  const c = store().campaigns.get(campaignId);
  if (!a || !c) throw new Error(`Unknown coop ${campaignId}`);
  a.status = "rejected";
  c.status = "archived";
  return { ...a, offerIds: [...a.offerIds] };
}

export type PendingPromoApproval = {
  campaignId: string;
  campaignName: string;
  supplierId: string;
  agreementStatus: SupplierCoopAgreement["status"];
  campaignStatus: PromoCampaign["status"];
  offerIds: string[];
  payableFromAi: false;
};

/** PD72 — Pack §10 admin promo approve queue (SUPPLIER_COOP awaiting ops). */
export function listPendingPromoApprovals(): PendingPromoApproval[] {
  const out: PendingPromoApproval[] = [];
  for (const [campaignId, a] of store().coopAgreements) {
    if (a.status !== "supplier_accepted" && a.status !== "proposed") continue;
    const c = store().campaigns.get(campaignId);
    if (!c || c.type !== "SUPPLIER_COOP") continue;
    if (c.status === "active" || c.status === "archived") continue;
    out.push({
      campaignId,
      campaignName: c.name,
      supplierId: a.supplierId,
      agreementStatus: a.status,
      campaignStatus: c.status,
      offerIds: [...a.offerIds],
      payableFromAi: false,
    });
  }
  return out;
}

/**
 * PD72 thin vertical: propose → supplier accept → pending queue → ops approve clears.
 */
export function runPd72PromoApproveQueueThinVertical(): {
  queuedThenCleared: true;
  approvedCampaignId: string;
  payableFromAi: false;
  cashOutForbidden: true;
} {
  __resetPromoAdminForTests();
  const { campaign } = proposeSupplierCoop({
    name: "PD72 Coop",
    supplierId: "sup_pd72",
    offerIds: ["off_pd72"],
    supplierFundShareBps: 5000,
    dialFundShareBps: 5000,
    budgetSpendLimitMinor: 100_00n,
  });
  acceptSupplierCoop(campaign.id);
  const pending = listPendingPromoApprovals();
  if (!pending.some((p) => p.campaignId === campaign.id)) {
    throw new Error("PD72 expected pending promo approval");
  }
  approveSupplierCoop(campaign.id);
  if (listPendingPromoApprovals().some((p) => p.campaignId === campaign.id)) {
    throw new Error("PD72 queue must clear after approve");
  }
  return {
    queuedThenCleared: true,
    approvedCampaignId: campaign.id,
    payableFromAi: false,
    cashOutForbidden: true,
  };
}

/**
 * Attempt cash-out of promo credit — always blocked (D-42).
 */
export function attemptPromoCreditCashOut(_input: {
  customerId: string;
  amountMinor: bigint;
}): never {
  store().cashOutAttemptsBlocked += 1;
  throw new Error("promo_credit_cash_out_forbidden");
}

export function placeFraudHold(input: {
  edgeId: string;
  reason: string;
}): ReferralEdgeAdmin {
  const edge = store().referralEdges.get(input.edgeId);
  if (!edge) throw new Error(`Unknown edge ${input.edgeId}`);
  edge.fraudHold = "held";
  edge.status = "fraud_held";
  edge.fraudReason = input.reason;
  return { ...edge };
}

export function releaseFraudHold(edgeId: string): ReferralEdgeAdmin {
  const edge = store().referralEdges.get(edgeId);
  if (!edge) throw new Error(`Unknown edge ${edgeId}`);
  edge.fraudHold = "released";
  edge.status = "attributed";
  delete edge.fraudReason;
  return { ...edge };
}

/** Attach referral for admin fraud-demo path (uses validateReferralAttach). */
export function attachReferralForAdmin(input: {
  campaignId: string;
  referrerCustomerId: string;
  refereeCustomerId: string;
  codeSuffix: string;
}): ReferralEdgeAdmin {
  const program = store().referralPrograms.get(input.campaignId);
  if (!program) throw new Error(`No referral program for ${input.campaignId}`);
  const code = formatReferralCode(program.codePrefix, input.codeSuffix);
  const validated = validateReferralAttach({
    program,
    referrerCustomerId: input.referrerCustomerId,
    refereeCustomerId: input.refereeCustomerId,
    code,
  });
  if (!validated.ok) {
    throw new Error(`referral_attach_${validated.reason}`);
  }
  const edge: ReferralEdgeAdmin = {
    edgeId: newId("redge"),
    campaignId: input.campaignId,
    referrerCustomerId: input.referrerCustomerId,
    refereeCustomerId: input.refereeCustomerId,
    code,
    status: "pending",
    fraudHold: "clear",
    createdAt: new Date().toISOString(),
  };
  store().referralEdges.set(edge.edgeId, edge);
  return { ...edge };
}

export function recordBudgetUsage(
  campaignId: string,
  spendMinor: bigint,
): CampaignBudget {
  const c = store().campaigns.get(campaignId);
  if (!c) throw new Error(`Unknown campaign ${campaignId}`);
  const budget = c.budgets[0];
  if (!budget) throw new Error("campaign has no budget");
  if (budget.used + spendMinor > budget.limit) {
    throw new Error("budget_exhausted");
  }
  budget.used += spendMinor;
  return { ...budget };
}

/** PD46 — record live SUPPLIER_COOP spend against campaign budget (ops). */
export function recordCoopSpend(input: {
  campaignId: string;
  spendMinor: bigint;
}): {
  budget: CampaignBudget;
  agreement: SupplierCoopAgreement;
  cashOutForbidden: true;
  payableFromAi: false;
} {
  if (typeof input.spendMinor !== "bigint" || input.spendMinor <= 0n) {
    throw new Error("spendMinor must be positive bigint");
  }
  const a = store().coopAgreements.get(input.campaignId);
  if (!a) throw new Error(`Unknown coop ${input.campaignId}`);
  if (a.status !== "live") {
    throw new Error(`coop_spend_requires_live_got_${a.status}`);
  }
  const budget = recordBudgetUsage(input.campaignId, input.spendMinor);
  return {
    budget: { ...budget },
    agreement: { ...a, offerIds: [...a.offerIds] },
    cashOutForbidden: true,
    payableFromAi: false,
  };
}

export function listCoopAgreementsForSupplier(
  supplierId: string,
): SupplierCoopAgreement[] {
  return [...store().coopAgreements.values()]
    .filter((a) => a.supplierId === supplierId)
    .map((a) => ({ ...a, offerIds: [...a.offerIds] }));
}

/**
 * PD46 thin vertical: propose→accept→ops approve→record coop spend;
 * cash-out blocked; payableFromAi=false.
 */
export function runPd46SupplierCoopSpendThinVertical(): {
  coopCampaignId: string;
  coopStatus: "live";
  spendRecordedMinor: string;
  budgetUsedMinor: string;
  cashOutForbidden: true;
  payableFromAi: false;
} {
  __resetPromoAdminForTests();
  const { campaign } = proposeSupplierCoop({
    name: "PD46 Co-op pads spend",
    supplierId: "sup_pd46",
    offerIds: ["off_pd46_pad"],
    supplierFundShareBps: 6500,
    dialFundShareBps: 3500,
    budgetSpendLimitMinor: 100_00n,
  });
  acceptSupplierCoop(campaign.id);
  approveSupplierCoop(campaign.id);
  const spent = recordCoopSpend({
    campaignId: campaign.id,
    spendMinor: 15_00n,
  });
  let cashOutForbidden = false;
  try {
    attemptPromoCreditCashOut({ customerId: "cust_pd46", amountMinor: 1_00n });
  } catch (e) {
    if (e instanceof Error && e.message === "promo_credit_cash_out_forbidden") {
      cashOutForbidden = true;
    } else {
      throw e;
    }
  }
  if (!cashOutForbidden) throw new Error("PD46 expected cash-out block");
  if (spent.agreement.status !== "live") {
    throw new Error("PD46 expected live coop");
  }
  return {
    coopCampaignId: campaign.id,
    coopStatus: "live",
    spendRecordedMinor: "1500",
    budgetUsedMinor: spent.budget.used.toString(),
    cashOutForbidden: true,
    payableFromAi: false,
  };
}

export function listPromoAdminSnapshot(): PromoAdminSnapshot {
  const s = store();
  return {
    campaigns: [...s.campaigns.values()].map(cloneCampaign),
    referralPrograms: [...s.referralPrograms.values()].map((p) => ({ ...p })),
    coopAgreements: [...s.coopAgreements.values()].map((a) => ({
      ...a,
      offerIds: [...a.offerIds],
    })),
    referralEdges: [...s.referralEdges.values()].map((e) => ({ ...e })),
    cashOutAttemptsBlocked: s.cashOutAttemptsBlocked,
  };
}

export function getPromoCampaign(campaignId: string): PromoCampaign | undefined {
  const c = store().campaigns.get(campaignId);
  return c ? cloneCampaign(c) : undefined;
}

/**
 * PD16 thin vertical: PLATFORM + FLASH + REFERRAL create → activate;
 * SUPPLIER_COOP propose→accept→ops approve; fraud hold; cash-out blocked.
 */
export function runPd16PromotionsAdminThinVertical(): {
  platformId: string;
  flashId: string;
  referralId: string;
  coopCampaignId: string;
  coopStatus: SupplierCoopAgreement["status"];
  edgeFraudHeld: true;
  cashOutForbidden: true;
  budgetUsedMinor: string;
  campaignStatuses: Record<string, PromotionStatus>;
} {
  __resetPromoAdminForTests();

  const platform = createPromoCampaign({
    type: "PLATFORM",
    name: "PD16 Platform 10%",
    budgetSpendLimitMinor: 100_00n,
    verticals: ["spare"],
  });
  activatePromoCampaign(platform.id);

  const flash = createPromoCampaign({
    type: "FLASH",
    name: "PD16 Flash weekend",
    budgetSpendLimitMinor: 50_00n,
    endsAt: new Date(Date.now() + 48 * 3600_000),
    verticals: ["spare", "tech"],
  });
  activatePromoCampaign(flash.id);

  const referral = createPromoCampaign({
    type: "REFERRAL",
    name: "PD16 Refer-a-friend",
    budgetSpendLimitMinor: 200_00n,
    referral: {
      codePrefix: "PD16",
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

  const edge = attachReferralForAdmin({
    campaignId: referral.id,
    referrerCustomerId: "cust_ref_a",
    refereeCustomerId: "cust_ref_b",
    codeSuffix: "alice",
  });
  placeFraudHold({ edgeId: edge.edgeId, reason: "shared_device_graph" });

  const { campaign: coopCamp } = proposeSupplierCoop({
    name: "PD16 Co-op Bosch pads",
    supplierId: "sup_bosch",
    offerIds: ["off_pad_front_zre152"],
    supplierFundShareBps: 7000,
    dialFundShareBps: 3000,
    budgetSpendLimitMinor: 80_00n,
  });
  acceptSupplierCoop(coopCamp.id);
  const approved = approveSupplierCoop(coopCamp.id);

  const budget = recordBudgetUsage(platform.id, 12_00n);

  let cashOutForbidden = false;
  try {
    attemptPromoCreditCashOut({ customerId: "cust_ref_a", amountMinor: 5_00n });
  } catch (e) {
    if (e instanceof Error && e.message === "promo_credit_cash_out_forbidden") {
      cashOutForbidden = true;
    } else {
      throw e;
    }
  }
  if (!cashOutForbidden) {
    throw new Error("PD16 expected cash-out block");
  }

  const held = store().referralEdges.get(edge.edgeId);
  if (!held || held.fraudHold !== "held") {
    throw new Error("PD16 expected fraud hold");
  }
  if (approved.agreement.status !== "live") {
    throw new Error("PD16 expected coop live");
  }

  return {
    platformId: platform.id,
    flashId: flash.id,
    referralId: referral.id,
    coopCampaignId: coopCamp.id,
    coopStatus: approved.agreement.status,
    edgeFraudHeld: true,
    cashOutForbidden: true,
    budgetUsedMinor: budget.used.toString(),
    campaignStatuses: {
      platform: store().campaigns.get(platform.id)!.status,
      flash: store().campaigns.get(flash.id)!.status,
      referral: store().campaigns.get(referral.id)!.status,
      coop: store().campaigns.get(coopCamp.id)!.status,
    },
  };
}
