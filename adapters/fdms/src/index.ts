/**
 * In-house ZIMRA Virtual Gateway client (D-40a / D-59).
 * Field map may refine when ENH-022 credentials land — shapes match Pack §11.
 */
export type IntegrationMode = "fixture" | "sandbox" | "live";

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

export class ZimraVirtualGatewayAdapter implements FdmsAdapter {
  async openFiscalDay(): Promise<{ fiscalDayId: string }> {
    if (integrationMode() === "fixture") {
      return { fiscalDayId: "fd_fx_open" };
    }
    const base = requireSecret("FDMS_BASE_URL");
    const deviceId = requireSecret("FDMS_DEVICE_ID");
    const key = requireSecret("FDMS_ACTIVATION_KEY");
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
    if (integrationMode() === "fixture") {
      return { fiscalCode: "FISCAL_FX_0001" };
    }
    const base = requireSecret("FDMS_BASE_URL");
    const key = requireSecret("FDMS_ACTIVATION_KEY");
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
    if (integrationMode() === "fixture") {
      return { closedAt: new Date().toISOString() };
    }
    const base = requireSecret("FDMS_BASE_URL");
    const key = requireSecret("FDMS_ACTIVATION_KEY");
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
 * Never echoes activation keys.
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
