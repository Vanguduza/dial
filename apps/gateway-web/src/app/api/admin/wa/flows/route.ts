/**
 * Admin WA Flows sandbox status / thin-vertical probe (PD12 / D-40).
 * Fail closed without INTERNAL_API_SECRET. Official Cloud API only.
 */
import { NextResponse } from "next/server";
import {
  listWaFlowRegistry,
  listWaSandboxOutbound,
  listWaTemplateRegistry,
  pingWhatsAppHealth,
  runPd12WaFlowsSandboxThinVertical,
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
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as {
    action?: "thin_vertical";
  };
  if (body.action !== "thin_vertical") {
    return NextResponse.json(
      { error: "action must be thin_vertical" },
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

  try {
    const result = await runPd12WaFlowsSandboxThinVertical();
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "thin_vertical failed" },
      { status: 400 },
    );
  }
}
