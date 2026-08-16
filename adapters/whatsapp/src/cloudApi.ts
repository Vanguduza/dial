/**
 * WhatsApp Cloud API Graph client (D-40 / PD12) — Pack §11 WhatsAppAdapter.
 * Official Graph only; no Baileys.
 * Sandbox = keys required + inline Graph sandbox (unless WA_SANDBOX_HTTP=1).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { resolveWaFlow, type WaFlowKey } from "./flowRegistry.js";
import type { WaTemplateKey } from "./templateRegistry.js";

export type IntegrationMode = "fixture" | "sandbox" | "live";

export function integrationMode(
  env: NodeJS.ProcessEnv = process.env,
): IntegrationMode {
  const m = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (m === "sandbox" || m === "live") return m;
  return "fixture";
}

export type InteractiveButton = { id: string; title: string };

export type SandboxOutboundMessage = {
  messageId: string;
  kind: "template" | "text" | "buttons" | "flow";
  toE164: string;
  at: string;
  detail: Record<string, unknown>;
};

type SandboxBus = {
  sent: SandboxOutboundMessage[];
  /** Phone (digits) → Flow session id for inbound button routing. */
  sessionByPhone: Map<string, string>;
  seq: number;
};

function sandboxBus(): SandboxBus {
  const g = globalThis as { __dialWaSandboxBus?: SandboxBus };
  if (!g.__dialWaSandboxBus) {
    g.__dialWaSandboxBus = {
      sent: [],
      sessionByPhone: new Map(),
      seq: 0,
    };
  }
  return g.__dialWaSandboxBus;
}

export function __resetWaCloudSandboxForTests(): void {
  const bus = sandboxBus();
  bus.sent.length = 0;
  bus.sessionByPhone.clear();
  bus.seq = 0;
}

export function listWaSandboxOutbound(): SandboxOutboundMessage[] {
  return sandboxBus().sent.map((m) => ({ ...m, detail: { ...m.detail } }));
}

export function bindWaSessionPhone(toE164: string, sessionId: string): void {
  const digits = toE164.replace(/^\+/, "");
  sandboxBus().sessionByPhone.set(digits, sessionId);
}

export function resolveWaSessionByPhone(fromE164: string): string | undefined {
  return sandboxBus().sessionByPhone.get(fromE164.replace(/^\+/, ""));
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
  sendInteractiveButtons(input: {
    toE164: string;
    bodyText: string;
    buttons: InteractiveButton[];
  }): Promise<{ messageId: string }>;
  sendFlowMessage(input: {
    toE164: string;
    flowKey: WaFlowKey;
    bodyText: string;
    flowToken: string;
    cta?: string;
  }): Promise<{ messageId: string; flowId: string }>;
  /**
   * Mark inbound message as read (Graph messages status=read).
   * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/mark-message-as-read
   */
  markMessageRead(input: { messageId: string }): Promise<{ ok: true }>;
}

function requireSecret(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} unset — fail closed`);
  return v;
}

function requireSandboxKeys(): { token: string; phoneId: string } {
  return {
    token: requireSecret("WHATSAPP_TOKEN"),
    phoneId: requireSecret("WHATSAPP_PHONE_NUMBER_ID"),
  };
}

function graphBase(): string {
  return "https://graph.facebook.com/v21.0";
}

function useHttpSandbox(): boolean {
  return process.env.WA_SANDBOX_HTTP?.trim() === "1";
}

function nextSandboxMessageId(kind: string): string {
  const bus = sandboxBus();
  bus.seq += 1;
  return `wamid.sb_${kind}_${bus.seq}`;
}

function recordSandbox(msg: SandboxOutboundMessage): void {
  sandboxBus().sent.push(msg);
}

export class MetaCloudApiAdapter implements WhatsAppCloudAdapter {
  async sendUtilityTemplate(input: {
    toE164: string;
    templateName: string;
    language: string;
    components?: unknown;
  }): Promise<{ messageId: string }> {
    const mode = integrationMode();
    if (mode === "fixture") {
      return { messageId: `wamid.fx_tpl_${input.templateName}` };
    }
    if (mode === "sandbox" && !useHttpSandbox()) {
      requireSandboxKeys();
      const messageId = nextSandboxMessageId("tpl");
      recordSandbox({
        messageId,
        kind: "template",
        toE164: input.toE164,
        at: new Date().toISOString(),
        detail: {
          templateName: input.templateName,
          language: input.language,
        },
      });
      return { messageId };
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
    key: WaTemplateKey;
    components?: unknown;
  }): Promise<{
    messageId: string;
    binding: import("./templateRegistry.js").WaTemplateBinding;
  }> {
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
    const mode = integrationMode();
    if (mode === "fixture") {
      return { messageId: `wamid.fx_txt_${input.text.length}` };
    }
    if (mode === "sandbox" && !useHttpSandbox()) {
      requireSandboxKeys();
      const messageId = nextSandboxMessageId("txt");
      recordSandbox({
        messageId,
        kind: "text",
        toE164: input.toE164,
        at: new Date().toISOString(),
        detail: { text: input.text },
      });
      return { messageId };
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

  /**
   * D-57 checkout CTAs — Cloud API reply buttons (max 3).
   * EcoCash | COD | Paynow — never free-text-only for EcoCash/COD.
   */
  async sendInteractiveButtons(input: {
    toE164: string;
    bodyText: string;
    buttons: InteractiveButton[];
  }): Promise<{ messageId: string }> {
    if (input.buttons.length < 1 || input.buttons.length > 3) {
      throw new Error("WA interactive buttons require 1–3 entries");
    }
    for (const b of input.buttons) {
      if (!b.id || !b.title || b.title.length > 20) {
        throw new Error("WA button id/title invalid (title max 20)");
      }
    }
    const mode = integrationMode();
    if (mode === "fixture") {
      return { messageId: `wamid.fx_btn_${input.buttons.map((b) => b.id).join("_")}` };
    }
    const payload = {
      messaging_product: "whatsapp",
      to: input.toE164.replace(/^\+/, ""),
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: input.bodyText },
        action: {
          buttons: input.buttons.map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    };
    if (mode === "sandbox" && !useHttpSandbox()) {
      requireSandboxKeys();
      const messageId = nextSandboxMessageId("btn");
      recordSandbox({
        messageId,
        kind: "buttons",
        toE164: input.toE164,
        at: new Date().toISOString(),
        detail: {
          bodyText: input.bodyText,
          buttons: input.buttons,
        },
      });
      return { messageId };
    }
    const token = requireSecret("WHATSAPP_TOKEN");
    const phoneId = requireSecret("WHATSAPP_PHONE_NUMBER_ID");
    const res = await fetch(`${graphBase()}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`WA buttons HTTP ${res.status}`);
    const data = (await res.json()) as {
      messages?: Array<{ id?: string }>;
    };
    return { messageId: data.messages?.[0]?.id ?? "unknown" };
  }

  /** Official Cloud API Flow message (PD12) — registered Flow ID from registry. */
  async sendFlowMessage(input: {
    toE164: string;
    flowKey: WaFlowKey;
    bodyText: string;
    flowToken: string;
    cta?: string;
  }): Promise<{ messageId: string; flowId: string }> {
    const binding = resolveWaFlow(input.flowKey);
    const mode = integrationMode();
    if (mode === "fixture") {
      return {
        messageId: `wamid.fx_flow_${binding.flowId}`,
        flowId: binding.flowId,
      };
    }
    const payload = {
      messaging_product: "whatsapp",
      to: input.toE164.replace(/^\+/, ""),
      type: "interactive",
      interactive: {
        type: "flow",
        body: { text: input.bodyText },
        action: {
          name: "flow",
          parameters: {
            flow_message_version: "3",
            flow_token: input.flowToken,
            flow_id: binding.flowId,
            flow_cta: input.cta ?? "Continue",
            flow_action: "navigate",
          },
        },
      },
    };
    if (mode === "sandbox" && !useHttpSandbox()) {
      requireSandboxKeys();
      const messageId = nextSandboxMessageId("flow");
      recordSandbox({
        messageId,
        kind: "flow",
        toE164: input.toE164,
        at: new Date().toISOString(),
        detail: {
          flowKey: input.flowKey,
          flowId: binding.flowId,
          flowToken: input.flowToken,
          bodyText: input.bodyText,
        },
      });
      return { messageId, flowId: binding.flowId };
    }
    const token = requireSecret("WHATSAPP_TOKEN");
    const phoneId = requireSecret("WHATSAPP_PHONE_NUMBER_ID");
    const res = await fetch(`${graphBase()}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`WA flow HTTP ${res.status}`);
    const data = (await res.json()) as {
      messages?: Array<{ id?: string }>;
    };
    return {
      messageId: data.messages?.[0]?.id ?? "unknown",
      flowId: binding.flowId,
    };
  }

  async markMessageRead(input: {
    messageId: string;
  }): Promise<{ ok: true }> {
    if (!input.messageId.trim()) {
      throw new Error("messageId required");
    }
    const mode = integrationMode();
    if (mode === "fixture") {
      return { ok: true };
    }
    if (mode === "sandbox" && !useHttpSandbox()) {
      requireSandboxKeys();
      return { ok: true };
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
        status: "read",
        message_id: input.messageId,
      }),
    });
    if (!res.ok) throw new Error(`WA mark-read HTTP ${res.status}`);
    return { ok: true };
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

/** S129 — Cloud API env readiness; never echoes secrets (D-47). */
export async function pingWhatsAppHealth(
  env: NodeJS.ProcessEnv = process.env,
): Promise<{
  ok: boolean;
  mode: IntegrationMode;
  token: boolean;
  phoneNumberId: boolean;
  appSecret: boolean;
  verifyToken: boolean;
  error?: string;
}> {
  const mode = integrationMode(env);
  const token = Boolean(env.WHATSAPP_TOKEN?.trim());
  const phoneNumberId = Boolean(env.WHATSAPP_PHONE_NUMBER_ID?.trim());
  const appSecret = Boolean(resolveWhatsAppAppSecret(env));
  const verifyToken = Boolean(env.WHATSAPP_VERIFY_TOKEN?.trim());
  if (mode === "fixture") {
    return {
      ok: true,
      mode,
      token: true,
      phoneNumberId: true,
      appSecret: true,
      verifyToken: true,
    };
  }
  if (!token || !phoneNumberId || !appSecret || !verifyToken) {
    return {
      ok: false,
      mode,
      token,
      phoneNumberId,
      appSecret,
      verifyToken,
      error: "WHATSAPP_* unset — fail closed",
    };
  }
  return { ok: true, mode, token, phoneNumberId, appSecret, verifyToken };
}

/** Extract interactive button / Flow nfm reply from Meta webhook payload. */
export function parseWaInboundInteractive(body: unknown): {
  fromE164: string;
  kind: "button_reply" | "nfm_reply";
  buttonId?: string;
  flowToken?: string;
  rawResponse?: string;
} | null {
  if (!body || typeof body !== "object") return null;
  const root = body as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: Array<{
            from?: string;
            type?: string;
            interactive?: {
              type?: string;
              button_reply?: { id?: string };
              nfm_reply?: { response_json?: string; name?: string };
            };
          }>;
        };
      }>;
    }>;
  };
  const msg = root.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg?.from || msg.type !== "interactive" || !msg.interactive) return null;
  const fromE164 = msg.from.startsWith("+") ? msg.from : `+${msg.from}`;
  if (msg.interactive.type === "button_reply" && msg.interactive.button_reply?.id) {
    return {
      fromE164,
      kind: "button_reply",
      buttonId: msg.interactive.button_reply.id,
    };
  }
  if (msg.interactive.type === "nfm_reply") {
    const out: {
      fromE164: string;
      kind: "nfm_reply";
      flowToken?: string;
      rawResponse?: string;
    } = {
      fromE164,
      kind: "nfm_reply",
    };
    if (msg.interactive.nfm_reply?.name !== undefined) {
      out.flowToken = msg.interactive.nfm_reply.name;
    }
    if (msg.interactive.nfm_reply?.response_json !== undefined) {
      out.rawResponse = msg.interactive.nfm_reply.response_json;
    }
    return out;
  }
  return null;
}
