/**
 * PD78 — customer marketing consent (Pack Matrix B / customers.consents).
 * Session-derived customerId only; grant/revoke with audit trail.
 */

export type MarketingConsentState = {
  customerId: string;
  marketing: boolean;
  updatedAt: string;
};

export type MarketingConsentEvent = {
  eventId: string;
  customerId: string;
  action: "grant" | "revoke";
  channel: "web";
  at: string;
};

const states = new Map<string, MarketingConsentState>();
const audit: MarketingConsentEvent[] = [];

function eid(): string {
  return `mce_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function getMarketingConsent(
  customerId: string,
): MarketingConsentState {
  const existing = states.get(customerId);
  if (existing) return { ...existing };
  return {
    customerId,
    marketing: false,
    updatedAt: new Date(0).toISOString(),
  };
}

export function setMarketingConsent(input: {
  customerId: string;
  marketing: boolean;
}): MarketingConsentState {
  if (!input.customerId.trim()) throw new Error("customerId required");
  const next = input.marketing === true;
  const prev = states.get(input.customerId);
  if (!prev || prev.marketing !== next) {
    audit.push({
      eventId: eid(),
      customerId: input.customerId,
      action: next ? "grant" : "revoke",
      channel: "web",
      at: new Date().toISOString(),
    });
  }
  const row: MarketingConsentState = {
    customerId: input.customerId,
    marketing: next,
    updatedAt: new Date().toISOString(),
  };
  states.set(input.customerId, row);
  return { ...row };
}

export function listMarketingConsentAudit(
  customerId?: string,
): MarketingConsentEvent[] {
  return audit
    .filter((e) => (customerId ? e.customerId === customerId : true))
    .map((e) => ({ ...e }));
}

/**
 * PD78 thin vertical: grant → revoke → audit has both (Pack Matrix B).
 */
export function runPd78MarketingConsentThinVertical(): {
  granted: true;
  revoked: true;
  auditLen: number;
  payableFromAi: false;
} {
  __resetMarketingConsentForTests();
  const customerId = "cust_pd78";
  const granted = setMarketingConsent({ customerId, marketing: true });
  if (!granted.marketing) throw new Error("PD78 expected grant");
  const revoked = setMarketingConsent({ customerId, marketing: false });
  if (revoked.marketing) throw new Error("PD78 expected revoke");
  const events = listMarketingConsentAudit(customerId);
  if (!events.some((e) => e.action === "grant")) {
    throw new Error("PD78 expected grant in audit");
  }
  if (!events.some((e) => e.action === "revoke")) {
    throw new Error("PD78 expected revoke in audit");
  }
  return {
    granted: true,
    revoked: true,
    auditLen: events.length,
    payableFromAi: false,
  };
}

export function __resetMarketingConsentForTests(): void {
  states.clear();
  audit.length = 0;
}
