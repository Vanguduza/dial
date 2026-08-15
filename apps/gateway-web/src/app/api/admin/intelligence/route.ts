/**
 * Admin Intelligence Factory (PD17 / D-54).
 * Shadow → Promptfoo → human promote. Fail closed without INTERNAL_API_SECRET.
 * No auto-publish. AI drafts never payable. Simulated never auto-pays.
 */
import { NextResponse } from "next/server";
import {
  attemptAutoPublishShadow,
  attemptCommandCentrePayout,
  createIntelligenceShadowRun,
  getIntelligenceFactorySnapshot,
  humanApproveShadowRun,
  promoteShadowRun,
  recordShadowPromptfooResult,
  rejectShadowRun,
} from "@dial/ai";

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
  return NextResponse.json({ snapshot: getIntelligenceFactorySnapshot() });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;

  const body = (await req.json()) as {
    action?: string;
    title?: string;
    draftBody?: string;
    kind?: "checklist" | "capability_prompt" | "guided_intake_eval";
    shadowId?: string;
    promptfooPassed?: boolean;
    reportId?: string;
    approver?: string;
    reason?: string;
  };

  try {
    if (body.action === "create_shadow") {
      if (!body.title || !body.draftBody) {
        return NextResponse.json(
          { error: "title and draftBody required" },
          { status: 400 },
        );
      }
      const createInput: Parameters<typeof createIntelligenceShadowRun>[0] = {
        title: body.title,
        body: body.draftBody,
      };
      if (body.kind) createInput.kind = body.kind;
      const run = createIntelligenceShadowRun(createInput);
      return NextResponse.json({
        ok: true,
        shadowId: run.shadowId,
        snapshot: getIntelligenceFactorySnapshot(),
      });
    }
    if (body.action === "promptfoo") {
      if (!body.shadowId || body.promptfooPassed === undefined) {
        return NextResponse.json(
          { error: "shadowId and promptfooPassed required" },
          { status: 400 },
        );
      }
      const pf: Parameters<typeof recordShadowPromptfooResult>[0] = {
        shadowId: body.shadowId,
        passed: body.promptfooPassed,
      };
      if (body.reportId) pf.reportId = body.reportId;
      recordShadowPromptfooResult(pf);
      return NextResponse.json({
        ok: true,
        snapshot: getIntelligenceFactorySnapshot(),
      });
    }
    if (body.action === "human_approve") {
      if (!body.shadowId || !body.approver) {
        return NextResponse.json(
          { error: "shadowId and approver required" },
          { status: 400 },
        );
      }
      humanApproveShadowRun({
        shadowId: body.shadowId,
        approver: body.approver,
      });
      return NextResponse.json({
        ok: true,
        snapshot: getIntelligenceFactorySnapshot(),
      });
    }
    if (body.action === "reject") {
      if (!body.shadowId) {
        return NextResponse.json({ error: "shadowId required" }, { status: 400 });
      }
      const rej: Parameters<typeof rejectShadowRun>[0] = {
        shadowId: body.shadowId,
      };
      if (body.reason) rej.reason = body.reason;
      rejectShadowRun(rej);
      return NextResponse.json({
        ok: true,
        snapshot: getIntelligenceFactorySnapshot(),
      });
    }
    if (body.action === "promote") {
      if (!body.shadowId) {
        return NextResponse.json({ error: "shadowId required" }, { status: 400 });
      }
      const out = promoteShadowRun(body.shadowId);
      return NextResponse.json({
        ok: true,
        datasetVersionId: out.dataset.versionId,
        snapshot: getIntelligenceFactorySnapshot(),
      });
    }
    if (body.action === "attempt_auto_publish") {
      try {
        attemptAutoPublishShadow(body.shadowId ?? "unknown");
      } catch (e) {
        return NextResponse.json({
          ok: false,
          blocked: true,
          error: e instanceof Error ? e.message : "auto_publish_blocked",
          snapshot: getIntelligenceFactorySnapshot(),
        });
      }
    }
    if (body.action === "attempt_simulated_payout") {
      try {
        attemptCommandCentrePayout({
          mode: "simulated",
          amountMinor: 1_00n,
        });
      } catch (e) {
        return NextResponse.json({
          ok: false,
          blocked: true,
          error: e instanceof Error ? e.message : "simulated_payout_blocked",
          snapshot: getIntelligenceFactorySnapshot(),
        });
      }
    }
    return NextResponse.json(
      {
        error:
          "action must be create_shadow|promptfoo|human_approve|reject|promote|attempt_auto_publish|attempt_simulated_payout",
      },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "intelligence factory failed" },
      { status: 400 },
    );
  }
}
