/**
 * PD7 courier delivery API — wraps @dial/delivery SoR (D-45).
 * PD32: COD float-limit warning on collect (Pack §9.8).
 * Session SoR; never body userId/role (D-47). MapLibre locations via postCourierLocation.
 */
import { NextResponse } from "next/server";
import {
  acceptOffer,
  activateOfflinePack,
  capturePod,
  completeDeliveryRun,
  createDeliveryJob,
  createJobsFromMultiStopPlan,
  evaluateCodCollect,
  expireOfferIfPast,
  getCourierAvailability,
  getCourierCodFloat,
  getDeliveryJob,
  getEtaBanner,
  getNavigateRun,
  getOffer,
  getOfferCountdown,
  getActiveRunPolyline,
  listCourierLocations,
  listCourierOfflinePacks,
  listJobsForCourier,
  listNavigateStops,
  listOffersForCourier,
  listOfflinePackDefinitions,
  listRunsForCourier,
  openNavigateRun,
  postCourierLocation,
  reconcileCodAfterPod,
  recordCodCollectAttempt,
  recordCodCollectFailure,
  refreshEtaBanner,
  rejectOffer,
  reoptimiseRemainingStops,
  setCourierAvailabilityStatus,
  setCourierCodFloatLimit,
  startDeliveryDispatchWorkflow,
  startDeliveryRun,
  startTransit,
  timeoutOffer,
  completeStopAndMaybeRun,
  type CourierAvailability,
  type OfflinePackId,
} from "@dial/delivery";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

function courierIdFromSession(email: string): string {
  return `cour_${email.split("@")[0]!.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
}

function sessionOr401(req: Request) {
  return getSessionFromToken(parseSessionCookie(req.headers.get("cookie")));
}

function serializeJob(j: NonNullable<ReturnType<typeof getDeliveryJob>>) {
  const { codAmountUsd: _cod, ...rest } = j;
  return {
    ...rest,
    codAmountUsdMinor: j.codAmountUsd?.amountMinor.toString(),
    codCurrency: j.codAmountUsd?.currency,
    podPhotoRef: j.podPhotoRef ?? null,
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
  const courierId = courierIdFromSession(session.email);
  const view = url.searchParams.get("view");
  if (view === "track") {
    // Admin/ops track snapshot — MapLibre pins from courier_locations SoR.
    return NextResponse.json({
      mapSor: "maplibre",
      locations: listCourierLocations(),
      note: "D-44 MapLibre — not Google/Mapbox",
    });
  }
  const jobs = listJobsForCourier(courierId);
  const activeJob = jobs.find(
    (j) => j.status === "assigned" || j.status === "in_transit",
  );
  const navigate =
    activeJob && getNavigateRun(activeJob.id)
      ? {
          jobId: activeJob.id,
          etaBanner: getEtaBanner(activeJob.id),
          stops: listNavigateStops(activeJob.id),
          polyline: (() => {
            try {
              return getActiveRunPolyline(activeJob.id);
            } catch {
              return null;
            }
          })(),
          mapSor: "maplibre" as const,
          note: "D-44 OSRM ETA + VROOM + polyline — MapLibre SoR",
        }
      : null;
  return NextResponse.json({
    courierId,
    availability: getCourierAvailability(courierId),
    offers: listOffersForCourier(courierId).map((o) => {
      const countdown = getOfferCountdown(o.id);
      return {
        ...o,
        remainingMs: countdown.remainingMs,
        expired: countdown.expired,
      };
    }),
    runs: listRunsForCourier(courierId),
    jobs: jobs.map((j) => serializeJob(j)),
    float: (() => {
      const f = getCourierCodFloat(courierId);
      return {
        floatLimitUsdMinor: f.floatLimitUsdMinor.toString(),
        heldUsdMinor: f.heldUsdMinor.toString(),
        currency: "USD" as const,
      };
    })(),
    offlinePacks: {
      available: listOfflinePackDefinitions(),
      installed: listCourierOfflinePacks(courierId),
      mapSor: "maplibre",
    },
    navigate,
    mapSor: "maplibre",
    payableFromAi: false,
  });
}

export async function POST(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const contentType = req.headers.get("content-type") ?? "";
  let body: Record<string, unknown> = {};
  if (contentType.includes("application/json")) {
    body = (await req.json()) as Record<string, unknown>;
  } else {
    const form = await req.formData();
    for (const [k, v] of form.entries()) body[k] = String(v);
  }
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }

  const courierId = courierIdFromSession(session.email);
  const action = String(body.action ?? "");

  try {
    switch (action) {
      case "set_availability": {
        const status = String(body.status ?? "offline") as CourierAvailability;
        if (!["available", "busy", "offline"].includes(status)) {
          return NextResponse.json({ error: "invalid status" }, { status: 400 });
        }
        setCourierAvailabilityStatus(courierId, status);
        return NextResponse.json({
          ok: true,
          courierId,
          availability: getCourierAvailability(courierId),
          eligibleForOffers: status === "available",
        });
      }
      case "list_offline_packs": {
        return NextResponse.json({
          ok: true,
          mapSor: "maplibre",
          packs: listOfflinePackDefinitions(),
          installed: listCourierOfflinePacks(courierId),
        });
      }
      case "activate_offline_pack": {
        const packId = String(body.packId ?? "") as OfflinePackId;
        if (packId !== "harare_metro" && packId !== "bulawayo_metro") {
          return NextResponse.json(
            { error: "packId must be harare_metro|bulawayo_metro" },
            { status: 400 },
          );
        }
        const installed = activateOfflinePack({ courierId, packId });
        return NextResponse.json({
          ok: true,
          installed,
          installedPacks: listCourierOfflinePacks(courierId),
          mapSor: "maplibre",
          note: "D-44 MapLibre offline tiles — not Google/Mapbox",
        });
      }
      case "seed_offer": {
        // Fixture/dev: create job + start DeliveryDispatchWorkflow for this courier.
        setCourierAvailabilityStatus(courierId, "available");
        const job = createDeliveryJob({
          orderId: String(body.orderId ?? `ord_${Date.now().toString(36)}`),
          from: String(body.from ?? "supplier_hub_harare"),
          to: String(body.to ?? "customer_avondale"),
          ...(body.codUsdMinor
            ? { codUsdMinor: BigInt(String(body.codUsdMinor)) }
            : { codUsdMinor: 25_00n }),
        });
        const wf = startDeliveryDispatchWorkflow(job.id);
        const offered = getDeliveryJob(job.id)!;
        return NextResponse.json({
          ok: true,
          workflowId: wf.workflowId,
          job: serializeJob(offered),
          offer: offered.offerId ? getOffer(offered.offerId) : null,
        });
      }
      case "seed_multi_stop": {
        // PD36: multi-vendor same band/slot → one job (grill Q15).
        setCourierAvailabilityStatus(courierId, "available");
        const vendorsRaw = Array.isArray(body.vendors) ? body.vendors : null;
        if (!vendorsRaw || vendorsRaw.length < 1) {
          return NextResponse.json(
            { error: "vendors[] required for seed_multi_stop" },
            { status: 400 },
          );
        }
        const vendors = vendorsRaw.map((v) => {
          const row = v as Record<string, unknown>;
          return {
            supplierId: String(row.supplierId ?? ""),
            supplierDisplayName: String(row.supplierDisplayName ?? "Agency"),
            pickupAddress: String(row.pickupAddress ?? "supplier_hub_harare"),
            deliveryBandId: String(row.deliveryBandId ?? "harare_metro"),
            slotId: String(row.slotId ?? "slot_harare_am"),
            vertical: (String(row.vertical ?? "grocery") === "spare"
              ? "spare"
              : "grocery") as "grocery" | "spare",
            ageGateRequired: false as const,
            hasRestrictedSku: false as const,
          };
        });
        const result = createJobsFromMultiStopPlan({
          orderId: String(body.orderId ?? `ord_ms_${Date.now().toString(36)}`),
          dropoffAddress: String(body.dropoffAddress ?? "customer_avondale"),
          vendors,
          ...(body.codUsdMinor
            ? { codUsdMinor: BigInt(String(body.codUsdMinor)) }
            : { codUsdMinor: 22_00n }),
          createJob: createDeliveryJob,
        });
        const workflows = result.jobs.map((job) =>
          startDeliveryDispatchWorkflow(job.id),
        );
        return NextResponse.json({
          ok: true,
          consolidated: result.consolidated,
          jobCount: result.jobCount,
          liquorAllowed: false,
          podSpoilageRulesUnchanged: true,
          payableFromAi: false,
          plans: result.plans,
          jobs: result.jobs.map((j) => serializeJob(getDeliveryJob(j.id)!)),
          workflows: workflows.map((w) => w.workflowId),
          note: "PD36 grill Q15 — one multi-stop job when same band/slot",
        });
      }
      case "accept_offer": {
        const offerId = String(body.offerId ?? "");
        const job = acceptOffer(offerId, courierId);
        setCourierAvailabilityStatus(courierId, "busy");
        return NextResponse.json({ ok: true, job: serializeJob(job) });
      }
      case "reject_offer": {
        const offer = rejectOffer(String(body.offerId ?? ""), courierId);
        return NextResponse.json({ ok: true, offer });
      }
      case "timeout_offer": {
        const offer = timeoutOffer(String(body.offerId ?? ""));
        return NextResponse.json({ ok: true, offer });
      }
      case "start_transit": {
        const job = startTransit(String(body.jobId ?? ""));
        if (job.assignedCourierId !== courierId) {
          return NextResponse.json({ error: "Job not assigned to courier" }, { status: 403 });
        }
        let run = getNavigateRun(job.id);
        if (!run) {
          run = await openNavigateRun({
            jobId: job.id,
            courierId,
          });
        }
        return NextResponse.json({
          ok: true,
          job: serializeJob(job),
          navigate: {
            etaBanner: run.etaBanner,
            stops: run.stops,
            mapSor: "maplibre",
          },
        });
      }
      case "get_eta_banner": {
        const jobId = String(body.jobId ?? "");
        const job = getDeliveryJob(jobId);
        if (!job || job.assignedCourierId !== courierId) {
          return NextResponse.json({ error: "Job not assigned to courier" }, { status: 403 });
        }
        if (!getNavigateRun(jobId)) {
          await openNavigateRun({ jobId, courierId });
        }
        const etaBanner = await refreshEtaBanner(jobId);
        return NextResponse.json({
          ok: true,
          etaBanner,
          mapSor: "maplibre",
          note: "OSRM duration → ETA minutes (D-44)",
        });
      }
      case "list_navigate_stops": {
        const jobId = String(body.jobId ?? "");
        const job = getDeliveryJob(jobId);
        if (!job || job.assignedCourierId !== courierId) {
          return NextResponse.json({ error: "Job not assigned to courier" }, { status: 403 });
        }
        if (!getNavigateRun(jobId)) {
          await openNavigateRun({ jobId, courierId });
        }
        return NextResponse.json({
          ok: true,
          stops: listNavigateStops(jobId),
          etaBanner: getEtaBanner(jobId),
          mapSor: "maplibre",
        });
      }
      case "reoptimise_stops": {
        const jobId = String(body.jobId ?? "");
        const job = getDeliveryJob(jobId);
        if (!job || job.assignedCourierId !== courierId) {
          return NextResponse.json({ error: "Job not assigned to courier" }, { status: 403 });
        }
        if (!getNavigateRun(jobId)) {
          await openNavigateRun({ jobId, courierId });
        }
        const result = await reoptimiseRemainingStops(jobId);
        return NextResponse.json({
          ok: true,
          provider: result.provider,
          orderChanged: result.orderChanged,
          stops: result.run.stops,
          etaBanner: result.run.etaBanner,
          mapSor: result.mapSor,
          googleMapsSor: result.googleMapsSor,
          note: "VROOM re-optimise remaining — MapLibre/OSRM SoR (D-44)",
        });
      }
      case "post_location": {
        const loc = postCourierLocation({
          courierId,
          lat: Number(body.lat),
          lng: Number(body.lng),
          ...(body.jobId ? { jobId: String(body.jobId) } : {}),
        });
        return NextResponse.json({ ok: true, location: loc, mapSor: "maplibre" });
      }
      case "capture_pod": {
        const photoRef =
          body.photoRef != null ? String(body.photoRef) : undefined;
        const signatureRef =
          body.signatureRef != null ? String(body.signatureRef) : undefined;
        const gpsLat =
          body.gpsLat != null ? Number(body.gpsLat) : undefined;
        const gpsLng =
          body.gpsLng != null ? Number(body.gpsLng) : undefined;
        const job = capturePod(String(body.jobId ?? ""), {
          ...(photoRef ? { photoRef } : {}),
          ...(signatureRef ? { signatureRef } : {}),
          ...(gpsLat != null && Number.isFinite(gpsLat) ? { gpsLat } : {}),
          ...(gpsLng != null && Number.isFinite(gpsLng) ? { gpsLng } : {}),
        });
        return NextResponse.json({
          ok: true,
          job: serializeJob(job),
          podPhotoRef: job.podPhotoRef ?? null,
          podSignatureRef: job.podSignatureRef ?? null,
          podGps: job.podGps ?? null,
          podMediaId: job.podMediaId ?? null,
          mapSor: "maplibre",
          payableFromAi: false,
          note: "PD63 — photo/signature + GPS → pod_media",
        });
      }
      case "reconcile_cod": {
        const jobId = String(body.jobId ?? "");
        const job = getDeliveryJob(jobId);
        if (!job || job.assignedCourierId !== courierId) {
          return NextResponse.json({ error: "Job not assigned to courier" }, { status: 403 });
        }
        const cod = reconcileCodAfterPod(jobId);
        const collectMinor = cod.amountUsd?.amountMinor ?? 0n;
        const floatEval =
          collectMinor > 0n
            ? evaluateCodCollect({
                courierId,
                collectUsdMinor: collectMinor,
              })
            : null;
        return NextResponse.json({
          ok: true,
          reconciled: cod.reconciled,
          amountUsdMinor: cod.amountUsd?.amountMinor.toString(),
          currency: cod.amountUsd?.currency ?? "USD",
          float: floatEval,
          note: "COD USD minor — float warning is Pack §9.8 ops gate",
        });
      }
      case "set_cod_float_limit": {
        const limit = BigInt(String(body.floatLimitUsdMinor ?? "5000"));
        const state = setCourierCodFloatLimit(courierId, limit);
        return NextResponse.json({
          ok: true,
          float: {
            courierId: state.courierId,
            floatLimitUsdMinor: state.floatLimitUsdMinor.toString(),
            heldUsdMinor: state.heldUsdMinor.toString(),
          },
          payableFromAi: false,
        });
      }
      case "evaluate_cod_float": {
        const collect = BigInt(String(body.collectUsdMinor ?? "0"));
        const evaluation = evaluateCodCollect({
          courierId,
          collectUsdMinor: collect,
        });
        return NextResponse.json({ ok: true, evaluation, payableFromAi: false });
      }
      case "cod_collect_attempt": {
        const jobId = String(body.jobId ?? "");
        const job = getDeliveryJob(jobId);
        if (!job || job.assignedCourierId !== courierId) {
          return NextResponse.json({ error: "Job not assigned to courier" }, { status: 403 });
        }
        const collect =
          body.collectUsdMinor != null
            ? BigInt(String(body.collectUsdMinor))
            : (job.codAmountUsd?.amountMinor ?? 0n);
        const attempt = recordCodCollectAttempt({
          jobId,
          courierId,
          collectUsdMinor: collect,
          acknowledgedWarning: Boolean(body.acknowledgedWarning),
        });
        const float = getCourierCodFloat(courierId);
        return NextResponse.json({
          ok: attempt.status === "recorded",
          attempt,
          float: {
            courierId: float.courierId,
            floatLimitUsdMinor: float.floatLimitUsdMinor.toString(),
            heldUsdMinor: float.heldUsdMinor.toString(),
          },
          payableFromAi: false,
        });
      }
      case "cod_collect_failure": {
        const jobId = String(body.jobId ?? "");
        const job = getDeliveryJob(jobId);
        if (!job || job.assignedCourierId !== courierId) {
          return NextResponse.json({ error: "Job not assigned to courier" }, { status: 403 });
        }
        const collect =
          body.collectUsdMinor != null
            ? BigInt(String(body.collectUsdMinor))
            : (job.codAmountUsd?.amountMinor ?? 0n);
        const failureReason = String(body.failureReason ?? "") as
          | "customer_refused"
          | "wrong_amount"
          | "no_cash"
          | "counterfeit_suspected"
          | "other";
        const attempt = recordCodCollectFailure({
          jobId,
          courierId,
          collectUsdMinor: collect,
          failureReason,
          ...(body.note != null ? { note: String(body.note) } : {}),
        });
        return NextResponse.json({
          ok: true,
          attempt,
          payableFromAi: false,
          note: "PD61 — COD failure reason recorded",
        });
      }
      case "offer_countdown": {
        const countdown = getOfferCountdown(String(body.offerId ?? ""));
        return NextResponse.json({ ok: true, countdown, payableFromAi: false });
      }
      case "expire_offer_if_past": {
        const offer = expireOfferIfPast(String(body.offerId ?? ""));
        return NextResponse.json({
          ok: true,
          offer,
          payableFromAi: false,
          note: "PD68 — countdown timeout path",
        });
      }
      case "start_run": {
        const run = startDeliveryRun(String(body.runId ?? ""), courierId);
        return NextResponse.json({
          ok: true,
          run,
          mapSor: "maplibre",
          payableFromAi: false,
          note: "PD67 — delivery_run start",
        });
      }
      case "complete_run": {
        const run = completeDeliveryRun(String(body.runId ?? ""), courierId);
        return NextResponse.json({
          ok: true,
          run,
          mapSor: "maplibre",
          payableFromAi: false,
        });
      }
      case "complete_stop": {
        const jobId = String(body.jobId ?? "");
        const stopId = String(body.stopId ?? "");
        const job = getDeliveryJob(jobId);
        if (!job || job.assignedCourierId !== courierId) {
          return NextResponse.json(
            { error: "Job not assigned to courier" },
            { status: 403 },
          );
        }
        if (!getNavigateRun(jobId)) {
          await openNavigateRun({ jobId, courierId });
        }
        const result = completeStopAndMaybeRun({
          jobId,
          stopId,
          courierId,
        });
        return NextResponse.json({
          ok: true,
          ...result,
          note: "PD77 — complete stop; last stop completes delivery_run",
        });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action ${action}` },
          { status: 400 },
        );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "delivery action failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
