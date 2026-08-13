/**
 * Official WhatsApp Cloud API adapter surface (D-40) — no Baileys / whatsapp-web.js.
 * E2a expand: Matrix B — disclosure, tech intake/emergency, §10 stubs, Chatwoot, Paynow URL.
 */
import { addToCart, createCart, getCart, searchOffers } from "@dial/catalogue";
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

export type FlowId =
  | "FLOW_SPARE_SEARCH"
  | "FLOW_SPARE_CART"
  | "FLOW_SPARE_CHECKOUT"
  | "FLOW_TECH_INTAKE"
  | "FLOW_TECH_EMERGENCY"
  | "FLOW_SPARE_RETURNS"
  | "FLOW_REFERRAL_HOME"
  | "FLOW_CONSENT_CENTRE"
  | "FLOW_SUPPORT_TICKET";

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
  orderId?: string;
  jobId?: string;
  customerId?: string;
  lastScreen?: string;
  lastSearchQuery?: string;
  techIntake?: TechIntakeDraft;
  consents?: ConsentState;
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

const sessions = new Map<string, FlowSession>();
const handoffs = new Map<string, ChatwootHandoff>();
const supportTickets = new Map<string, SupportTicket>();
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

/** §10 MVP — returns stub (ERP creates claim; Chatwoot not SoR). */
export function flowSpareReturns(
  sessionId: string,
  input: { orderId: string; reason: string },
) {
  const session = requireSession(sessionId);
  session.flowId = "FLOW_SPARE_RETURNS";
  session.lastScreen = "returns";
  session.orderId = input.orderId;
  return {
    session,
    claim: {
      claimId: `ret_${session.sessionId}`,
      orderId: input.orderId,
      reason: input.reason,
      path: "refund_or_replace" as const,
      statusFrom: "erp" as const,
    },
  };
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
  referrals.clear();
  consentAudit.length = 0;
}

export {
  MetaCloudApiAdapter,
  verifyWebhookChallenge,
  resolveWhatsAppAppSecret,
  verifyMetaSignature as verifyMetaSignatureCloud,
  type WhatsAppCloudAdapter,
} from "./cloudApi.js";

export {
  listWaTemplateRegistry,
  resolveWaTemplate,
  type WaTemplateBinding,
  type WaTemplateKey,
} from "./templateRegistry.js";
