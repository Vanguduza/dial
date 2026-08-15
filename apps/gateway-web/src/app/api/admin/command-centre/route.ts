/**
 * PD10 Command Centre API — MetricContract tiles + Actual vs Simulated (D-54).
 * Fail closed without INTERNAL_API_SECRET. Simulated never auto-pays.
 */
import { NextResponse } from "next/server";
import {
  attemptCommandCentrePayout,
  commandCentreBanner,
  ensureDefaultMetricContracts,
  listMetricTiles,
  setMetricObservedValue,
  type CommandCentreMode,
} from "@dial/ai";
import { getDispatchBoardSnapshot } from "@dial/delivery";
import { listMoneyOutbox } from "@dial/ledger";

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

function bindLiveObservations() {
  ensureDefaultMetricContracts();
  const board = getDispatchBoardSnapshot();
  setMetricObservedValue("metric.dispatch_fifo_depth", board.fifoJobIds.length);
  setMetricObservedValue("metric.money_outbox_depth", listMoneyOutbox().length);
  const pods = board.jobs.filter((j) => j.status === "pod_captured").length;
  const denom = Math.max(1, board.jobs.length);
  setMetricObservedValue("metric.on_time_pod", pods / denom);
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") === "simulated"
    ? "simulated"
    : "actual") as CommandCentreMode;
  bindLiveObservations();
  const banner = commandCentreBanner(mode);
  const tiles = listMetricTiles(mode);
  return NextResponse.json({
    ok: true,
    banner,
    tiles,
    contracts: ensureDefaultMetricContracts(),
    note: "Simulated never auto-pays (D-54). CC is not money SoR.",
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    mode?: string;
    amountMinor?: string;
  };
  if ((body as { userId?: unknown }).userId !== undefined || (body as { role?: unknown }).role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected (D-47)" },
      { status: 400 },
    );
  }
  const action = String(body.action ?? "");
  const mode = (body.mode === "simulated" ? "simulated" : "actual") as CommandCentreMode;
  try {
    if (action === "attempt_payout") {
      const amountMinor = BigInt(body.amountMinor ?? "0");
      try {
        const result = attemptCommandCentrePayout({ mode, amountMinor });
        return NextResponse.json({
          ok: true,
          mode,
          payout: result,
          autoPayAllowed: false,
        });
      } catch (e) {
        return NextResponse.json(
          {
            ok: false,
            mode,
            autoPayAllowed: false,
            error: e instanceof Error ? e.message : "payout blocked",
          },
          { status: mode === "simulated" ? 403 : 400 },
        );
      }
    }
    if (action === "refresh_tiles") {
      bindLiveObservations();
      return NextResponse.json({
        ok: true,
        banner: commandCentreBanner(mode),
        tiles: listMetricTiles(mode),
      });
    }
    return NextResponse.json({ error: `unknown action ${action}` }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "command centre failed" },
      { status: 400 },
    );
  }
}
