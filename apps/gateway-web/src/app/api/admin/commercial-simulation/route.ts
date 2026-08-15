/**
 * Admin Commercial Simulation (PD23 / Pack §9.5 / D-53 / D-54).
 * Fail closed without INTERNAL_API_SECRET. Simulated never auto-pays.
 */
import { NextResponse } from "next/server";
import {
  attemptCommercialSimPayout,
  commercialSimSnapshot,
  completeCommercialSimRun,
  createCommercialSimRun,
  setCommercialSimMode,
  startCommercialSimRun,
  type CommercialSimMode,
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

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  return NextResponse.json({
    ...commercialSimSnapshot(),
    note: "Simulated never auto-pays (D-54). Not money SoR.",
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json()) as Record<string, unknown>;
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected (D-47)" },
      { status: 400 },
    );
  }
  const action = String(body.action ?? "");
  try {
    if (action === "create_run") {
      const mode = (
        body.mode === "actual" ? "actual" : "simulated"
      ) as CommercialSimMode;
      const run = createCommercialSimRun({
        title: String(body.title ?? "Scenario"),
        mode,
        projectedMarginMinor: BigInt(String(body.projectedMarginMinor ?? "0")),
      });
      return NextResponse.json({
        ok: true,
        run: {
          ...run,
          projectedMarginMinor: run.projectedMarginMinor.toString(),
        },
        snapshot: commercialSimSnapshot(),
      });
    }

    if (action === "set_mode") {
      const run = setCommercialSimMode({
        runId: String(body.runId ?? ""),
        mode: (body.mode === "actual" ? "actual" : "simulated") as CommercialSimMode,
      });
      return NextResponse.json({
        ok: true,
        run: {
          ...run,
          projectedMarginMinor: run.projectedMarginMinor.toString(),
        },
        snapshot: commercialSimSnapshot(),
      });
    }

    if (action === "start") {
      const run = startCommercialSimRun(String(body.runId ?? ""));
      return NextResponse.json({
        ok: true,
        run: {
          ...run,
          projectedMarginMinor: run.projectedMarginMinor.toString(),
        },
      });
    }

    if (action === "complete") {
      const run = completeCommercialSimRun(String(body.runId ?? ""));
      return NextResponse.json({
        ok: true,
        run: {
          ...run,
          projectedMarginMinor: run.projectedMarginMinor.toString(),
        },
      });
    }

    if (action === "attempt_payout") {
      try {
        const result = attemptCommercialSimPayout({
          runId: String(body.runId ?? ""),
          amountMinor: BigInt(String(body.amountMinor ?? "0")),
        });
        return NextResponse.json({
          ok: true,
          payout: result,
          autoPayAllowed: false,
          snapshot: commercialSimSnapshot(),
        });
      } catch (e) {
        return NextResponse.json(
          {
            ok: false,
            autoPayAllowed: false,
            error: e instanceof Error ? e.message : "payout blocked",
            snapshot: commercialSimSnapshot(),
          },
          { status: 403 },
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "action must be create_run|set_mode|start|complete|attempt_payout",
      },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "commercial sim failed" },
      { status: 400 },
    );
  }
}
