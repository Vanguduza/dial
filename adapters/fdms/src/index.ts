/**
 * In-house ZIMRA Virtual Gateway client (D-40a / D-59 / PD11).
 * Fixture = no keys. Sandbox = keys required + inline Virtual Gateway (no physical printer).
 * Live = HTTP to FDMS_BASE_URL. CloudESD = optional signer only.
 */
export type IntegrationMode = "fixture" | "sandbox" | "live";

export type AgencyReceiptClass =
  | "DIAL_FEE"
  | "GOODS_FORMAL"
  | "GOODS_INFORMAL";

export function integrationMode(
  env: NodeJS.ProcessEnv = process.env,
): IntegrationMode {
  const m = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (m === "sandbox" || m === "live") return m;
  return "fixture";
}

export interface FdmsAdapter {
  openFiscalDay(): Promise<{ fiscalDayId: string }>;
  submitReceipt(receipt: unknown): Promise<{ fiscalCode: string }>;
  closeFiscalDay(): Promise<{ closedAt: string }>;
}

function requireSecret(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} unset — fail closed`);
  return v;
}

function requireSandboxKeys(): { base: string; deviceId: string; key: string } {
  return {
    base: requireSecret("FDMS_BASE_URL"),
    deviceId: requireSecret("FDMS_DEVICE_ID"),
    key: requireSecret("FDMS_ACTIVATION_KEY"),
  };
}

/** Inline sandbox Virtual Gateway state (PD11) — day-gated submit, agency classes. */
type SandboxDay = {
  fiscalDayId: string;
  openedAt: string;
  closedAt: string | null;
  seq: number;
};

function sandboxDayRef(): { current: SandboxDay | null } {
  const g = globalThis as { __dialFdmsSandboxDay?: { current: SandboxDay | null } };
  if (!g.__dialFdmsSandboxDay) g.__dialFdmsSandboxDay = { current: null };
  return g.__dialFdmsSandboxDay;
}

export function __resetFdmsSandboxForTests(): void {
  sandboxDayRef().current = null;
}

export function getSandboxFiscalDaySnapshot(): {
  fiscalDayId: string | null;
  openedAt: string | null;
  closedAt: string | null;
  open: boolean;
} {
  const sandboxDay = sandboxDayRef().current;
  if (!sandboxDay) {
    return { fiscalDayId: null, openedAt: null, closedAt: null, open: false };
  }
  return {
    fiscalDayId: sandboxDay.fiscalDayId,
    openedAt: sandboxDay.openedAt,
    closedAt: sandboxDay.closedAt,
    open: sandboxDay.closedAt === null,
  };
}

function parseAgencyReceipt(receipt: unknown): {
  receiptClass: AgencyReceiptClass;
  amountMinor: string;
  currency: string;
  orderId?: string;
  outboxId?: string;
} {
  const r = (receipt ?? {}) as Record<string, unknown>;
  const receiptClass = String(r.receiptClass ?? "") as AgencyReceiptClass;
  if (
    receiptClass !== "DIAL_FEE" &&
    receiptClass !== "GOODS_FORMAL" &&
    receiptClass !== "GOODS_INFORMAL"
  ) {
    throw new Error(
      "FDMS sandbox requires agency receiptClass DIAL_FEE|GOODS_FORMAL|GOODS_INFORMAL (D-59)",
    );
  }
  const amountMinor = String(r.amountMinor ?? "");
  if (!/^\d+$/.test(amountMinor)) {
    throw new Error("FDMS sandbox amountMinor must be integer string (no float)");
  }
  const currency = String(r.currency ?? "USD");
  if (currency !== "USD" && currency !== "ZWG") {
    throw new Error("FDMS sandbox currency must be USD|ZWG");
  }
  const out: {
    receiptClass: AgencyReceiptClass;
    amountMinor: string;
    currency: string;
    orderId?: string;
    outboxId?: string;
  } = { receiptClass, amountMinor, currency };
  if (r.orderId != null) out.orderId = String(r.orderId);
  if (r.outboxId != null) out.outboxId = String(r.outboxId);
  return out;
}

/**
 * Sandbox Virtual Gateway — keys required; open day before submit; agency classes only.
 * Does not call external ZIMRA (inline) so CI can prove the money-outbox path.
 */
async function sandboxOpenDay(deviceId: string): Promise<{ fiscalDayId: string }> {
  const ref = sandboxDayRef();
  if (ref.current && ref.current.closedAt === null) {
    return { fiscalDayId: ref.current.fiscalDayId };
  }
  const fiscalDayId = `fd_sb_${deviceId}_${Date.now().toString(36)}`;
  ref.current = {
    fiscalDayId,
    openedAt: new Date().toISOString(),
    closedAt: null,
    seq: 0,
  };
  return { fiscalDayId };
}

async function sandboxSubmit(receipt: unknown): Promise<{ fiscalCode: string }> {
  const ref = sandboxDayRef();
  if (!ref.current || ref.current.closedAt !== null) {
    throw new Error("FDMS sandbox fiscal day not open — openDay before submitReceipt");
  }
  const parsed = parseAgencyReceipt(receipt);
  ref.current.seq += 1;
  const fiscalCode = `FISCAL_SB_${parsed.receiptClass}_${ref.current.seq.toString().padStart(4, "0")}`;
  return { fiscalCode };
}

async function sandboxCloseDay(): Promise<{ closedAt: string }> {
  const ref = sandboxDayRef();
  if (!ref.current || ref.current.closedAt !== null) {
    throw new Error("FDMS sandbox fiscal day not open — open before close");
  }
  const closedAt = new Date().toISOString();
  ref.current.closedAt = closedAt;
  return { closedAt };
}

export class ZimraVirtualGatewayAdapter implements FdmsAdapter {
  async openFiscalDay(): Promise<{ fiscalDayId: string }> {
    const mode = integrationMode();
    if (mode === "fixture") {
      return { fiscalDayId: "fd_fx_open" };
    }
    const { base, deviceId, key } = requireSandboxKeys();
    if (mode === "sandbox") {
      // Inline Virtual Gateway when URL is dial-sandbox or always for PD11 CI-safe path.
      // Live-shaped HTTP attempted only when FDMS_SANDBOX_HTTP=1.
      if (process.env.FDMS_SANDBOX_HTTP?.trim() === "1") {
        const res = await fetch(`${base.replace(/\/$/, "")}/v1/fiscal-days/open`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deviceId,
            deviceSerial: process.env.FDMS_DEVICE_SERIAL,
          }),
        });
        if (!res.ok) throw new Error(`FDMS openDay HTTP ${res.status}`);
        const data = (await res.json()) as { fiscalDayId?: string };
        const fiscalDayId = data.fiscalDayId ?? `fd_${deviceId}`;
        sandboxDayRef().current = {
          fiscalDayId,
          openedAt: new Date().toISOString(),
          closedAt: null,
          seq: 0,
        };
        return { fiscalDayId };
      }
      return sandboxOpenDay(deviceId);
    }
    // live
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/fiscal-days/open`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceId,
        deviceSerial: process.env.FDMS_DEVICE_SERIAL,
      }),
    });
    if (!res.ok) throw new Error(`FDMS openDay HTTP ${res.status}`);
    const data = (await res.json()) as { fiscalDayId?: string };
    return { fiscalDayId: data.fiscalDayId ?? `fd_${deviceId}` };
  }

  async submitReceipt(receipt: unknown): Promise<{ fiscalCode: string }> {
    const mode = integrationMode();
    if (mode === "fixture") {
      try {
        const parsed = parseAgencyReceipt(receipt);
        return { fiscalCode: `FISCAL_FX_${parsed.receiptClass}` };
      } catch {
        return { fiscalCode: "FISCAL_FX_0001" };
      }
    }
    const { base, key } = requireSandboxKeys();
    if (mode === "sandbox") {
      if (process.env.FDMS_SANDBOX_HTTP?.trim() === "1") {
        const res = await fetch(`${base.replace(/\/$/, "")}/v1/receipts`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(receipt),
        });
        if (!res.ok) throw new Error(`FDMS submitReceipt HTTP ${res.status}`);
        const data = (await res.json()) as { fiscalCode?: string };
        if (!data.fiscalCode) throw new Error("FDMS missing fiscalCode");
        return { fiscalCode: data.fiscalCode };
      }
      return sandboxSubmit(receipt);
    }
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/receipts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(receipt),
    });
    if (!res.ok) throw new Error(`FDMS submitReceipt HTTP ${res.status}`);
    const data = (await res.json()) as { fiscalCode?: string };
    if (!data.fiscalCode) throw new Error("FDMS missing fiscalCode");
    return { fiscalCode: data.fiscalCode };
  }

  async closeFiscalDay(): Promise<{ closedAt: string }> {
    const mode = integrationMode();
    if (mode === "fixture") {
      return { closedAt: new Date().toISOString() };
    }
    const { base, key } = requireSandboxKeys();
    if (mode === "sandbox") {
      if (process.env.FDMS_SANDBOX_HTTP?.trim() === "1") {
        const res = await fetch(`${base.replace(/\/$/, "")}/v1/fiscal-days/close`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deviceId: process.env.FDMS_DEVICE_ID }),
        });
        if (!res.ok) throw new Error(`FDMS closeDay HTTP ${res.status}`);
        const data = (await res.json()) as { closedAt?: string };
        const closedAt = data.closedAt ?? new Date().toISOString();
        const day = sandboxDayRef().current;
        if (day) day.closedAt = closedAt;
        return { closedAt };
      }
      return sandboxCloseDay();
    }
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/fiscal-days/close`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deviceId: process.env.FDMS_DEVICE_ID }),
    });
    if (!res.ok) throw new Error(`FDMS closeDay HTTP ${res.status}`);
    const data = (await res.json()) as { closedAt?: string };
    return { closedAt: data.closedAt ?? new Date().toISOString() };
  }
}

/** Optional CloudESD signer — never default Gateway (D-59). */
export interface FdmsSigner {
  signReceiptPayload(payload: unknown): Promise<{ signature: string }>;
}

export class CloudEsdSignerStub implements FdmsSigner {
  async signReceiptPayload(payload: unknown): Promise<{ signature: string }> {
    const body = JSON.stringify(payload ?? {});
    return { signature: `cloudesd_stub_${body.length}` };
  }
}

/**
 * Integration health ping (S123) — fixture opens a stub day; sandbox/live checks env only.
 * Never echoes activation keys. PD11 sandbox path is day+receipts, not this ping alone.
 */
export async function pingFdmsHealth(
  env: NodeJS.ProcessEnv = process.env,
): Promise<{
  ok: boolean;
  mode: IntegrationMode;
  baseUrl: boolean;
  deviceId: boolean;
  activationKey: boolean;
  fixtureDayId?: string;
  error?: string;
}> {
  const mode = integrationMode(env);
  const baseUrl = Boolean(env.FDMS_BASE_URL?.trim());
  const deviceId = Boolean(env.FDMS_DEVICE_ID?.trim());
  const activationKey = Boolean(env.FDMS_ACTIVATION_KEY?.trim());
  if (mode === "fixture") {
    const gw = new ZimraVirtualGatewayAdapter();
    const day = await gw.openFiscalDay();
    return {
      ok: true,
      mode,
      baseUrl,
      deviceId,
      activationKey,
      fixtureDayId: day.fiscalDayId,
    };
  }
  if (!baseUrl || !deviceId || !activationKey) {
    return {
      ok: false,
      mode,
      baseUrl,
      deviceId,
      activationKey,
      error: "FDMS_BASE_URL / DEVICE_ID / ACTIVATION_KEY unset — fail closed",
    };
  }
  return { ok: true, mode, baseUrl, deviceId, activationKey };
}
