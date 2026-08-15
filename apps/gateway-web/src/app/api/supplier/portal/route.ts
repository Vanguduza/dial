/**
 * PD6 supplier APIs — session SoR; never trust body userId/role (D-47).
 * Domain SoR = @dial/suppliers (not Mercur). Accepts JSON or form posts from /supplier UI.
 */
import { NextResponse } from "next/server";
import {
  addStatementLine,
  ackSlaEscalation,
  confirmOrder,
  enqueueConfirmOrder,
  evaluateHeartbeatSla,
  getSupplier,
  listConfirmQueue,
  listCostUploads,
  listHeartbeats,
  listSlaEscalations,
  listStatements,
  onboardSupplier,
  postHeartbeat,
  syncSupplierSlaEscalations,
  uploadSupplierCosts,
  uploadSupplierStock,
  listStockUploads,
  type SupplierTier,
} from "@dial/suppliers";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

function sessionOr401(req: Request) {
  return getSessionFromToken(parseSessionCookie(req.headers.get("cookie")));
}

function supplierIdFromSession(email: string): string {
  return `sup_${email.split("@")[0]!.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
}

const TIERS = new Set(["bronze", "silver", "gold", "platinum"]);

async function parseAction(req: Request): Promise<{
  action: string;
  fields: Record<string, string>;
  rejectedIdentity: boolean;
  rows?: Array<{
    sku: string;
    title: string;
    costUsdMinor: string;
    unitPriceUsdMinor?: string;
    qty: string;
  }>;
}> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await req.json()) as Record<string, unknown>;
    if (body.userId !== undefined || body.role !== undefined) {
      return { action: "", fields: {}, rejectedIdentity: true };
    }
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries(body)) {
      if (k === "rows" || k === "action") continue;
      if (v !== undefined && v !== null) fields[k] = String(v);
    }
    const base = {
      action: String(body.action ?? ""),
      fields,
      rejectedIdentity: false as const,
    };
    if (Array.isArray(body.rows)) {
      return {
        ...base,
        rows: (body.rows as Array<Record<string, unknown>>).map((r) => ({
          sku: String(r.sku ?? ""),
          title: String(r.title ?? ""),
          costUsdMinor: String(r.costUsdMinor ?? r.unitPriceUsdMinor ?? "0"),
          unitPriceUsdMinor: String(r.unitPriceUsdMinor ?? r.costUsdMinor ?? "0"),
          qty: String(r.qty ?? "1"),
        })),
      };
    }
    return base;
  }

  const form = await req.formData();
  if (form.has("userId") || form.has("role")) {
    return { action: "", fields: {}, rejectedIdentity: true };
  }
  const fields: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (k === "action") continue;
    fields[k] = String(v);
  }
  const action = String(form.get("action") ?? "");
  if (action === "upload_costs" && fields.sku) {
    return {
      action,
      fields,
      rejectedIdentity: false,
      rows: [
        {
          sku: fields.sku,
          title: fields.title ?? "",
          costUsdMinor: fields.costUsdMinor ?? "0",
          qty: fields.qty ?? "1",
        },
      ],
    };
  }
  return { action, fields, rejectedIdentity: false };
}

function redirectSupplier(req: Request, hash = ""): NextResponse {
  const base = new URL(req.url);
  return NextResponse.redirect(new URL(`/supplier${hash}`, base.origin), 303);
}

export async function GET(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  if (url.searchParams.has("userId") || url.searchParams.has("role")) {
    return NextResponse.json(
      { error: "role/userId from query rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  const supplierId = supplierIdFromSession(session.email);
  const profile = getSupplier(supplierId);
  if (profile) {
    syncSupplierSlaEscalations(supplierId);
  }
  const heartbeatSla = profile
    ? evaluateHeartbeatSla(supplierId)
    : null;
  return NextResponse.json({
    supplierId,
    profile: profile ?? null,
    heartbeatSla,
    escalations: listSlaEscalations(supplierId),
    heartbeats: listHeartbeats(supplierId),
    confirmQueue: listConfirmQueue(supplierId).map((o) => ({
      ...o,
      amountUsdMinor: o.amountUsdMinor.toString(),
      slaRemainingMs: Math.max(0, o.slaDeadlineAt - Date.now()),
    })),
    uploads: listCostUploads(supplierId).map((b) => ({
      ...b,
      rows: b.rows.map((r) => ({
        ...r,
        costUsdMinor: r.costUsdMinor.toString(),
      })),
    })),
    statements: listStatements(supplierId).map((l) => ({
      lineId: l.lineId,
      kind: l.kind,
      label: l.label,
      amountUsdMinor: l.amount.amountMinor.toString(),
      currency: l.amount.currency,
      createdAt: l.createdAt,
    })),
    payableFromAi: false,
  });
}

export async function POST(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = await parseAction(req);
  if (parsed.rejectedIdentity) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }

  const supplierId = supplierIdFromSession(session.email);
  const wantsHtml = !(req.headers.get("content-type") ?? "").includes(
    "application/json",
  );

  try {
    switch (parsed.action) {
      case "onboard": {
        const tierRaw = parsed.fields.tier ?? "bronze";
        const tier = (TIERS.has(tierRaw) ? tierRaw : "bronze") as SupplierTier;
        const profile = onboardSupplier({
          supplierId,
          displayName: parsed.fields.displayName ?? session.email,
          formality:
            parsed.fields.formality === "informal" ? "informal" : "formal",
          tier,
        });
        if (wantsHtml) return redirectSupplier(req, "#onboard");
        return NextResponse.json({ ok: true, profile });
      }
      case "upload_costs": {
        const rows = parsed.rows ?? [];
        const batch = uploadSupplierCosts({
          supplierId,
          rows: rows.map((r) => ({
            sku: r.sku,
            title: r.title,
            costUsdMinor: BigInt(r.costUsdMinor),
            qty: Number(r.qty) || 1,
          })),
        });
        if (wantsHtml) return redirectSupplier(req, "#costs");
        return NextResponse.json({
          ok: true,
          batchId: batch.batchId,
          currency: batch.currency,
          rowCount: batch.rows.length,
        });
      }
      case "upload_stock": {
        const rows = parsed.rows ?? [];
        const batch = uploadSupplierStock({
          supplierId,
          rows: rows.map((r) => ({
            sku: r.sku,
            title: r.title,
            qty: Number(r.qty) || 1,
            unitPriceUsdMinor: BigInt(
              r.unitPriceUsdMinor ?? r.costUsdMinor ?? "0",
            ),
          })),
        });
        if (wantsHtml) return redirectSupplier(req, "#stock");
        return NextResponse.json({
          ok: true,
          batchId: batch.batchId,
          status: batch.status,
          currency: batch.currency,
          rowCount: batch.rows.length,
          stockUploads: listStockUploads(supplierId).map((b) => ({
            batchId: b.batchId,
            status: b.status,
            rowCount: b.rows.length,
          })),
          payableFromAi: false,
          note: "PD84 — stock upload pending_review (agency MARKETPLACE)",
        });
      }
      case "heartbeat": {
        const hb = postHeartbeat({
          supplierId,
          channel:
            parsed.fields.channel === "whatsapp" ? "whatsapp" : "dashboard",
          note: parsed.fields.note ?? "ok",
        });
        syncSupplierSlaEscalations(supplierId);
        if (wantsHtml) return redirectSupplier(req, "#heartbeat");
        return NextResponse.json({
          ok: true,
          heartbeat: hb,
          heartbeatSla: evaluateHeartbeatSla(supplierId),
        });
      }
      case "sync_sla": {
        const opened = syncSupplierSlaEscalations(supplierId);
        if (wantsHtml) return redirectSupplier(req, "#sla");
        return NextResponse.json({
          ok: true,
          opened,
          heartbeatSla: evaluateHeartbeatSla(supplierId),
          escalations: listSlaEscalations(supplierId),
          payableFromAi: false,
        });
      }
      case "ack_escalation": {
        const esc = ackSlaEscalation({
          supplierId,
          escalationId: parsed.fields.escalationId ?? "",
        });
        if (wantsHtml) return redirectSupplier(req, "#sla");
        return NextResponse.json({ ok: true, escalation: esc });
      }
      case "enqueue_confirm": {
        const order = enqueueConfirmOrder({
          supplierId,
          amountUsdMinor: BigInt(parsed.fields.amountUsdMinor || "0"),
          ...(parsed.fields.slaMs
            ? { slaMs: Number(parsed.fields.slaMs) }
            : {}),
        });
        if (wantsHtml) return redirectSupplier(req, "#confirm");
        return NextResponse.json({
          ok: true,
          order: {
            ...order,
            amountUsdMinor: order.amountUsdMinor.toString(),
          },
        });
      }
      case "confirm_order": {
        const order = confirmOrder({
          supplierId,
          orderId: parsed.fields.orderId ?? "",
        });
        if (wantsHtml) return redirectSupplier(req, "#confirm");
        return NextResponse.json({
          ok: true,
          order: {
            ...order,
            amountUsdMinor: order.amountUsdMinor.toString(),
          },
        });
      }
      case "add_statement": {
        const kind = parsed.fields.kind;
        const line = addStatementLine({
          supplierId,
          kind:
            kind === "bond" || kind === "coop_spend" ? kind : "settlement",
          amountUsdMinor: BigInt(parsed.fields.amountUsdMinor || "0"),
          label: parsed.fields.label ?? "line",
        });
        if (wantsHtml) return redirectSupplier(req, "#statements");
        return NextResponse.json({
          ok: true,
          line: {
            lineId: line.lineId,
            kind: line.kind,
            amountUsdMinor: line.amount.amountMinor.toString(),
          },
        });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action ${parsed.action}` },
          { status: 400 },
        );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "supplier action failed";
    if (wantsHtml) {
      const base = new URL(req.url);
      return NextResponse.redirect(
        new URL(`/supplier?error=${encodeURIComponent(msg)}`, base.origin),
        303,
      );
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
