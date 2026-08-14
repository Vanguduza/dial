/**
 * PD9 technician API — wraps @dial/jobs SoR (Cal.com slots, checklist, evidence).
 * Session SoR; never body userId/role (D-47). Take-Home uses @dial/payments WHT (D-50).
 */
import { NextResponse } from "next/server";
import {
  advanceChecklistStep,
  assignJobToTechnician,
  bookTechJob,
  draftTechQuote,
  getChecklist,
  getChecklistRun,
  getTechJob,
  listBookingSlots,
  listChecklists,
  listEvidenceForJob,
  listJobsForTechnician,
  startChecklistRun,
  uploadJobEvidence,
  type ChecklistId,
} from "@dial/jobs";
import {
  computeTechPayoutWithholding,
  getWithholdingBalance,
} from "@dial/payments";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

function technicianIdFromSession(email: string): string {
  return `tech_${email.split("@")[0]!.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
}

function customerIdFromSession(email: string): string {
  return `cust_${email.split("@")[0]!.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
}

function sessionOr401(req: Request) {
  return getSessionFromToken(parseSessionCookie(req.headers.get("cookie")));
}

function serializeJob(j: NonNullable<ReturnType<typeof getTechJob>>) {
  return {
    ...j,
    draftAmountUsdMinor: j.draftAmountUsdMinor.toString(),
  };
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
  const view = url.searchParams.get("view") ?? "home";
  const technicianId = technicianIdFromSession(session.email);

  if (view === "slots") {
    const slots = await listBookingSlots();
    const quote = draftTechQuote({ jobClass: "diagnostics", emergency: false });
    return NextResponse.json({
      slots,
      quote: {
        ...quote,
        draftAmountUsdMinor: quote.draftAmountUsdMinor.toString(),
      },
      bookingSibling: "cal.com",
      note: "Slots from Cal.com (fixture when CALCOM_* unset). Quote source=rate_card.",
    });
  }

  if (view === "checklists") {
    return NextResponse.json({ checklists: listChecklists() });
  }

  if (view === "take_home") {
    const year = Number(url.searchParams.get("year") ?? new Date().getFullYear());
    const bal = getWithholdingBalance(technicianId, year);
    return NextResponse.json({
      technicianId,
      yearOfAssessment: year,
      balance: bal
        ? {
            ...bal,
            grossPaidMinor: bal.grossPaidMinor.toString(),
            withheldMinor: bal.withheldMinor.toString(),
          }
        : null,
      note: "D-50 WHT 30% unless ITF263 — draft economics only",
    });
  }

  return NextResponse.json({
    technicianId,
    jobs: listJobsForTechnician(technicianId).map(serializeJob),
    checklists: listChecklists(),
  });
}

export async function POST(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as Record<string, unknown>;
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }

  const technicianId = technicianIdFromSession(session.email);
  const customerId = customerIdFromSession(session.email);
  const action = String(body.action ?? "");

  try {
    switch (action) {
      case "book": {
        const emergency = Boolean(body.emergency);
        const slotId = body.slotId != null ? String(body.slotId) : null;
        const job = bookTechJob({
          customerId,
          jobClass: String(body.jobClass ?? "diagnostics"),
          slotId,
          emergency,
          ...(body.assignSelf ? { technicianId } : {}),
        });
        return NextResponse.json({ ok: true, job: serializeJob(job) });
      }
      case "seed_assigned_job": {
        // Fixture: customer book + assign to this technician for Android thin path.
        const slots = await listBookingSlots();
        const slot = slots[0];
        if (!slot) {
          return NextResponse.json({ error: "no slots" }, { status: 503 });
        }
        const job = bookTechJob({
          customerId: `cust_seed_${Date.now().toString(36)}`,
          technicianId,
          jobClass: String(body.jobClass ?? "diagnostics"),
          slotId: slot.slotId,
          emergency: false,
        });
        return NextResponse.json({
          ok: true,
          job: serializeJob(job),
          slot,
        });
      }
      case "assign_self": {
        const job = assignJobToTechnician(String(body.jobId ?? ""), technicianId);
        return NextResponse.json({ ok: true, job: serializeJob(job) });
      }
      case "start_checklist": {
        const checklistId = String(body.checklistId ?? "automotive_basic") as ChecklistId;
        const checklist = getChecklist(checklistId);
        if (!checklist) {
          return NextResponse.json({ error: "unknown checklist" }, { status: 400 });
        }
        const run = startChecklistRun({
          jobId: String(body.jobId ?? ""),
          checklistId,
        });
        return NextResponse.json({
          ok: true,
          run,
          checklist,
        });
      }
      case "advance_checklist": {
        const run = advanceChecklistStep(String(body.runId ?? ""));
        const checklist = getChecklist(run.checklistId);
        return NextResponse.json({ ok: true, run, checklist });
      }
      case "upload_evidence": {
        const kind = String(body.kind ?? "note") as "photo" | "note";
        if (kind !== "photo" && kind !== "note") {
          return NextResponse.json({ error: "invalid kind" }, { status: 400 });
        }
        const row = uploadJobEvidence({
          jobId: String(body.jobId ?? ""),
          technicianId,
          kind,
          payloadRef: String(body.payloadRef ?? ""),
        });
        return NextResponse.json({ ok: true, evidence: row });
      }
      case "list_evidence": {
        const jobId = String(body.jobId ?? "");
        return NextResponse.json({
          ok: true,
          evidence: listEvidenceForJob(jobId),
        });
      }
      case "take_home_preview": {
        const payoutUsdMinor = BigInt(String(body.payoutUsdMinor ?? "0"));
        const hasItf263 = Boolean(body.hasItf263);
        const year = Number(body.yearOfAssessment ?? new Date().getFullYear());
        const result = computeTechPayoutWithholding({
          technicianId,
          yearOfAssessment: year,
          payoutUsdMinor,
          hasItf263,
        });
        return NextResponse.json({
          ok: true,
          technicianId,
          netPayoutMinor: result.netPayoutMinor.toString(),
          withholdMinor: result.withholdMinor.toString(),
          rateBps: result.rateBps,
          note: "Draft economics only — human + pricing engine write payable amounts",
        });
      }
      case "get_run": {
        const run = getChecklistRun(String(body.runId ?? ""));
        if (!run) {
          return NextResponse.json({ error: "unknown run" }, { status: 404 });
        }
        return NextResponse.json({ ok: true, run });
      }
      default:
        return NextResponse.json({ error: `unknown action ${action}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "tech action failed" },
      { status: 400 },
    );
  }
}
