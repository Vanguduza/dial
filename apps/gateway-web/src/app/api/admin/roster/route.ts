/**
 * PD123 — Schedule-X roster day board (D-46). Display-only; Cal.com stays slots.
 * Fail closed without INTERNAL_API_SECRET.
 */
import { NextResponse } from "next/server";
import {
  listRosterDayBoard,
  runPd123ScheduleXRosterThinVertical,
} from "@dial/jobs";

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
    const thin = await runPd123ScheduleXRosterThinVertical();
    return NextResponse.json({
      ok: true,
      thin,
      note: "PD123 — Schedule-X roster thin vertical",
    });
  }
  const day = url.searchParams.get("day") ?? undefined;
  const board = listRosterDayBoard(day ? { day } : undefined);
  return NextResponse.json({
    ok: true,
    board,
    note: "PD123 — Schedule-X roster (display-only; Cal.com slots unchanged)",
  });
}
