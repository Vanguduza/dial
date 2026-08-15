/**
 * PD9 technician API — wraps @dial/jobs SoR (Cal.com slots, checklist, evidence).
 * PD25: Value Score factors + ITF263 upload/status + Take-Home breakdown (D-50/D-53).
 * PD30: mock-location check-in + camera evidence queue (Pack §9.7 / 2B-29).
 * PD31: Bluetooth ESC/POS thermal print hooks — ops ticket, not ZIMRA SoR (D-40a).
 * Session SoR; never body userId/role (D-47).
 */
import { NextResponse } from "next/server";
import {
  advanceChecklistStep,
  assignJobToTechnician,
  bookTechJob,
  captureCameraEvidence,
  checkInAtJobSite,
  draftTechQuote,
  flushEvidenceQueue,
  getChecklist,
  getChecklistRun,
  getTechJob,
  getValueScoreSnapshot,
  listBookingSlots,
  listCameraEvidenceForJob,
  listCheckInsForJob,
  listChecklists,
  listEvidenceForJob,
  listJobsForTechnician,
  listThermalPrinters,
  listThermalPrintJobs,
  pairThermalPrinter,
  printJobTicket,
  setJobSitePin,
  setValueScoreSnapshot,
  startChecklistRun,
  uploadJobEvidence,
  type ChecklistId,
} from "@dial/jobs";
import {
  computeTakeHomeBreakdown,
  computeTechPayoutWithholding,
  getItf263Record,
  getWithholdingBalance,
  setItf263Status,
  uploadItf263Document,
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

  if (view === "value_score") {
    let snap = getValueScoreSnapshot(technicianId);
    if (!snap) {
      snap = setValueScoreSnapshot({
        technicianId,
        score: 70,
        sampleN: 12,
      });
    }
    return NextResponse.json({
      technicianId,
      valueScore: snap,
      note: "D-53 Value Score explainability — never payable amounts",
      payableFromAi: false,
    });
  }

  if (view === "itf263") {
    const year = Number(
      url.searchParams.get("year") ?? new Date().getFullYear(),
    );
    const record = getItf263Record(technicianId, year) ?? null;
    const bal = getWithholdingBalance(technicianId, year);
    return NextResponse.json({
      technicianId,
      yearOfAssessment: year,
      itf263: record,
      balance: bal
        ? {
            ...bal,
            grossPaidMinor: bal.grossPaidMinor.toString(),
            withheldMinor: bal.withheldMinor.toString(),
          }
        : null,
      note: "D-50 ITF263 hard preference — 30% WHT without verified clearance",
      payableFromAi: false,
    });
  }

  if (view === "take_home") {
    const year = Number(url.searchParams.get("year") ?? new Date().getFullYear());
    const bal = getWithholdingBalance(technicianId, year);
    const itf = getItf263Record(technicianId, year);
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
      itf263Status: itf?.status ?? "none",
      note: "D-50 WHT 30% unless ITF263 — draft economics only",
    });
  }

  return NextResponse.json({
    technicianId,
    jobs: listJobsForTechnician(technicianId).map(serializeJob),
    checklists: listChecklists(),
    valueScore: getValueScoreSnapshot(technicianId) ?? null,
    itf263: getItf263Record(technicianId, new Date().getFullYear()) ?? null,
    thermalPrinters: listThermalPrinters(technicianId),
    thermalPrintJobs: listThermalPrintJobs(technicianId),
    printNote: "ESC/POS Bluetooth ops — FDMS virtual API only (D-40a); not ZIMRA printer SoR",
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
      case "set_job_site": {
        const jobId = String(body.jobId ?? "");
        const job = getTechJob(jobId);
        if (!job || job.technicianId !== technicianId) {
          return NextResponse.json({ error: "Job not assigned to technician" }, { status: 403 });
        }
        const pin = setJobSitePin({
          jobId,
          ...(body.lat != null ? { lat: Number(body.lat) } : {}),
          ...(body.lng != null ? { lng: Number(body.lng) } : {}),
        });
        return NextResponse.json({
          ok: true,
          site: pin,
          mapSor: "maplibre",
          note: "Geofence pin — not Google SoR",
        });
      }
      case "check_in": {
        const jobId = String(body.jobId ?? "");
        const job = getTechJob(jobId);
        if (!job || job.technicianId !== technicianId) {
          return NextResponse.json({ error: "Job not assigned to technician" }, { status: 403 });
        }
        setJobSitePin({ jobId });
        const attempt = checkInAtJobSite({
          jobId,
          technicianId,
          lat: Number(body.lat),
          lng: Number(body.lng),
          isMockLocation: Boolean(body.isMockLocation),
          ...(body.accuracyMeters != null
            ? { accuracyMeters: Number(body.accuracyMeters) }
            : {}),
        });
        return NextResponse.json({
          ok: true,
          checkIn: attempt,
          note: "2B-29 mock location never earns punctuality",
          payableFromAi: false,
        });
      }
      case "capture_camera_evidence": {
        const jobId = String(body.jobId ?? "");
        const job = getTechJob(jobId);
        if (!job || job.technicianId !== technicianId) {
          return NextResponse.json({ error: "Job not assigned to technician" }, { status: 403 });
        }
        const capture = captureCameraEvidence({
          jobId,
          technicianId,
          payloadRef: String(body.payloadRef ?? ""),
          overlayChecklistStep: String(body.overlayChecklistStep ?? ""),
          queuedOffline: Boolean(body.queuedOffline),
        });
        uploadJobEvidence({
          jobId,
          technicianId,
          kind: "photo",
          payloadRef: capture.payloadRef,
        });
        return NextResponse.json({
          ok: true,
          camera: capture,
          payableFromAi: false,
          note: "Device camera + checklist overlay — gallery not SoR",
        });
      }
      case "flush_evidence_queue": {
        const result = flushEvidenceQueue(technicianId);
        return NextResponse.json({
          ok: true,
          ...result,
          note: "Offline evidence queue flush",
        });
      }
      case "list_camera_evidence": {
        const jobId = String(body.jobId ?? "");
        return NextResponse.json({
          ok: true,
          cameraEvidence: listCameraEvidenceForJob(jobId),
          checkIns: listCheckInsForJob(jobId),
          payableFromAi: false,
        });
      }
      case "pair_thermal_printer": {
        const printer = pairThermalPrinter({
          technicianId,
          ...(body.label != null ? { label: String(body.label) } : {}),
          ...(body.bluetoothAddress != null
            ? { bluetoothAddress: String(body.bluetoothAddress) }
            : {}),
        });
        return NextResponse.json({
          ok: true,
          printer,
          zimraFiscalSor: false,
          fdmsVirtualOnly: true,
          note: "D-46 ESC/POS pattern — not agency FDMS / ZIMRA printer (D-40a)",
          payableFromAi: false,
        });
      }
      case "print_job_ticket": {
        const jobId = String(body.jobId ?? "");
        const job = getTechJob(jobId);
        if (!job || job.technicianId !== technicianId) {
          return NextResponse.json({ error: "Job not assigned to technician" }, { status: 403 });
        }
        const printerId = String(body.printerId ?? "");
        const ticket = printJobTicket({
          technicianId,
          printerId,
          jobId,
          jobClassId: job.jobClassId,
          draftAmountUsdMinor: job.draftAmountUsdMinor,
        });
        return NextResponse.json({
          ok: true,
          printJob: ticket,
          zimraFiscalSor: false,
          payableFromAi: false,
          note: "Job ticket ESC/POS — draft amount echo only; not fiscal receipt",
        });
      }
      case "list_thermal_printers": {
        return NextResponse.json({
          ok: true,
          printers: listThermalPrinters(technicianId),
          printJobs: listThermalPrintJobs(technicianId),
          zimraFiscalSor: false,
          fdmsVirtualOnly: true,
        });
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
        const year = Number(body.yearOfAssessment ?? new Date().getFullYear());
        const hasItf263 =
          body.hasItf263 !== undefined
            ? Boolean(body.hasItf263)
            : getItf263Record(technicianId, year)?.status === "verified";
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
          hasItf263,
          note: "Draft economics only — human + pricing engine write payable amounts",
        });
      }
      case "take_home_breakdown": {
        const year = Number(body.yearOfAssessment ?? new Date().getFullYear());
        const breakdown = computeTakeHomeBreakdown({
          technicianId,
          yearOfAssessment: year,
          grossUsdMinor: BigInt(String(body.grossUsdMinor ?? "0")),
          dialFeeUsdMinor: BigInt(String(body.dialFeeUsdMinor ?? "0")),
        });
        return NextResponse.json({
          ok: true,
          technicianId,
          ...breakdown,
          note: "Your DIAL Take-Home — draft only; payableFromAi=false",
        });
      }
      case "upload_itf263": {
        const year = Number(body.yearOfAssessment ?? new Date().getFullYear());
        const record = uploadItf263Document({
          technicianId,
          yearOfAssessment: year,
          documentRef: String(body.documentRef ?? ""),
        });
        return NextResponse.json({
          ok: true,
          itf263: record,
          payableFromAi: false,
        });
      }
      case "verify_itf263_fixture": {
        const year = Number(body.yearOfAssessment ?? new Date().getFullYear());
        const record = setItf263Status({
          technicianId,
          yearOfAssessment: year,
          status: "verified",
          setBy: "fixture_pd25",
        });
        return NextResponse.json({ ok: true, itf263: record });
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
