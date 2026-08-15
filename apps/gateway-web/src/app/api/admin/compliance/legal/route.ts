/**
 * Admin legal compliance hub (PD24 / Pack §9.5 / §3.8).
 * Fail closed without INTERNAL_API_SECRET. Never writes payable amounts.
 */
import { NextResponse } from "next/server";
import {
  acceptTermsVersion,
  legalComplianceSnapshot,
  publishTermsVersion,
  seedLegalEntityChecklist,
  type LegalEntityType,
  type TermsAcceptance,
  type TermsVersion,
} from "@dial/jobs";

export const runtime = "nodejs";

function assertInternalSecret(req: Request): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INTERNAL_API_SECRET unset — fail closed" },
      { status: 503 },
    );
  }
  if ((req.headers.get("x-internal-secret") ?? "") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  return NextResponse.json(legalComplianceSnapshot());
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json()) as Record<string, unknown>;
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected (D-47)" },
      { status: 400 },
    );
  }
  const action = String(body.action ?? "");
  try {
    if (action === "seed_checklist") {
      const entityType = String(body.entityType ?? "") as LegalEntityType;
      const entityId = String(body.entityId ?? "");
      if (!entityId || !["supplier", "technician", "fleet", "project"].includes(entityType)) {
        return NextResponse.json(
          { error: "entityType + entityId required" },
          { status: 400 },
        );
      }
      const checklist = seedLegalEntityChecklist({ entityType, entityId });
      return NextResponse.json({
        ok: true,
        checklist,
        snapshot: legalComplianceSnapshot(),
      });
    }
    if (action === "publish_terms") {
      const audience = String(body.audience ?? "") as TermsVersion["audience"];
      const title = String(body.title ?? "");
      const bodyRef = String(body.bodyRef ?? "");
      if (
        !title ||
        !bodyRef ||
        !["customer", "supplier", "technician", "mechanic_channel"].includes(
          audience,
        )
      ) {
        return NextResponse.json(
          { error: "audience, title, bodyRef required" },
          { status: 400 },
        );
      }
      const terms = publishTermsVersion({ audience, title, bodyRef });
      return NextResponse.json({
        ok: true,
        terms,
        snapshot: legalComplianceSnapshot(),
      });
    }
    if (action === "accept_terms") {
      const versionId = String(body.versionId ?? "");
      const partyId = String(body.partyId ?? "");
      const channel = String(
        body.channel ?? "admin",
      ) as TermsAcceptance["channel"];
      if (!versionId || !partyId) {
        return NextResponse.json(
          { error: "versionId + partyId required" },
          { status: 400 },
        );
      }
      const acceptance = acceptTermsVersion({ versionId, partyId, channel });
      return NextResponse.json({
        ok: true,
        acceptance,
        snapshot: legalComplianceSnapshot(),
        payableFromAi: false,
      });
    }
    return NextResponse.json(
      {
        error: "action must be seed_checklist|publish_terms|accept_terms",
      },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "legal hub failed" },
      { status: 400 },
    );
  }
}
