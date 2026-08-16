/**
 * Admin WA Flows sandbox status / thin-vertical probe (PD12 / PD40 / D-40).
 * Fail closed without INTERNAL_API_SECRET. Official Cloud API only.
 */
import { NextResponse } from "next/server";
import {
  listWaFlowRegistry,
  listWaSandboxOutbound,
  listWaTemplateRegistry,
  MetaCloudApiAdapter,
  pingWhatsAppHealth,
  runG9WaFlowsSandboxEvidence,
  runPd40WaTemplateRegistryThinVertical,
  type WaTemplateKey,
} from "@dial/adapter-whatsapp";
import { integrationMode } from "@dial/queues";

export const runtime = "nodejs";

function assertInternalSecret(req: Request): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INTERNAL_API_SECRET unset — fail closed" },
      { status: 503 },
    );
  }
  const header = req.headers.get("x-internal-secret") ?? "";
  if (header !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const health = await pingWhatsAppHealth();
  return NextResponse.json({
    mode: integrationMode(),
    health,
    flows: listWaFlowRegistry(),
    templates: listWaTemplateRegistry(),
    sandboxOutbound: listWaSandboxOutbound(),
    liquorFlows: false,
    baileysForbidden: true,
    payableFromAi: false,
    pd40: runPd40WaTemplateRegistryThinVertical(),
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as {
    action?: "thin_vertical" | "send_sandbox_template";
    templateKey?: string;
    toE164?: string;
    userId?: unknown;
    role?: unknown;
  };
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected (D-47)" },
      { status: 400 },
    );
  }

  if (body.action === "send_sandbox_template") {
    const key = (body.templateKey ?? "SPARE_ORDER_CONFIRMED") as WaTemplateKey;
    const toE164 = body.toE164 ?? "+263771234567";
    try {
      const sent = await new MetaCloudApiAdapter().sendRegisteredTemplate({
        toE164,
        key,
      });
      return NextResponse.json({
        ok: true,
        messageId: sent.messageId,
        binding: sent.binding,
        payableFromAi: false,
        note: "PD40 sandbox/fixture template send — no payable amounts",
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "template send failed" },
        { status: 400 },
      );
    }
  }

  if (body.action !== "thin_vertical") {
    return NextResponse.json(
      { error: "action must be thin_vertical|send_sandbox_template" },
      { status: 400 },
    );
  }

  const mode = (process.env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (mode !== "sandbox") {
    return NextResponse.json(
      { error: "thin_vertical requires DIAL_INTEGRATION_MODE=sandbox" },
      { status: 400 },
    );
  }
  if (
    !process.env.WHATSAPP_TOKEN?.trim() ||
    !process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  ) {
    return NextResponse.json(
      { error: "WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID required" },
      { status: 503 },
    );
  }
  if (
    !process.env.ECOCASH_API_KEY?.trim() ||
    !process.env.ECOCASH_MERCHANT_CODE?.trim()
  ) {
    return NextResponse.json(
      { error: "ECOCASH_API_KEY + ECOCASH_MERCHANT_CODE required for Spare EcoCash" },
      { status: 503 },
    );
  }
  // Sandbox settlement writes journals durably; without a store the rail would
  // only look green in memory, which is exactly what the anti-stub rule forbids.
  const durableUrl = (
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ""
  ).trim();
  const durableKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    ""
  ).trim();
  if (!durableUrl || !durableKey) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_URL + service role/anon key required — sandbox settlement must be durable",
      },
      { status: 503 },
    );
  }

  try {
    const result = await runG9WaFlowsSandboxEvidence();
    return NextResponse.json({ ok: true, result, g9Claimed: false });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "thin_vertical failed" },
      { status: 400 },
    );
  }
}
