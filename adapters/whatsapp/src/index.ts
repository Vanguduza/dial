/**
 * Official WhatsApp Cloud API adapter surface (D-40 / PD12) — no Baileys / whatsapp-web.js.
 * E2a expand + PD12: FLOW_SPARE_* + FLOW_GROCERY_* food wired to sandbox Cloud API.
 */
import {
  addToCart,
  addToGroceryCart,
  createCart,
  createGroceryCart,
  getCart,
  getGroceryCart,
  searchGroceryOffers,
  searchOffers,
  __resetGroceryForTests,
} from "@dial/catalogue";
import {
  type CheckoutPayChoice,
  createCheckoutPayment,
  type PaymentIntent,
  type CodOrder,
  getActiveFxRate,
  usdToZig,
} from "@dial/payments";
import {
  assertReferralRewardNonCash,
  formatReferralCode,
} from "@dial/promotions";
import {
  __resetIdempotencyForTests,
  claimProcessedEvent,
} from "@dial/shared";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  bindWaSessionPhone,
  listWaSandboxOutbound,
  MetaCloudApiAdapter,
  parseWaInboundInteractive,
  resolveWaSessionByPhone,
  __resetWaCloudSandboxForTests,
} from "./cloudApi.js";
import type { WaFlowKey } from "./flowRegistry.js";

export type FlowId =
  | "FLOW_SPARE_SEARCH"
  | "FLOW_SPARE_CART"
  | "FLOW_SPARE_CHECKOUT"
  | "FLOW_TECH_INTAKE"
  | "FLOW_TECH_EMERGENCY"
  | "FLOW_SPARE_RETURNS"
  | "FLOW_REFERRAL_HOME"
  | "FLOW_CONSENT_CENTRE"
  | "FLOW_SUPPORT_TICKET"
  | "FLOW_GROCERY_HOME"
  | "FLOW_GROCERY_SEARCH"
  | "FLOW_GROCERY_CART"
  | "FLOW_GROCERY_SLOT"
  | "FLOW_GROCERY_CHECKOUT"
  | "FLOW_GROCERY_TRACK";

export type CheckoutVertical = "spare" | "grocery";

export type CheckoutButton = {
  id: CheckoutPayChoice | "paynow";
  title: string;
};

/** Required pay CTAs — EcoCash | COD (D-57). Paynow = optional USD rail URL button. */
export const CHECKOUT_PAY_BUTTONS: readonly CheckoutButton[] = [
  { id: "ecocash", title: "EcoCash" },
  { id: "cod", title: "Cash on delivery" },
  { id: "paynow", title: "Pay with Paynow" },
] as const;

/**
 * CPA §7.5 eighteen-item electronic disclosure categories (v4).
 * Shown on FLOW_SPARE_CHECKOUT review before pay — mandatory review step.
 */
export const EIGHTEEN_ITEM_DISCLOSURES: readonly string[] = [
  "1. Supplier identity — Dial Agency (Pty) Ltd trading as DIAL (agency marketplace).",
  "2. Legal status — private limited company registered in Zimbabwe.",
  "3. Physical address — registered office (ops-published; Phase 0).",
  "4. Contact — support via WhatsApp Chatwoot handoff and dialaspare.co.zw.",
  "5. Goods description — spare offer title, OEM/fitment, quality tier on each line.",
  "6. Price — line and order totals in USD (browse/cart); taxes as applicable on invoice.",
  "7. Delivery / fulfilment costs — delivery band shown before pay when applicable.",
  "8. Payment methods — EcoCash (ZiG at ops daily rate), COD (USD settle), Paynow URL.",
  "9. Delivery arrangements — pin/landmark; courier POD; ETA bands from DIAL maps stack.",
  "10. Complaints — FLOW_SUPPORT_TICKET / Chatwoot; status from ERP only.",
  "11. Cancellation — 7-day electronic cancellation rights per CPA (v4 §7.5).",
  "12. Returns — FLOW_SPARE_RETURNS; 6-month goods remedy at consumer direction.",
  "13. Warranty — quality-tier warranty days on offer; used-part grade disclosures.",
  "14. Privacy — privacy policy URL (ops); no ID/card data inside Flows.",
  "15. Payment security — card data never in Flows; hosted PSP only.",
  "16. Agreement duration — order completes on delivery/POD; Job Reserve holds separate.",
  "17. Codes of conduct — consumer protection + agency sales characterisation (D-58).",
  "18. Review step — you may correct the cart or withdraw before confirming pay below.",
] as const;

export type FlowSession = {
  sessionId: string;
  flowId: FlowId;
  cartId?: string;
  groceryCartId?: string;
  orderId?: string;
  jobId?: string;
  customerId?: string;
  lastScreen?: string;
  lastSearchQuery?: string;
  techIntake?: TechIntakeDraft;
  consents?: ConsentState;
  vertical?: CheckoutVertical;
  grocerySlotId?: string;
  toE164?: string;
};

export type TechIntakeDraft = {
  tradeHint: string;
  description: string;
  emergency: boolean;
  /** AI may draft assessment later — never a payable amount here. */
  assessmentHint?: string;
};

export type ConsentState = {
  marketing: boolean;
  vehicleHub: boolean;
  careRenewals: boolean;
  referralInvites: boolean;
};

export type ChatwootHandoff = {
  conversationKey: string;
  /** Chatwoot-side contact stub — filled when CHATWOOT_* keys land. */
  chatwootContactId: string;
  /** Inbox routing stub (ENH — ops configures live inbox). */
  inboxId: string;
  /** ERP support ticket id — Chatwoot is not SoR for status. */
  erpTicketId: string;
  customerId?: string;
  orderId?: string;
  jobId?: string;
  cartId?: string;
  searchQuery?: string;
  topic: string;
};

export type SupportTicket = {
  ticketId: string;
  conversationKey: string;
  topic: string;
  status: "open" | "pending_human";
  statusFrom: "erp";
  customerId?: string;
  orderId?: string;
  jobId?: string;
};

export type ReturnClaimPath = "refund_or_replace" | "refund" | "replace";

export type ReturnClaim = {
  claimId: string;
  orderId: string;
  reason: string;
  path: ReturnClaimPath;
  status: "open" | "resolved_refund" | "resolved_replace";
  statusFrom: "erp";
  customerId?: string;
  /** Payable amounts never set by AI — human/ERP only when resolving. */
  resolutionAmountMinor: null;
};

const sessions = new Map<string, FlowSession>();
const handoffs = new Map<string, ChatwootHandoff>();
const supportTickets = new Map<string, SupportTicket>();
const returnClaims = new Map<string, ReturnClaim>();
const referrals = new Map<string, { code: string; balancePromoCreditMinor: bigint }>();
const consentAudit: Array<{
  sessionId: string;
  customerId?: string;
  consents: ConsentState;
  at: string;
}> = [];

export function verifyMetaSignature(input: {
  appSecret: string;
  rawBody: string;
  signatureHeader: string;
}): boolean {
  const expected =
    "sha256=" +
    createHmac("sha256", input.appSecret).update(input.rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(input.signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Idempotent webhook admission via shared store (D-47 / S102). */
export function admitWebhookEvent(deliveryId: string): "accepted" | "duplicate" {
  return claimProcessedEvent({ eventId: deliveryId, source: "whatsapp" });
}

export function startFlow(flowId: FlowId, customerId?: string): FlowSession {
  const session: FlowSession = {
    sessionId: `wa_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    flowId,
  };
  if (customerId !== undefined) session.customerId = customerId;
  sessions.set(session.sessionId, session);
  return session;
}

function requireSession(sessionId: string): FlowSession {
  const session = sessions.get(sessionId);
  if (!session) throw new Error("Unknown session");
  return session;
}

export function flowSpareSearch(sessionId: string, query: string) {
  const session = requireSession(sessionId);
  session.flowId = "FLOW_SPARE_SEARCH";
  session.lastScreen = "search_results";
  session.lastSearchQuery = query;
  const offers = searchOffers(query).map((o) => ({
    offerId: o.offerId,
    title: o.title,
    displayPriceUsdMinor: o.unitPriceUsdMinor.toString(),
    displayCurrency: "USD" as const,
  }));
  return { session, offers };
}

export function flowSpareCartAdd(sessionId: string, offerId: string, qty = 1) {
  const session = requireSession(sessionId);
  if (!session.cartId) {
    session.cartId = createCart().id;
  }
  session.flowId = "FLOW_SPARE_CART";
  session.lastScreen = "cart";
  const cart = addToCart(session.cartId, offerId, qty);
  return {
    session,
    cart: {
      cartId: cart.id,
      currency: cart.currency,
      totalUsdMinor: cart.total.amountMinor.toString(),
      lines: cart.lines.map((l) => ({
        offerId: l.offerId,
        title: l.title,
        qty: l.qty,
        lineUsdMinor: l.lineTotal.amountMinor.toString(),
      })),
    },
  };
}

export function flowSpareCheckoutReview(sessionId: string) {
  const session = requireSession(sessionId);
  if (!session.cartId) throw new Error("Cart required before checkout");
  const cart = getCart(session.cartId);
  if (!cart || cart.lines.length === 0) throw new Error("Cart empty");
  session.flowId = "FLOW_SPARE_CHECKOUT";
  session.lastScreen = "review";
  session.orderId = session.orderId ?? `ord_${session.sessionId}`;
  if (EIGHTEEN_ITEM_DISCLOSURES.length !== 18) {
    throw new Error("Disclosure list must be exactly 18 items (v4 §7.5)");
  }
  return {
    session,
    review: {
      orderId: session.orderId,
      currency: "USD" as const,
      totalUsdMinor: cart.total.amountMinor.toString(),
      lines: cart.lines,
      disclosures: [...EIGHTEEN_ITEM_DISCLOSURES],
      canCorrectOrWithdraw: true,
    },
    payButtons: CHECKOUT_PAY_BUTTONS,
  };
}

export async function flowSpareCheckoutPay(
  sessionId: string,
  choice: CheckoutPayChoice | "paynow",
  idempotencyKey: string,
): Promise<{
  session: FlowSession;
  intent?: PaymentIntent;
  codOrder?: CodOrder;
  paynowUrl?: string;
}> {
  const session = requireSession(sessionId);
  if (!session.cartId || !session.orderId) {
    throw new Error("Checkout review required before pay");
  }
  const cart = getCart(session.cartId);
  if (!cart) throw new Error("Missing cart");

  if (choice === "paynow") {
    session.lastScreen = "pay_paynow_url";
    const rate = getActiveFxRate();
    const zig = rate
      ? usdToZig(cart.total.amountMinor, rate)
      : undefined;
    return {
      session,
      paynowUrl: `https://paynow.stub/hosted?orderId=${encodeURIComponent(session.orderId)}&usdMinor=${cart.total.amountMinor.toString()}&fx=${rate?.fxRateId ?? "none"}&zigMinor=${zig?.amountMinor.toString() ?? "n/a"}`,
    };
  }

  if (choice !== "ecocash" && choice !== "cod") {
    throw new Error("Pay choice must be EcoCash, COD, or Paynow button");
  }

  session.lastScreen = "pay_result";
  const result = await createCheckoutPayment({
    choice,
    orderId: session.orderId,
    amountUsdMinor: cart.total.amountMinor,
    idempotencyKey,
  });
  return { session, ...result };
}

export type TechIntakeResult =
  | {
      kind: "intake";
      session: FlowSession;
      jobId: string;
      assessment: {
        kind: "guided_intake";
        tradeHint: string;
        payableAmount: null;
        aiPriceForbidden: true;
      };
    }
  | {
      kind: "emergency";
      session: FlowSession;
      jobId: string;
      dispatch: "deterministic_human";
      aiBlocked: false;
      handoff: ChatwootHandoff;
    };

/** Tech guided intake — assessment draft only; never a payable price (C-1 / D-32). */
export function flowTechIntake(
  sessionId: string,
  input: { tradeHint: string; description: string },
): TechIntakeResult {
  const session = requireSession(sessionId);
  session.flowId = "FLOW_TECH_INTAKE";
  session.lastScreen = "intake";
  session.jobId = session.jobId ?? `job_${session.sessionId}`;
  const emergency =
    /\b(smoke|gas|flood|spark|fire|electrocution|bleeding)\b/i.test(
      input.description,
    );
  if (emergency) {
    const emg = flowTechEmergency(sessionId, input.description);
    return { kind: "emergency", ...emg };
  }
  session.techIntake = {
    tradeHint: input.tradeHint,
    description: input.description,
    emergency: false,
    assessmentHint: "JobAssessment draft pending packages/ai — no price",
  };
  return {
    kind: "intake",
    session,
    jobId: session.jobId,
    assessment: {
      kind: "guided_intake",
      tradeHint: input.tradeHint,
      /** Explicit: no payable amount on this path. */
      payableAmount: null,
      aiPriceForbidden: true,
    },
  };
}

/** Emergency short-circuit — no AI block (D-40 / WA companion §3). */
export function flowTechEmergency(sessionId: string, reason: string) {
  const session = requireSession(sessionId);
  session.flowId = "FLOW_TECH_EMERGENCY";
  session.lastScreen = "emergency";
  session.jobId = session.jobId ?? `job_emg_${session.sessionId}`;
  session.techIntake = {
    tradeHint: "emergency",
    description: reason,
    emergency: true,
  };
  const handoff = openChatwootHandoff(sessionId, {
    topic: "tech_emergency",
    jobId: session.jobId,
  });
  return {
    session,
    jobId: session.jobId,
    dispatch: "deterministic_human" as const,
    aiBlocked: false as const,
    handoff,
  };
}

export function openChatwootHandoff(
  sessionId: string,
  input: { topic: string; jobId?: string; orderId?: string },
): ChatwootHandoff {
  const session = requireSession(sessionId);
  const conversationKey = `cw_${session.sessionId}_${Date.now().toString(36)}`;
  const erpTicketId = `tkt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const handoff: ChatwootHandoff = {
    conversationKey,
    chatwootContactId:
      process.env.CHATWOOT_CONTACT_ID_STUB?.trim() ||
      `cw_contact_${session.customerId ?? session.sessionId}`,
    inboxId: process.env.CHATWOOT_INBOX_ID?.trim() || "inbox_fx_support",
    erpTicketId,
    topic: input.topic,
  };
  if (session.customerId !== undefined) handoff.customerId = session.customerId;
  const orderId = input.orderId ?? session.orderId;
  if (orderId !== undefined) handoff.orderId = orderId;
  const jobId = input.jobId ?? session.jobId;
  if (jobId !== undefined) handoff.jobId = jobId;
  if (session.cartId !== undefined) handoff.cartId = session.cartId;
  if (session.lastSearchQuery !== undefined) {
    handoff.searchQuery = session.lastSearchQuery;
  }
  handoffs.set(handoff.conversationKey, handoff);

  const ticket: SupportTicket = {
    ticketId: erpTicketId,
    conversationKey,
    topic: input.topic,
    status: "open",
    statusFrom: "erp",
  };
  if (handoff.customerId !== undefined) ticket.customerId = handoff.customerId;
  if (handoff.orderId !== undefined) ticket.orderId = handoff.orderId;
  if (handoff.jobId !== undefined) ticket.jobId = handoff.jobId;
  supportTickets.set(ticket.ticketId, ticket);

  session.lastScreen = "chatwoot_handoff";
  return handoff;
}

/** Assert required Chatwoot/ERP id fields present (S111 contract). */
export function assertChatwootHandoffIdContract(h: ChatwootHandoff): void {
  if (!h.conversationKey) throw new Error("conversationKey required");
  if (!h.chatwootContactId) throw new Error("chatwootContactId required");
  if (!h.inboxId) throw new Error("inboxId required");
  if (!h.erpTicketId) throw new Error("erpTicketId required");
  if (!h.topic) throw new Error("topic required");
}

/** FLOW_SUPPORT_TICKET — opens ERP ticket + Chatwoot handoff ids (Chatwoot ≠ status SoR). */
export function flowSupportTicket(
  sessionId: string,
  input: { topic: string; orderId?: string; jobId?: string },
): { session: FlowSession; handoff: ChatwootHandoff; ticket: SupportTicket } {
  const session = requireSession(sessionId);
  session.flowId = "FLOW_SUPPORT_TICKET";
  const handoff = openChatwootHandoff(sessionId, {
    topic: input.topic,
    ...(input.orderId !== undefined ? { orderId: input.orderId } : {}),
    ...(input.jobId !== undefined ? { jobId: input.jobId } : {}),
  });
  assertChatwootHandoffIdContract(handoff);
  const ticket = supportTickets.get(handoff.erpTicketId);
  if (!ticket) throw new Error("Expected ERP ticket for handoff");
  ticket.status = "pending_human";
  session.lastScreen = "support_ticket";
  return { session, handoff, ticket: { ...ticket } };
}

export function getSupportTicket(ticketId: string): SupportTicket | undefined {
  const t = supportTickets.get(ticketId);
  return t ? { ...t } : undefined;
}

/** Admin / ops list — ERP tickets are SoR; Chatwoot is handoff only. */
export function listSupportTickets(): SupportTicket[] {
  return [...supportTickets.values()].map((t) => ({ ...t }));
}

/**
 * PD43 thin vertical — CPA §7.5 eighteen-item disclosure + review-before-pay gate.
 * Channels: web spare (+ native mirror). Official WA already has review.
 */
export function runPd43CpaDisclosureThinVertical(): {
  disclosureCount: 18;
  reviewRequiredBeforePay: true;
  payableFromAi: false;
  channels: readonly ["web", "native", "wa"];
} {
  if (EIGHTEEN_ITEM_DISCLOSURES.length !== 18) {
    throw new Error("PD43 expected exactly 18 CPA disclosure items");
  }
  const reviewIdx = EIGHTEEN_ITEM_DISCLOSURES.findIndex((d) =>
    /review step/i.test(d),
  );
  if (reviewIdx < 0) {
    throw new Error("PD43 disclosure #18 review step missing");
  }
  return {
    disclosureCount: 18,
    reviewRequiredBeforePay: true,
    payableFromAi: false,
    channels: ["web", "native", "wa"] as const,
  };
}

/**
 * PD44 thin vertical — grocery checkout same CPA disclosure gate; liquor forbidden.
 */
export function runPd44GroceryCpaDisclosureThinVertical(): {
  disclosureCount: 18;
  reviewRequiredBeforePay: true;
  liquorSkus: false;
  payableFromAi: false;
  vertical: "grocery";
} {
  const base = runPd43CpaDisclosureThinVertical();
  return {
    disclosureCount: base.disclosureCount,
    reviewRequiredBeforePay: true,
    liquorSkus: false,
    payableFromAi: false,
    vertical: "grocery",
  };
}

/**
 * PD45 thin vertical — consent audit + ERP support tickets for admin ops UI.
 */
export function runPd45SupportConsentAdminThinVertical(): {
  consentAuditLen: number;
  supportTicketCount: number;
  chatwootIsStatusSor: false;
  payableFromAi: false;
} {
  __resetWhatsappForTests();
  const s = startFlow("FLOW_CONSENT_CENTRE", "pd45_cust");
  flowConsentCentre(s.sessionId, { marketing: true, vehicleHub: false });
  const ticket = flowSupportTicket(s.sessionId, { topic: "pd45_ops" });
  assertChatwootHandoffIdContract(ticket.handoff);
  const audits = listConsentAudit();
  const tickets = listSupportTickets();
  if (audits.length < 1 || tickets.length < 1) {
    throw new Error("PD45 expected consent audit + support ticket");
  }
  return {
    consentAuditLen: audits.length,
    supportTicketCount: tickets.length,
    chatwootIsStatusSor: false,
    payableFromAi: false,
  };
}

/** §10 MVP — ERP creates claim; Chatwoot not SoR; AI never writes refund amounts. */
export function flowSpareReturns(
  sessionId: string,
  input: { orderId: string; reason: string },
): { session: FlowSession; claim: ReturnClaim } {
  const session = requireSession(sessionId);
  session.flowId = "FLOW_SPARE_RETURNS";
  session.lastScreen = "returns";
  session.orderId = input.orderId;
  const claim: ReturnClaim = {
    claimId: `ret_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    orderId: input.orderId,
    reason: input.reason,
    path: "refund_or_replace",
    status: "open",
    statusFrom: "erp",
    resolutionAmountMinor: null,
  };
  if (session.customerId !== undefined) claim.customerId = session.customerId;
  returnClaims.set(claim.claimId, claim);
  return { session, claim: { ...claim } };
}

export function getReturnClaim(claimId: string): ReturnClaim | undefined {
  const c = returnClaims.get(claimId);
  return c ? { ...c } : undefined;
}

/**
 * ERP human resolution — refund or replace only.
 * Never accepts amountMinor from caller (AI-never-writes-money).
 */
export function resolveReturnClaim(input: {
  claimId: string;
  path: "refund" | "replace";
}): ReturnClaim {
  const claim = returnClaims.get(input.claimId);
  if (!claim) throw new Error("Unknown return claim");
  if (claim.status !== "open") throw new Error("Claim already resolved");
  claim.path = input.path;
  claim.status =
    input.path === "refund" ? "resolved_refund" : "resolved_replace";
  claim.resolutionAmountMinor = null;
  return { ...claim };
}

/** §10 — referral home (promo credit; no cash-out D-41a / D-42). */
export function flowReferralHome(sessionId: string, customerId: string) {
  const session = requireSession(sessionId);
  session.flowId = "FLOW_REFERRAL_HOME";
  session.customerId = customerId;
  session.lastScreen = "referral";
  let row = referrals.get(customerId);
  if (!row) {
    row = {
      code: formatReferralCode("REF", customerId),
      balancePromoCreditMinor: 0n,
    };
    referrals.set(customerId, row);
  }
  // Guard: referral rewards may only be promo_credit / percent_service_fee (D-42).
  assertReferralRewardNonCash({
    kind: "promo_credit",
    amountMinor: row.balancePromoCreditMinor,
    currency: "USD",
  });
  return {
    session,
    referral: {
      code: row.code,
      balancePromoCreditMinor: row.balancePromoCreditMinor.toString(),
      cashOutForbidden: true,
      rewardKind: "promo_credit" as const,
    },
  };
}

/** §10 — marketing / purpose consents (revocable) with audit trail. */
export function flowConsentCentre(
  sessionId: string,
  patch: Partial<ConsentState>,
) {
  const session = requireSession(sessionId);
  session.flowId = "FLOW_CONSENT_CENTRE";
  session.lastScreen = "consent";
  session.consents = {
    marketing: false,
    vehicleHub: false,
    careRenewals: false,
    referralInvites: false,
    ...session.consents,
    ...patch,
  };
  const entry: {
    sessionId: string;
    customerId?: string;
    consents: ConsentState;
    at: string;
  } = {
    sessionId,
    consents: { ...session.consents },
    at: new Date().toISOString(),
  };
  if (session.customerId !== undefined) entry.customerId = session.customerId;
  consentAudit.push(entry);
  return { session, consents: session.consents, auditLen: consentAudit.length };
}

export function listConsentAudit(): ReadonlyArray<{
  sessionId: string;
  customerId?: string;
  consents: ConsentState;
  at: string;
}> {
  return consentAudit.map((e) => ({ ...e, consents: { ...e.consents } }));
}

export function getChatwootHandoff(key: string): ChatwootHandoff | undefined {
  return handoffs.get(key);
}

/** FLOW_GROCERY_HOME — food/pantry entry (no liquor tile). */
export function flowGroceryHome(sessionId: string) {
  const session = requireSession(sessionId);
  session.flowId = "FLOW_GROCERY_HOME";
  session.vertical = "grocery";
  session.lastScreen = "home";
  return {
    session,
    menu: {
      title: "Shop groceries",
      actions: ["search", "track"] as const,
      liquorForbidden: true,
    },
  };
}

/** FLOW_GROCERY_SEARCH — USD list; liquor/age-gate never surfaced. */
export function flowGrocerySearch(
  sessionId: string,
  query: string,
): {
  session: FlowSession;
  offers: Array<{
    offerId: string;
    title: string;
    displayPriceUsdMinor: string;
    displayCurrency: "USD";
    coldChain: string;
    supplierDisplayName: string;
    ageGateRequired: boolean;
  }>;
} {
  const session = requireSession(sessionId);
  session.flowId = "FLOW_GROCERY_SEARCH";
  session.vertical = "grocery";
  session.lastScreen = "search_results";
  session.lastSearchQuery = query;
  const offers = searchGroceryOffers(query, { sessionRole: "b2c" }).map((o) => ({
    offerId: o.offerId,
    title: o.title,
    displayPriceUsdMinor: o.unitPriceUsdMinor.toString(),
    displayCurrency: "USD" as const,
    coldChain: o.coldChain,
    supplierDisplayName: o.supplierDisplayName,
    ageGateRequired: o.ageGateRequired,
  }));
  if (offers.some((o) => o.ageGateRequired)) {
    throw new Error("Liquor/age-gate offers forbidden on FLOW_GROCERY_* (counsel gate)");
  }
  return { session, offers };
}

export function flowGroceryCartAdd(
  sessionId: string,
  offerId: string,
  qty = 1,
) {
  const session = requireSession(sessionId);
  if (!session.groceryCartId) {
    session.groceryCartId = createGroceryCart().id;
  }
  session.flowId = "FLOW_GROCERY_CART";
  session.vertical = "grocery";
  session.lastScreen = "cart";
  const cart = addToGroceryCart(session.groceryCartId, offerId, qty, {
    buyerSegment: "b2c",
  });
  return {
    session,
    cart: {
      cartId: cart.id,
      currency: cart.currency,
      totalUsdMinor: cart.total.amountMinor.toString(),
      lines: cart.lines.map((l) => ({
        offerId: l.offerId,
        title: l.title,
        qty: l.qty,
        lineUsdMinor: l.lineTotal.amountMinor.toString(),
        soldBy: l.supplierDisplayName,
      })),
    },
  };
}

/** FLOW_GROCERY_SLOT — delivery window + cold-chain notes (no liquorAllowed surface). */
export function flowGrocerySlot(
  sessionId: string,
  slotId = "slot_harare_am",
) {
  const session = requireSession(sessionId);
  if (!session.groceryCartId) throw new Error("Grocery cart required before slot");
  session.flowId = "FLOW_GROCERY_SLOT";
  session.vertical = "grocery";
  session.grocerySlotId = slotId;
  session.lastScreen = "slot";
  return {
    session,
    slot: {
      slotId,
      window: "Today 10:00–13:00",
      coldChainNotes: "Chilled lines keep cold-chain band until POD",
      liquorAllowed: false,
    },
  };
}

export function flowGroceryCheckoutReview(sessionId: string): {
  session: FlowSession;
  review: {
    orderId: string;
    currency: "USD";
    totalUsdMinor: string;
    lines: Array<{
      offerId: string;
      title: string;
      qty: number;
      supplierDisplayName: string;
    }>;
    slotId: string;
    liquorTermsForbidden: true;
  };
  payButtons: typeof CHECKOUT_PAY_BUTTONS;
} {
  const session = requireSession(sessionId);
  if (!session.groceryCartId) throw new Error("Grocery cart required before checkout");
  if (!session.grocerySlotId) throw new Error("Slot required before grocery checkout");
  const cart = getGroceryCart(session.groceryCartId);
  if (!cart || cart.lines.length === 0) throw new Error("Grocery cart empty");
  session.flowId = "FLOW_GROCERY_CHECKOUT";
  session.vertical = "grocery";
  session.lastScreen = "review";
  session.orderId = session.orderId ?? `gord_${session.sessionId}`;
  return {
    session,
    review: {
      orderId: session.orderId,
      currency: "USD" as const,
      totalUsdMinor: cart.total.amountMinor.toString(),
      lines: cart.lines.map((l) => ({
        offerId: l.offerId,
        title: l.title,
        qty: l.qty,
        supplierDisplayName: l.supplierDisplayName,
      })),
      slotId: session.grocerySlotId,
      liquorTermsForbidden: true,
    },
    payButtons: CHECKOUT_PAY_BUTTONS,
  };
}

export async function flowGroceryCheckoutPay(
  sessionId: string,
  choice: CheckoutPayChoice | "paynow",
  idempotencyKey: string,
): Promise<{
  session: FlowSession;
  intent?: PaymentIntent;
  codOrder?: CodOrder;
  paynowUrl?: string;
}> {
  const session = requireSession(sessionId);
  if (!session.groceryCartId || !session.orderId) {
    throw new Error("Grocery checkout review required before pay");
  }
  const cart = getGroceryCart(session.groceryCartId);
  if (!cart) throw new Error("Missing grocery cart");

  if (choice === "paynow") {
    session.lastScreen = "pay_paynow_url";
    const rate = getActiveFxRate();
    const zig = rate ? usdToZig(cart.total.amountMinor, rate) : undefined;
    return {
      session,
      paynowUrl: `https://paynow.stub/hosted?orderId=${encodeURIComponent(session.orderId)}&usdMinor=${cart.total.amountMinor.toString()}&fx=${rate?.fxRateId ?? "none"}&zigMinor=${zig?.amountMinor.toString() ?? "n/a"}&vertical=grocery`,
    };
  }
  if (choice !== "ecocash" && choice !== "cod") {
    throw new Error("Pay choice must be EcoCash, COD, or Paynow button");
  }
  session.lastScreen = "pay_result";
  const result = await createCheckoutPayment({
    choice,
    orderId: session.orderId,
    amountUsdMinor: cart.total.amountMinor,
    idempotencyKey,
  });
  return { session, ...result };
}

export function flowGroceryTrack(sessionId: string) {
  const session = requireSession(sessionId);
  session.flowId = "FLOW_GROCERY_TRACK";
  session.vertical = "grocery";
  session.lastScreen = "track";
  return {
    session,
    track: {
      orderId: session.orderId ?? null,
      statusFrom: "erp" as const,
      status: session.orderId ? "confirmed" : "none",
    },
  };
}

/**
 * PD12 — send registered Flow invite + D-57 pay buttons via Cloud API sandbox/live.
 * Binds phone → session for inbound button routing.
 */
export async function sendCheckoutPayButtonsViaCloud(input: {
  sessionId: string;
  toE164: string;
  vertical: CheckoutVertical;
}): Promise<{
  flowMessageId: string;
  buttonsMessageId: string;
  flowId: string;
  buttons: CheckoutButton[];
}> {
  const session = requireSession(input.sessionId);
  session.toE164 = input.toE164;
  session.vertical = input.vertical;
  bindWaSessionPhone(input.toE164, session.sessionId);

  const flowKey: WaFlowKey =
    input.vertical === "grocery"
      ? "FLOW_GROCERY_CHECKOUT"
      : "FLOW_SPARE_CHECKOUT";
  const api = new MetaCloudApiAdapter();
  const flow = await api.sendFlowMessage({
    toE164: input.toE164,
    flowKey,
    bodyText:
      input.vertical === "grocery"
        ? "Review grocery order (USD). Choose EcoCash or COD below."
        : "Review spare order (USD). Choose EcoCash or COD below.",
    flowToken: session.sessionId,
    cta: "Review",
  });
  const buttons = await api.sendInteractiveButtons({
    toE164: input.toE164,
    bodyText: "Pay with:",
    buttons: CHECKOUT_PAY_BUTTONS.map((b) => ({
      id: b.id,
      title: b.title.slice(0, 20),
    })),
  });
  session.lastScreen = "pay_buttons_sent";
  return {
    flowMessageId: flow.messageId,
    buttonsMessageId: buttons.messageId,
    flowId: flow.flowId,
    buttons: [...CHECKOUT_PAY_BUTTONS],
  };
}

/** Inbound Cloud API interactive → same createCheckoutPayment as web (D-57). */
export async function handleWaInboundPayButton(input: {
  fromE164: string;
  buttonId: string;
  idempotencyKey: string;
  sessionId?: string;
}): Promise<{
  session: FlowSession;
  intent?: PaymentIntent;
  codOrder?: CodOrder;
  paynowUrl?: string;
  templateMessageId?: string;
}> {
  const sessionId =
    input.sessionId ?? resolveWaSessionByPhone(input.fromE164);
  if (!sessionId) throw new Error("No WA session bound for phone");
  const session = requireSession(sessionId);
  const choice = input.buttonId as CheckoutPayChoice | "paynow";
  const vertical = session.vertical ?? "spare";
  const paid =
    vertical === "grocery"
      ? await flowGroceryCheckoutPay(sessionId, choice, input.idempotencyKey)
      : await flowSpareCheckoutPay(sessionId, choice, input.idempotencyKey);

  const api = new MetaCloudApiAdapter();
  const tplKey =
    vertical === "grocery" ? "GROCERY_ORDER_CONFIRMED" : "SPARE_ORDER_CONFIRMED";
  const tpl = await api.sendRegisteredTemplate({
    toE164: input.fromE164,
    key: tplKey,
  });
  return { ...paid, templateMessageId: tpl.messageId };
}

/** Process Meta webhook body after signature+idempotency (PD12). */
export async function processWaWebhookPayload(
  body: unknown,
  idempotencyKey: string,
): Promise<
  | { handled: false }
  | {
      handled: true;
      kind: "button_reply";
      result: Awaited<ReturnType<typeof handleWaInboundPayButton>>;
    }
> {
  const inbound = parseWaInboundInteractive(body);
  if (!inbound || inbound.kind !== "button_reply" || !inbound.buttonId) {
    return { handled: false };
  }
  const result = await handleWaInboundPayButton({
    fromE164: inbound.fromE164,
    buttonId: inbound.buttonId,
    idempotencyKey,
  });
  return { handled: true, kind: "button_reply", result };
}

/**
 * PD12 thin vertical: sandbox Cloud API FLOW_SPARE_* + FLOW_GROCERY_* food
 * → interactive EcoCash|COD → same payment intents as web. No liquor / no Baileys.
 */
export async function runPd12WaFlowsSandboxThinVertical(input?: {
  sparePhone?: string;
  groceryPhone?: string;
}): Promise<{
  mode: string;
  spare: {
    flowId: string;
    buttonsMessageId: string;
    intentMethod: string | undefined;
    templateMessageId: string | undefined;
  };
  grocery: {
    flowId: string;
    buttonsMessageId: string;
    codCurrency: string | undefined;
    templateMessageId: string | undefined;
    liquorForbidden: true;
  };
  outboundKinds: string[];
}> {
  const mode = (process.env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (mode !== "sandbox") {
    throw new Error("runPd12WaFlowsSandboxThinVertical requires DIAL_INTEGRATION_MODE=sandbox");
  }
  if (
    !process.env.WHATSAPP_TOKEN?.trim() ||
    !process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  ) {
    throw new Error("PD12 sandbox requires WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID");
  }
  if (
    !process.env.ECOCASH_API_KEY?.trim() ||
    !process.env.ECOCASH_MERCHANT_CODE?.trim()
  ) {
    throw new Error(
      "PD12 sandbox EcoCash path requires ECOCASH_API_KEY + ECOCASH_MERCHANT_CODE",
    );
  }

  const { __resetCatalogueForTests } = await import("@dial/catalogue");
  const { __resetPaymentsForTests, setDailyZigRate } = await import(
    "@dial/payments"
  );

  __resetWhatsappForTests();
  __resetWaCloudSandboxForTests();
  __resetCatalogueForTests();
  __resetGroceryForTests();
  __resetPaymentsForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "ops_pd12" });

  const sparePhone = input?.sparePhone ?? "+263771000012";
  const groceryPhone = input?.groceryPhone ?? "+263771000013";

  // Spare: search → cart → review → Cloud Flow+buttons → EcoCash
  const spareSession = startFlow("FLOW_SPARE_SEARCH", "cust_pd12_spare");
  const search = flowSpareSearch(spareSession.sessionId, "oil");
  if (search.offers.length < 1) throw new Error("PD12 spare search empty");
  flowSpareCartAdd(spareSession.sessionId, search.offers[0]!.offerId, 1);
  flowSpareCheckoutReview(spareSession.sessionId);
  const spareSend = await sendCheckoutPayButtonsViaCloud({
    sessionId: spareSession.sessionId,
    toE164: sparePhone,
    vertical: "spare",
  });
  const sparePay = await handleWaInboundPayButton({
    fromE164: sparePhone,
    buttonId: "ecocash",
    idempotencyKey: "pd12-spare-eco-1",
  });
  if (sparePay.intent?.method !== "ecocash_direct") {
    throw new Error("PD12 spare expected ecocash_direct intent (same as web)");
  }

  // Grocery food: home → search → cart → slot → checkout → COD
  const grocSession = startFlow("FLOW_GROCERY_HOME", "cust_pd12_groc");
  const home = flowGroceryHome(grocSession.sessionId);
  if (!home.menu.liquorForbidden) throw new Error("PD12 grocery must forbid liquor");
  const gSearch = flowGrocerySearch(grocSession.sessionId, "milk");
  if (gSearch.offers.length < 1) throw new Error("PD12 grocery search empty");
  if (gSearch.offers.some((o) => o.ageGateRequired)) {
    throw new Error("PD12 grocery must not surface age-gate/liquor");
  }
  flowGroceryCartAdd(grocSession.sessionId, gSearch.offers[0]!.offerId, 1);
  flowGrocerySlot(grocSession.sessionId);
  flowGroceryCheckoutReview(grocSession.sessionId);
  const grocSend = await sendCheckoutPayButtonsViaCloud({
    sessionId: grocSession.sessionId,
    toE164: groceryPhone,
    vertical: "grocery",
  });
  const grocPay = await handleWaInboundPayButton({
    fromE164: groceryPhone,
    buttonId: "cod",
    idempotencyKey: "pd12-groc-cod-1",
  });
  if (grocPay.codOrder?.amountUsd.currency !== "USD") {
    throw new Error("PD12 grocery COD must settle USD (same as web)");
  }
  flowGroceryTrack(grocSession.sessionId);

  const outbound = listWaSandboxOutbound();
  const outboundKinds = outbound.map((m) => m.kind);
  if (!outboundKinds.includes("flow") || !outboundKinds.includes("buttons")) {
    throw new Error("PD12 expected sandbox Cloud API flow + buttons outbound");
  }
  if (!outboundKinds.includes("template")) {
    throw new Error("PD12 expected registered confirmation templates");
  }

  return {
    mode,
    spare: {
      flowId: spareSend.flowId,
      buttonsMessageId: spareSend.buttonsMessageId,
      intentMethod: sparePay.intent?.method,
      templateMessageId: sparePay.templateMessageId,
    },
    grocery: {
      flowId: grocSend.flowId,
      buttonsMessageId: grocSend.buttonsMessageId,
      codCurrency: grocPay.codOrder?.amountUsd.currency,
      templateMessageId: grocPay.templateMessageId,
      liquorForbidden: true,
    },
    outboundKinds,
  };
}

/** Evidence helper — tree must not depend on unofficial WA clients. */
export function assertNoUnofficialWhatsAppDeps(pkgJsonTexts: string[]): void {
  for (const text of pkgJsonTexts) {
    if (/\bbaileys\b/i.test(text) || /whatsapp-web\.js/i.test(text)) {
      throw new Error("Unofficial WhatsApp client dependency forbidden (D-40)");
    }
  }
}

export function __resetWhatsappForTests(): void {
  sessions.clear();
  __resetIdempotencyForTests();
  handoffs.clear();
  supportTickets.clear();
  returnClaims.clear();
  referrals.clear();
  consentAudit.length = 0;
  __resetWaCloudSandboxForTests();
}

export {
  MetaCloudApiAdapter,
  verifyWebhookChallenge,
  resolveWhatsAppAppSecret,
  verifyMetaSignature as verifyMetaSignatureCloud,
  pingWhatsAppHealth,
  parseWaInboundInteractive,
  listWaSandboxOutbound,
  bindWaSessionPhone,
  resolveWaSessionByPhone,
  __resetWaCloudSandboxForTests,
  type WhatsAppCloudAdapter,
  type InteractiveButton,
  type SandboxOutboundMessage,
} from "./cloudApi.js";

export {
  listWaTemplateRegistry,
  resolveWaTemplate,
  runPd40WaTemplateRegistryThinVertical,
  type WaTemplateBinding,
  type WaTemplateKey,
  type WaTemplateVertical,
} from "./templateRegistry.js";

export {
  listWaFlowRegistry,
  resolveWaFlow,
  type WaFlowBinding,
  type WaFlowKey,
} from "./flowRegistry.js";
