/**
 * Admin Projects client-visibility toggle (PD24 / Pack §9.5 / C-3 / §3.9).
 * Fail closed without INTERNAL_API_SECRET. Never writes payable amounts.
 */
import { NextResponse } from "next/server";
import {
  createInternalProjectDraft,
  getProjectsToggle,
  legalComplianceSnapshot,
  listInternalProjectDrafts,
  setProjectsClientVisibility,
  setProjectsLabourGates,
  type ProjectsClientVisibility,
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
  return NextResponse.json({
    toggle: getProjectsToggle(),
    clientSurface: legalComplianceSnapshot().clientSurface,
    internalProjects: listInternalProjectDrafts(),
    payableFromAi: false,
  });
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
    if (action === "set_gates") {
      const toggle = setProjectsLabourGates({
        labourLawReviewAck: Boolean(body.labourLawReviewAck),
        fundedWorkingCapitalAck: Boolean(body.fundedWorkingCapitalAck),
        setBy: String(body.setBy ?? "ops"),
      });
      return NextResponse.json({
        ok: true,
        toggle,
        clientSurface: legalComplianceSnapshot().clientSurface,
        internalProjects: listInternalProjectDrafts(),
      });
    }
    if (action === "set_visibility") {
      const visibility = String(body.visibility ?? "") as ProjectsClientVisibility;
      if (visibility !== "coming_soon" && visibility !== "live") {
        return NextResponse.json(
          { error: "visibility must be coming_soon|live" },
          { status: 400 },
        );
      }
      const toggle = setProjectsClientVisibility({
        visibility,
        setBy: String(body.setBy ?? "ops"),
        ...(typeof body.note === "string" ? { note: body.note } : {}),
      });
      return NextResponse.json({
        ok: true,
        toggle,
        clientSurface: legalComplianceSnapshot().clientSurface,
        internalProjects: listInternalProjectDrafts(),
        note: "Live gated on labour-law + working-capital acks (C-3/D-14)",
      });
    }
    if (action === "create_internal_draft") {
      const title = String(body.title ?? "");
      if (!title) {
        return NextResponse.json({ error: "title required" }, { status: 400 });
      }
      const draft = createInternalProjectDraft({
        title,
        createdBy: String(body.createdBy ?? "ops"),
      });
      return NextResponse.json({
        ok: true,
        draft,
        toggle: getProjectsToggle(),
        clientSurface: legalComplianceSnapshot().clientSurface,
        internalProjects: listInternalProjectDrafts(),
      });
    }
    return NextResponse.json(
      {
        error: "action must be set_gates|set_visibility|create_internal_draft",
      },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "projects failed" },
      { status: 400 },
    );
  }
}
