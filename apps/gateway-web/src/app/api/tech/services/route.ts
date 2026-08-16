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
  ensureDialTechProfileFixtures,
  listTechnicianProfileCards,
  matchTechniciansForSpecialistHint,
} from "@dial/jobs";
import {
  authorizeJobReserve,
  createCheckoutPayment,
  getActiveFxRate,
  requireIdempotencyKey,
  usdToZig,
  type CheckoutPayChoice,
} from "@dial/payments";
import { diagnoseTechSymptom } from "../../../../lib/tech/specialistRouting";
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

function serializeQuote(
  quote: ReturnType<typeof draftTechQuote>,
) {
  return {
    quoteId: quote.quoteId,
    jobClassId: quote.jobClassId,
    draftAmountUsdMinor: quote.draftAmountUsdMinor.toString(),
    currency: quote.currency,
    source: quote.source,
    emergency: quote.emergency,
    labelledDraft: true as const,
    payableFromAi: false as const,
  };
}

function checklistForJob(job: NonNullable<ReturnType<typeof getTechJob>>) {
  const id =
    job.emergency || job.jobClassId === "jc_roadside"
      ? "emergency_roadside"
      : "automotive_basic";
  return { checklistId: id, checklistHref: `/tech/checklist/${id}` };
}

function assignedTechnicianView(technicianId: string | null) {
  if (!technicianId) return null;
  ensureDialTechProfileFixtures();
  const card = listTechnicianProfileCards().find(
    (c) => c.technicianId === technicianId,
  );
  return {
    technicianId,
    displayName: card?.displayName ?? technicianId,
    tradeName: card?.tradeName ?? null,
    oemSpecialties: card?.oemSpecialties ?? [],
  };
}

function payPreview(amountUsdMinor: bigint) {
  const rate = getActiveFxRate();
  const zig = rate ? usdToZig(amountUsdMinor, rate) : null;
  return {
    rails: ["ecocash", "cod"] as const,
    amountUsdMinor: amountUsdMinor.toString(),
    displayCurrency: "USD" as const,
    zigMinor: zig ? zig.amountMinor.toString() : null,
    fxRateId: rate?.fxRateId ?? null,
    ready: Boolean(rate),
    imttNotCustomerLine: true as const,
    payableFromAi: false as const,
    note: rate
      ? "USD browse; ZiG only at pay from ops daily rate (D-57)"
      : "EcoCash|COD fail-closed until ops Daily ZiG rate is set",
  };
}

function serializeJob(j: NonNullable<ReturnType<typeof getTechJob>>) {
  const checklist = checklistForJob(j);
  return {
    id: j.id,
    customerId: j.customerId,
    technicianId: j.technicianId,
    assignedTechnician: assignedTechnicianView(j.technicianId),
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
    ...checklist,
    labelledDraft: true as const,
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

  if (view === "quote") {
    const jobClass =
      url.searchParams.get("jobClass") ??
      url.searchParams.get("serviceId") ??
      "diagnostics";
    const emergency = url.searchParams.get("emergency") === "true";
    const quote = draftTechQuote({ jobClass, emergency });
    return NextResponse.json({
      quote: serializeQuote(quote),
      note: "Rate-card USD draft only — AI never writes payable amounts",
    });
  }

  if (view === "slots") {
    const slots = await listBookingSlots();
    const quote = draftTechQuote({ jobClass: "diagnostics", emergency: false });
    return NextResponse.json({
      slots,
      quote: serializeQuote(quote),
      bookingSibling: "cal.com",
      note: "Pack §9.3 — rate_card draft only; human + pricing engine confirm payable",
    });
  }

  if (view === "checklists") {
    return NextResponse.json({ checklists: listChecklists() });
  }

  if (view === "profiles") {
    ensureDialTechProfileFixtures();
    const brand = url.searchParams.get("oem") ?? url.searchParams.get("brand");
    let profiles = listTechnicianProfileCards();
    if (brand?.trim()) {
      const match = matchTechniciansForSpecialistHint({
        required: true,
        brand,
      });
      profiles = [...match.recommended, ...match.fallback];
      return NextResponse.json({
        profiles,
        recommendedSpecialists: match.recommended,
        fallbackTechnicians: match.fallback,
        matchedOnBrand: match.matchedOnBrand,
        payableFromAi: false,
        note: "PD106 — OEM specialist ranking is deterministic (not AI ids)",
      });
    }
    return NextResponse.json({
      profiles,
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
    const existing = getTechJob(jobId);
    if (!existing) {
      return NextResponse.json({ error: "unknown job" }, { status: 404 });
    }
    if (existing.customerId !== customerId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const detail = getCustomerJobStatusDetail(jobId);
    const serialized = serializeJob(detail.job);
    return NextResponse.json({
      job: serialized,
      statusLabel: detail.statusLabel,
      evidenceCount: detail.evidenceCount,
      evidence: detail.evidence.map((e) => ({
        evidenceId: e.evidenceId,
        kind: e.kind,
        createdAt: e.createdAt,
      })),
      timeline: detail.timeline,
      assignedTechnician: serialized.assignedTechnician,
      checklistHref: serialized.checklistHref,
      pay: payPreview(detail.job.draftAmountUsdMinor),
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

    if (action === "diagnose") {
      const diagnosed = diagnoseTechSymptom(
        String(body.customerText ?? body.symptom ?? body.note ?? ""),
      );
      return NextResponse.json({
        ok: true,
        assessment: diagnosed.assessment,
        checklist: diagnosed.checklist,
        recommendedSpecialists: diagnosed.recommendedSpecialists,
        fallbackTechnicians: diagnosed.fallbackTechnicians,
        matchedOnBrand: diagnosed.matchedOnBrand,
        payableFromAi: false,
        note: "OEM specialist routing — AI hint only; match is deterministic",
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
        ...(body.technicianId != null && String(body.technicianId).trim()
          ? { technicianId: String(body.technicianId) }
          : {}),
      });
      return NextResponse.json({
        ok: true,
        job: serializeJob(job),
        quote: serializeQuote(quote),
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
        quote: serializeQuote(quote),
        aiPricingBypassed: true,
        guidedIntakeGated: false,
        checklistHref: "/tech/checklist/emergency_roadside",
      });
    }

    if (action === "pay") {
      const jobId = String(body.jobId ?? "").trim();
      if (!jobId) {
        return NextResponse.json({ error: "jobId required" }, { status: 400 });
      }
      const existing = getTechJob(jobId);
      if (!existing || existing.customerId !== customerId) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      const choiceRaw = String(body.choice ?? "");
      if (choiceRaw !== "ecocash" && choiceRaw !== "cod") {
        return NextResponse.json(
          { error: "choice must be ecocash or cod" },
          { status: 400 },
        );
      }
      const choice: CheckoutPayChoice = choiceRaw;
      let idempotencyKey: string;
      try {
        idempotencyKey = requireIdempotencyKey(req.headers);
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Idempotency-Key required" },
          { status: 400 },
        );
      }
      const rate = getActiveFxRate();
      if (!rate) {
        return NextResponse.json(
          {
            error: "EcoCash|COD fail-closed — ops Daily ZiG rate not set",
            failClosed: true,
            railsReady: false,
            payableFromAi: false,
          },
          { status: 503 },
        );
      }
      try {
        const checkout = await createCheckoutPayment({
          choice,
          orderId: jobId,
          amountUsdMinor: existing.draftAmountUsdMinor,
          idempotencyKey,
        });
        const reserve = await authorizeJobReserve({
          jobId,
          amountUsdMinor: existing.draftAmountUsdMinor,
          idempotencyKey: `${idempotencyKey}:jr`,
        });
        return NextResponse.json({
          ok: true,
          choice,
          job: serializeJob(existing),
          intent: checkout.intent
            ? {
                id: checkout.intent.id,
                method: checkout.intent.method,
                status: checkout.intent.status,
                orderId: checkout.intent.orderId,
                amountUsdMinor: checkout.intent.amount.amountMinor.toString(),
                currency: checkout.intent.amount.currency,
                displayPayable: checkout.intent.displayPayable
                  ? {
                      amountMinor:
                        checkout.intent.displayPayable.amountMinor.toString(),
                      currency: checkout.intent.displayPayable.currency,
                    }
                  : null,
                fxRateId: checkout.intent.fxRateId ?? null,
              }
            : null,
          jobReserve: {
            id: reserve.id,
            status: reserve.status,
            amountUsdMinor: reserve.amount.amountMinor.toString(),
          },
          pay: payPreview(existing.draftAmountUsdMinor),
          payableFromAi: false,
          imttNotCustomerLine: true,
          note: "DIAL EcoCash|COD + Job Reserve — not Stripe/SSLCommerz",
        });
      } catch (e) {
        return NextResponse.json(
          {
            error: e instanceof Error ? e.message : "pay failed",
            failClosed: true,
            railsReady: false,
            payableFromAi: false,
          },
          { status: 503 },
        );
      }
    }

    return NextResponse.json({ error: `unknown action ${action}` }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "tech services failed" },
      { status: 400 },
    );
  }
}
