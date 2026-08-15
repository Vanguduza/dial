/**
 * Admin Cost & health (PD22 / Pack §9.5 / D-47 / D-60).
 * Fail closed without INTERNAL_API_SECRET. IMTT = opex, never checkout line.
 */
import { NextResponse } from "next/server";
import {
  engageKillSwitch,
  recordImttOpex,
  recordOpsSpend,
  releaseKillSwitch,
  serializeCostHealthSnapshot,
  setCostThreshold,
  type CostChannel,
} from "@dial/payments";

export const runtime = "nodejs";

function assertInternalSecret(req: Request): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INTERNAL_API_SECRET unset — fail closed" },
      { status: 503 },
    );
  }
  const header = req.headers.get("x-internal-secret") ?? "";
  if (header !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

function parseChannel(raw: unknown): CostChannel | null {
  if (
    raw === "ai_litellm" ||
    raw === "cloud" ||
    raw === "sms_whatsapp"
  ) {
    return raw;
  }
  return null;
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  return NextResponse.json(serializeCostHealthSnapshot());
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;

  const body = (await req.json()) as Record<string, unknown>;
  const action = String(body.action ?? "");

  try {
    if (action === "record_spend") {
      const channel = parseChannel(body.channel);
      if (!channel || body.amountUsdMinor == null) {
        return NextResponse.json(
          { error: "channel and amountUsdMinor required" },
          { status: 400 },
        );
      }
      const bucket = recordOpsSpend({
        channel,
        amountUsdMinor: BigInt(String(body.amountUsdMinor)),
      });
      return NextResponse.json({
        ok: true,
        bucket: {
          ...bucket,
          spentUsdMinor: bucket.spentUsdMinor.toString(),
          thresholdUsdMinor: bucket.thresholdUsdMinor.toString(),
        },
        snapshot: serializeCostHealthSnapshot(),
      });
    }

    if (action === "set_threshold") {
      const channel = parseChannel(body.channel);
      if (!channel || body.thresholdUsdMinor == null) {
        return NextResponse.json(
          { error: "channel and thresholdUsdMinor required" },
          { status: 400 },
        );
      }
      const bucket = setCostThreshold({
        channel,
        thresholdUsdMinor: BigInt(String(body.thresholdUsdMinor)),
      });
      return NextResponse.json({
        ok: true,
        bucket: {
          ...bucket,
          spentUsdMinor: bucket.spentUsdMinor.toString(),
          thresholdUsdMinor: bucket.thresholdUsdMinor.toString(),
        },
      });
    }

    if (action === "engage_kill_switch") {
      const channel = parseChannel(body.channel);
      if (!channel) {
        return NextResponse.json({ error: "channel required" }, { status: 400 });
      }
      const bucket = engageKillSwitch(channel);
      return NextResponse.json({
        ok: true,
        bucket: {
          ...bucket,
          spentUsdMinor: bucket.spentUsdMinor.toString(),
          thresholdUsdMinor: bucket.thresholdUsdMinor.toString(),
        },
        snapshot: serializeCostHealthSnapshot(),
      });
    }

    if (action === "release_kill_switch") {
      const channel = parseChannel(body.channel);
      if (!channel) {
        return NextResponse.json({ error: "channel required" }, { status: 400 });
      }
      const bucket = releaseKillSwitch(channel);
      return NextResponse.json({
        ok: true,
        bucket: {
          ...bucket,
          spentUsdMinor: bucket.spentUsdMinor.toString(),
          thresholdUsdMinor: bucket.thresholdUsdMinor.toString(),
        },
      });
    }

    if (action === "record_imtt_opex") {
      const out = recordImttOpex(BigInt(String(body.amountUsdMinor ?? "0")));
      return NextResponse.json({
        ok: true,
        ...out,
        snapshot: serializeCostHealthSnapshot(),
      });
    }

    return NextResponse.json(
      {
        error:
          "action must be record_spend|set_threshold|engage_kill_switch|release_kill_switch|record_imtt_opex",
      },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "cost-health failed" },
      { status: 400 },
    );
  }
}
