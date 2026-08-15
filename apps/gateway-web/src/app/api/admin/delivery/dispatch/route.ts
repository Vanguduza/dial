/**
 * PD10 admin delivery dispatch board — @dial/delivery SoR (D-45).
 * Fail closed without INTERNAL_API_SECRET.
 */
import { NextResponse } from "next/server";
import {
  createDeliveryJob,
  getDispatchBoardSnapshot,
  manualOverrideAssign,
  setCourierAvailabilityStatus,
  startDeliveryDispatchWorkflow,
} from "@dial/delivery";
import { listMoneyOutbox } from "@dial/ledger";
import {
  ensureDefaultMetricContracts,
  setMetricObservedValue,
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
  if ((req.headers.get("x-internal-secret") ?? "") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

function refreshMetricBindings(board: ReturnType<typeof getDispatchBoardSnapshot>) {
  ensureDefaultMetricContracts();
  setMetricObservedValue("metric.dispatch_fifo_depth", board.fifoJobIds.length);
  setMetricObservedValue("metric.money_outbox_depth", listMoneyOutbox().length);
  const pods = board.jobs.filter((j) => j.status === "pod_captured").length;
  const done = board.jobs.filter(
    (j) => j.status === "pod_captured" || j.status === "in_transit" || j.status === "assigned",
  ).length;
  setMetricObservedValue(
    "metric.on_time_pod",
    done === 0 ? 1 : pods / Math.max(1, done),
  );
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const board = getDispatchBoardSnapshot();
  refreshMetricBindings(board);
  return NextResponse.json({
    ok: true,
    board: {
      ...board,
      jobs: board.jobs.map((j) => ({
        ...j,
        codAmountUsdMinor: j.codAmountUsd?.amountMinor.toString(),
        codCurrency: j.codAmountUsd?.currency,
        codAmountUsd: undefined,
      })),
    },
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session/secret SoR only (D-47)" },
      { status: 400 },
    );
  }
  const action = String(body.action ?? "");
  try {
    switch (action) {
      case "seed_fifo_job": {
        const courierId = String(body.courierId ?? "cour_ops");
        // No available couriers → FIFO (dispatch board depth).
        setCourierAvailabilityStatus(courierId, "offline");
        const job = createDeliveryJob({
          orderId: String(body.orderId ?? `ord_pd10_${Date.now().toString(36)}`),
          from: "supplier_hub",
          to: "customer_pin",
          codUsdMinor: BigInt(String(body.codUsdMinor ?? "1500")),
        });
        const wf = startDeliveryDispatchWorkflow(job.id);
        const board = getDispatchBoardSnapshot();
        refreshMetricBindings(board);
        return NextResponse.json({
          ok: true,
          jobId: job.id,
          workflowPhase: wf.phase,
          fifoJobIds: board.fifoJobIds,
        });
      }
      case "seed_offer_job": {
        const courierId = String(body.courierId ?? "cour_ops");
        setCourierAvailabilityStatus(courierId, "available");
        const job = createDeliveryJob({
          orderId: String(body.orderId ?? `ord_pd10_${Date.now().toString(36)}`),
          from: "supplier_hub",
          to: "customer_pin",
          codUsdMinor: BigInt(String(body.codUsdMinor ?? "1500")),
        });
        const wf = startDeliveryDispatchWorkflow(job.id);
        const board = getDispatchBoardSnapshot();
        refreshMetricBindings(board);
        return NextResponse.json({
          ok: true,
          jobId: job.id,
          offerId: board.jobs.find((j) => j.id === job.id)?.offerId,
          workflowPhase: wf.phase,
          fifoJobIds: board.fifoJobIds,
        });
      }
      case "manual_override_assign": {
        const jobId = String(body.jobId ?? "");
        const courierId = String(body.courierId ?? "");
        const assignedBy = String(body.assignedBy ?? "ops_dispatch");
        if (!jobId || !courierId) {
          return NextResponse.json(
            { error: "jobId and courierId required" },
            { status: 400 },
          );
        }
        const job = manualOverrideAssign({ jobId, courierId, assignedBy });
        const board = getDispatchBoardSnapshot();
        refreshMetricBindings(board);
        return NextResponse.json({
          ok: true,
          job: {
            id: job.id,
            status: job.status,
            assignedCourierId: job.assignedCourierId,
            orderId: job.orderId,
          },
          fifoJobIds: board.fifoJobIds,
          payableFromAi: false,
          note: "PD56 — manual override assign",
        });
      }
      default:
        return NextResponse.json({ error: `unknown action ${action}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "dispatch action failed" },
      { status: 400 },
    );
  }
}
