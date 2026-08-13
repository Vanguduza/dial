/**
 * WhatsApp Cloud API Graph client (D-40) — Pack §11 WhatsAppAdapter.
 * Official Graph only; no Baileys.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export type IntegrationMode = "fixture" | "sandbox" | "live";

export function integrationMode(
  env: NodeJS.ProcessEnv = process.env,
): IntegrationMode {
  const m = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (m === "sandbox" || m === "live") return m;
  return "fixture";
}

export interface WhatsAppCloudAdapter {
  sendUtilityTemplate(input: {
    toE164: string;
    templateName: string;
    language: string;
    components?: unknown;
  }): Promise<{ messageId: string }>;
  sendSessionText(input: {
    toE164: string;
    text: string;
  }): Promise<{ messageId: string }>;
}

function requireSecret(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} unset — fail closed`);
  return v;
}

function graphBase(): string {
  return "https://graph.facebook.com/v21.0";
}

export class MetaCloudApiAdapter implements WhatsAppCloudAdapter {
  async sendUtilityTemplate(input: {
    toE164: string;
    templateName: string;
    language: string;
    components?: unknown;
  }): Promise<{ messageId: string }> {
    if (integrationMode() === "fixture") {
      return { messageId: `wamid.fx_tpl_${input.templateName}` };
    }
    const token = requireSecret("WHATSAPP_TOKEN");
    const phoneId = requireSecret("WHATSAPP_PHONE_NUMBER_ID");
    const body: Record<string, unknown> = {
      messaging_product: "whatsapp",
      to: input.toE164.replace(/^\+/, ""),
      type: "template",
      template: {
        name: input.templateName,
        language: { code: input.language },
        ...(input.components !== undefined
          ? { components: input.components }
          : {}),
      },
    };
    const res = await fetch(`${graphBase()}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`WA template HTTP ${res.status}`);
    const data = (await res.json()) as {
      messages?: Array<{ id?: string }>;
    };
    return { messageId: data.messages?.[0]?.id ?? "unknown" };
  }

  /** Send using registry key — resolves env-approved name when present. */
  async sendRegisteredTemplate(input: {
    toE164: string;
    key: import("./templateRegistry.js").WaTemplateKey;
    components?: unknown;
  }): Promise<{ messageId: string; binding: import("./templateRegistry.js").WaTemplateBinding }> {
    const { resolveWaTemplate } = await import("./templateRegistry.js");
    const binding = resolveWaTemplate(input.key);
    const sent = await this.sendUtilityTemplate({
      toE164: input.toE164,
      templateName: binding.templateName,
      language: binding.language,
      ...(input.components !== undefined
        ? { components: input.components }
        : {}),
    });
    return { messageId: sent.messageId, binding };
  }

  async sendSessionText(input: {
    toE164: string;
    text: string;
  }): Promise<{ messageId: string }> {
    if (integrationMode() === "fixture") {
      return { messageId: `wamid.fx_txt_${input.text.length}` };
    }
    const token = requireSecret("WHATSAPP_TOKEN");
    const phoneId = requireSecret("WHATSAPP_PHONE_NUMBER_ID");
    const res = await fetch(`${graphBase()}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.toE164.replace(/^\+/, ""),
        type: "text",
        text: { body: input.text },
      }),
    });
    if (!res.ok) throw new Error(`WA text HTTP ${res.status}`);
    const data = (await res.json()) as {
      messages?: Array<{ id?: string }>;
    };
    return { messageId: data.messages?.[0]?.id ?? "unknown" };
  }
}

/** Meta webhook challenge (GET) — Pack §6.7 WHATSAPP_VERIFY_TOKEN. */
export function verifyWebhookChallenge(input: {
  mode: string | null;
  token: string | null;
  challenge: string | null;
  verifyToken?: string;
}): { ok: true; challenge: string } | { ok: false } {
  const expected =
    input.verifyToken ?? process.env.WHATSAPP_VERIFY_TOKEN?.trim() ?? "";
  if (
    input.mode === "subscribe" &&
    expected &&
    input.token === expected &&
    input.challenge
  ) {
    return { ok: true, challenge: input.challenge };
  }
  return { ok: false };
}

/** Resolve app secret — Pack name preferred; alias legacy META_WA_APP_SECRET. */
export function resolveWhatsAppAppSecret(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return (
    env.WHATSAPP_APP_SECRET?.trim() ||
    env.META_WA_APP_SECRET?.trim() ||
    undefined
  );
}

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
