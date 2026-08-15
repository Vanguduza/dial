/**
 * PD124 — Tracktor fleet expiry / maintenance board (D-46).
 * Fail closed without INTERNAL_API_SECRET. Not courier GPS SoR.
 */
import { NextResponse } from "next/server";
import {
  getFleetExpiryBoard,
  runPd124TracktorFleetExpiryThinVertical,
} from "@dial/catalogue";

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
    const thin = runPd124TracktorFleetExpiryThinVertical();
    return NextResponse.json({
      ok: true,
      thin,
      note: "PD124 — Tracktor fleet expiry thin vertical",
    });
  }
  const board = getFleetExpiryBoard();
  return NextResponse.json({
    ok: true,
    board,
    note: "PD124 — Tracktor fleet expiry board; not dispatch SoR",
  });
}
