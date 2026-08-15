/**
 * PD121 — BullMQ inspector snapshot (bull-board pattern; D-46).
 * Fail closed without INTERNAL_API_SECRET. Never money SoR.
 */
import { NextResponse } from "next/server";
import {
  getQueueInspectorSnapshot,
  runPd121BullBoardInspectorThinVertical,
} from "@dial/queues";

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

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const url = new URL(req.url);
  if (url.searchParams.get("view") === "thin") {
    const thin = await runPd121BullBoardInspectorThinVertical();
    return NextResponse.json({
      ok: true,
      thin,
      note: "PD121 — bull-board inspector thin vertical",
    });
  }
  const snapshot = getQueueInspectorSnapshot();
  return NextResponse.json({
    ok: true,
    snapshot,
    note: "PD121 — queue inspector (bull-board pattern); not money SoR",
  });
}
