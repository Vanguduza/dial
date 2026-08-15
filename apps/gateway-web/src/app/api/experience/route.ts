/**
 * PD113 / PD117 / PD118 — Formbricks, PostHog, Realtime stubs + FLOW_CSAT.
 * Session SoR; fail-closed without keys; never money.
 */
import { NextResponse } from "next/server";
import {
  evaluatePostHogFlag,
  queueFormbricksSurvey,
  queueLangfuseTrace,
  recordCsatScore,
  runPd113FormbricksPosthogStubThinVertical,
  runPd117RealtimeStatusStubThinVertical,
  runPd118CsatFlowThinVertical,
  runPd130LangfuseTraceStubThinVertical,
  subscribeRealtimeStatusChannel,
} from "@dial/shared";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../lib/auth/session";

export const runtime = "nodejs";

export async function GET(req?: Request) {
  const url = req ? new URL(req.url) : null;
  const view = url?.searchParams.get("view") ?? "pd113";
  if (view === "pd117") {
    const thin = runPd117RealtimeStatusStubThinVertical();
    return NextResponse.json({
      ok: true,
      thin,
      note: "PD117 — Realtime status stub; fail-closed",
    });
  }
  if (view === "pd118") {
    const thin = runPd118CsatFlowThinVertical();
    return NextResponse.json({
      ok: true,
      thin,
      note: "PD118 — FLOW_CSAT ERP score",
    });
  }
  if (view === "pd130") {
    const thin = runPd130LangfuseTraceStubThinVertical();
    return NextResponse.json({
      ok: true,
      thin,
      note: "PD130 — Langfuse trace stub; fail-closed",
    });
  }
  const thin = runPd113FormbricksPosthogStubThinVertical();
  return NextResponse.json({
    ok: true,
    thin,
    note: "PD113 — Formbricks + PostHog T8 stubs; fail-closed",
  });
}

export async function POST(req: Request) {
  const session = getSessionFromToken(
    parseSessionCookie(req.headers.get("cookie")),
  );
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    surveyId?: string;
    jobId?: string;
    orderId?: string;
    flagKey?: string;
    channel?: string;
    score?: number;
    comment?: string;
    userId?: string;
    role?: string;
  };
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  const action = String(body.action ?? "");
  try {
    if (action === "queue_survey") {
      const out = queueFormbricksSurvey({
        surveyId: String(body.surveyId ?? "csat_post_job"),
        ...(body.jobId != null ? { jobId: String(body.jobId) } : {}),
        ...(body.orderId != null ? { orderId: String(body.orderId) } : {}),
      });
      return NextResponse.json({
        ok: true,
        survey: out,
        note: "PD113 — Formbricks stub; ERP/job SoR",
      });
    }
    if (action === "evaluate_flag") {
      const out = evaluatePostHogFlag({
        flagKey: String(body.flagKey ?? "staff_dogfood"),
      });
      return NextResponse.json({
        ok: true,
        flag: out,
        note: "PD113 — PostHog stub; not money / pricing authority",
      });
    }
    if (action === "subscribe_realtime") {
      const out = subscribeRealtimeStatusChannel({
        channel: String(body.channel ?? "run:status"),
      });
      return NextResponse.json({
        ok: true,
        subscription: out,
        note: "PD117 — Realtime stub; MapLibre map SoR; read-only",
      });
    }
    if (action === "record_csat") {
      const out = recordCsatScore({
        score: Number(body.score),
        ...(body.comment != null ? { comment: String(body.comment) } : {}),
        ...(body.orderId != null ? { orderId: String(body.orderId) } : {}),
        ...(body.jobId != null ? { jobId: String(body.jobId) } : {}),
      });
      return NextResponse.json({
        ok: true,
        csat: out,
        note: "PD118 — FLOW_CSAT; ERP score SoR; not payable",
      });
    }
    if (action === "queue_langfuse_trace") {
      const out = queueLangfuseTrace({
        name: String(body.surveyId ?? body.flagKey ?? "ai.invocation"),
      });
      return NextResponse.json({
        ok: true,
        trace: out,
        note: "PD130 — Langfuse stub; not money; fail-closed without keys",
      });
    }
    return NextResponse.json({ error: `unknown action ${action}` }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "experience stub failed" },
      { status: 400 },
    );
  }
}
