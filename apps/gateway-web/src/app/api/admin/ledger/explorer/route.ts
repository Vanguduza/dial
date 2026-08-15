/**
 * PD126 — Formance Console *pattern* ledger explorer (D-46).
 * DIAL @dial/ledger remains money SoR. Fail closed without INTERNAL_API_SECRET.
 */
import { NextResponse } from "next/server";
import {
  getLedgerExplorerSnapshot,
  runPd126FormanceConsoleExplorerThinVertical,
} from "@dial/ledger";

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
    const thin = runPd126FormanceConsoleExplorerThinVertical();
    return NextResponse.json({
      ok: true,
      thin,
      note: "PD126 — Formance Console explorer thin vertical",
    });
  }
  const snapshot = getLedgerExplorerSnapshot();
  return NextResponse.json({
    ok: true,
    snapshot,
    note: "PD126 — ledger explorer (Formance Console pattern); DIAL ledger SoR",
  });
}
