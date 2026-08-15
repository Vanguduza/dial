/**
 * PD13 customer tech-web services API (Pack §9.3).
 * Session SoR; never body/query userId/role (D-47). Quotes = rate_card only (D-32).
 */
import { NextResponse } from "next/server";
import {
  bookJobFromIntake,
  bookTechJob,
  confirmCalBooking,
  createJobIntake,
  draftTechQuote,
  getCustomerJobStatusDetail,
  getTechJob,
  listBookingSlots,
  listChecklists,
  listJobsForCustomer,
  listTechnicianProfileCards,
  setManagersChoice,
  setTechnicianAvailability,
  setTechnicianCredential,
  setValueScoreSnapshot,
  upsertTechnicianProfileDirectory,
} from "@dial/jobs";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

function customerIdFromSession(email: string): string {
  return `cust_${email.split("@")[0]!.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
}

function sessionOr401(req: Request) {
  return getSessionFromToken(parseSessionCookie(req.headers.get("cookie")));
}

function serializeJob(j: NonNullable<ReturnType<typeof getTechJob>>) {
  return {
    id: j.id,
    customerId: j.customerId,
    technicianId: j.technicianId,
    jobClassId: j.jobClassId,
    status: j.status,
    slotId: j.slotId,
    emergency: j.emergency,
    quoteId: j.quoteId,
    draftAmountUsdMinor: j.draftAmountUsdMinor.toString(),
    currency: j.currency,
    createdAt: j.createdAt,
    ...(j.intakeSummary != null ? { intakeSummary: j.intakeSummary } : {}),
    ...(j.intakeUrgency != null ? { intakeUrgency: j.intakeUrgency } : {}),
    draftOnly: true,
    payableFromAi: false as const,
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

  const customerId = customerIdFromSession(session.email);
  const view = url.searchParams.get("view") ?? "home";

  if (view === "slots") {
    const slots = await listBookingSlots();
    const quote = draftTechQuote({ jobClass: "diagnostics", emergency: false });
    return NextResponse.json({
      slots,
      quote: {
        ...quote,
        draftAmountUsdMinor: quote.draftAmountUsdMinor.toString(),
        payableFromAi: false,
      },
      bookingSibling: "cal.com",
      note: "Pack §9.3 — rate_card draft only; human + pricing engine confirm payable",
    });
  }

  if (view === "checklists") {
    return NextResponse.json({ checklists: listChecklists() });
  }

  if (view === "profiles") {
    if (listTechnicianProfileCards().length === 0) {
      upsertTechnicianProfileDirectory({
        technicianId: "tech_guide_choice",
        displayName: "Amai Choice",
        tradeId: "trade_auto",
      });
      upsertTechnicianProfileDirectory({
        technicianId: "tech_guide_std",
        displayName: "Baba Standard",
        tradeId: "trade_elec",
      });
      setTechnicianCredential({
        technicianId: "tech_guide_choice",
        kind: "trade_licence",
        status: "verified",
      });
      setTechnicianCredential({
        technicianId: "tech_guide_std",
        kind: "trade_licence",
        status: "verified",
      });
      setValueScoreSnapshot({
        technicianId: "tech_guide_choice",
        score: 90,
        sampleN: 30,
      });
      setManagersChoice({
        technicianId: "tech_guide_choice",
        managersChoice: true,
        setBy: "pd106_fixture",
      });
      setValueScoreSnapshot({
        technicianId: "tech_guide_std",
        score: 72,
        sampleN: 14,
      });
      setTechnicianAvailability({
        technicianId: "tech_guide_choice",
        status: "available",
      });
      setTechnicianAvailability({
        technicianId: "tech_guide_std",
        status: "busy",
      });
    }
    return NextResponse.json({
      profiles: listTechnicianProfileCards(),
      payableFromAi: false,
      note: "PD106 — technician profile cards with Manager's choice (Pack §9.3)",
    });
  }

  if (view === "jobs") {
    return NextResponse.json({
      customerId,
      jobs: listJobsForCustomer(customerId).map(serializeJob),
    });
  }

  if (view === "job") {
    const jobId = url.searchParams.get("jobId") ?? "";
    const job = getTechJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "unknown job" }, { status: 404 });
    }
    if (job.customerId !== customerId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const detail = getCustomerJobStatusDetail(jobId);
    return NextResponse.json({
      job: serializeJob(detail.job),
      statusLabel: detail.statusLabel,
      evidenceCount: detail.evidenceCount,
      evidence: detail.evidence.map((e) => ({
        evidenceId: e.evidenceId,
        kind: e.kind,
        createdAt: e.createdAt,
      })),
      timeline: detail.timeline,
      payableFromAi: false,
      note: "PD101 — customer job status + evidence deepen (Pack §9.3)",
    });
  }

  return NextResponse.json({
    customerId,
    checklists: listChecklists(),
    jobs: listJobsForCustomer(customerId).map(serializeJob),
    guide: {
      title: "Dial a Tech",
      tone: "calm_professional",
      aiHypeForbidden: true,
    },
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

  const customerId = customerIdFromSession(session.email);
  const action = String(body.action ?? "");

  try {
    if (action === "create_intake") {
      const job = createJobIntake({
        customerId,
        customerText: String(body.customerText ?? body.text ?? ""),
        ...(body.summary != null ? { summary: String(body.summary) } : {}),
        ...(body.urgency === "normal" || body.urgency === "emergency"
          ? { urgency: body.urgency }
          : {}),
      });
      return NextResponse.json({
        ok: true,
        job: serializeJob(job),
        needsHumanQuote: true,
        payableFromAi: false,
        note: "PD100 — Pack §10 create intake (pre-book); draft quote only",
      });
    }

    if (action === "book_intake") {
      const jobId = String(body.jobId ?? "").trim();
      if (!jobId) {
        return NextResponse.json({ error: "jobId required" }, { status: 400 });
      }
      const existing = getTechJob(jobId);
      if (!existing || existing.customerId !== customerId) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      const slotId =
        body.slotId != null && String(body.slotId).trim()
          ? String(body.slotId)
          : null;
      const job = bookJobFromIntake({
        jobId,
        ...(slotId != null ? { slotId } : {}),
        ...(body.technicianId != null
          ? { technicianId: String(body.technicianId) }
          : {}),
      });
      return NextResponse.json({
        ok: true,
        job: serializeJob(job),
        sameJobId: true,
        payableFromAi: false,
        note: "PD111 — intake → booked/assigned; same job id",
      });
    }

    if (action === "confirm_cal") {
      const slotId = String(body.slotId ?? "").trim();
      if (!slotId) {
        return NextResponse.json({ error: "slotId required" }, { status: 400 });
      }
      const booking = await confirmCalBooking({ slotId });
      return NextResponse.json({
        ok: true,
        booking,
        payableFromAi: false,
        note: "PD120 — Cal.com booking confirm sibling",
      });
    }

    if (action === "book") {
      const emergency = Boolean(body.emergency);
      const slotId = body.slotId != null ? String(body.slotId) : null;
      const jobClass = String(body.jobClass ?? (emergency ? "roadside_emergency" : "diagnostics"));
      const quote = draftTechQuote({ jobClass, emergency });
      if (quote.source !== "rate_card") {
        return NextResponse.json(
          { error: "quote source must be rate_card — AI never writes payable" },
          { status: 400 },
        );
      }
      const job = bookTechJob({
        customerId,
        jobClass,
        slotId,
        emergency,
      });
      return NextResponse.json({
        ok: true,
        job: serializeJob(job),
        quote: {
          ...quote,
          draftAmountUsdMinor: quote.draftAmountUsdMinor.toString(),
          payableFromAi: false,
        },
      });
    }

    if (action === "emergency_book") {
      const quote = draftTechQuote({
        jobClass: "roadside_emergency",
        emergency: true,
      });
      const job = bookTechJob({
        customerId,
        jobClass: "roadside_emergency",
        slotId: null,
        emergency: true,
      });
      return NextResponse.json({
        ok: true,
        job: serializeJob(job),
        quote: {
          ...quote,
          draftAmountUsdMinor: quote.draftAmountUsdMinor.toString(),
          payableFromAi: false,
        },
        aiPricingBypassed: true,
        checklistHref: "/tech/checklist/emergency_roadside",
      });
    }

    return NextResponse.json({ error: `unknown action ${action}` }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "tech services failed" },
      { status: 400 },
    );
  }
}
