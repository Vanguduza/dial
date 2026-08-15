/**
 * PD113 — Formbricks survey + PostHog flag stubs (T8).
 * Session SoR; fail-closed without keys; never money.
 */
import { NextResponse } from "next/server";
import {
  evaluatePostHogFlag,
  queueFormbricksSurvey,
  runPd113FormbricksPosthogStubThinVertical,
} from "@dial/shared";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
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
    return NextResponse.json({ error: `unknown action ${action}` }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "experience stub failed" },
      { status: 400 },
    );
  }
}
