/**
 * PD7 courier delivery API — wraps @dial/delivery SoR (D-45).
 * Session SoR; never body userId/role (D-47). MapLibre locations via postCourierLocation.
 */
import { NextResponse } from "next/server";
import {
  acceptOffer,
  activateOfflinePack,
  capturePod,
  createDeliveryJob,
  getCourierAvailability,
  getDeliveryJob,
  getOffer,
  listCourierLocations,
  listCourierOfflinePacks,
  listJobsForCourier,
  listOffersForCourier,
  listOfflinePackDefinitions,
  postCourierLocation,
  reconcileCodAfterPod,
  rejectOffer,
  setCourierAvailabilityStatus,
  startDeliveryDispatchWorkflow,
  startTransit,
  timeoutOffer,
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
  return NextResponse.json({
    courierId,
    availability: getCourierAvailability(courierId),
    offers: listOffersForCourier(courierId),
    jobs: listJobsForCourier(courierId).map((j) => serializeJob(j)),
    offlinePacks: {
      available: listOfflinePackDefinitions(),
      installed: listCourierOfflinePacks(courierId),
      mapSor: "maplibre",
    },
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
        return NextResponse.json({ ok: true, job: serializeJob(job) });
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
        const job = capturePod(String(body.jobId ?? ""));
        return NextResponse.json({ ok: true, job: serializeJob(job) });
      }
      case "reconcile_cod": {
        const cod = reconcileCodAfterPod(String(body.jobId ?? ""));
        return NextResponse.json({
          ok: true,
          reconciled: cod.reconciled,
          amountUsdMinor: cod.amountUsd?.amountMinor.toString(),
          currency: cod.amountUsd?.currency ?? "USD",
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
