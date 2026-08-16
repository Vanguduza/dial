/**
 * Prometheus text exposition. No secrets. Process-local counters only.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const startedAt = Date.now();

export async function GET(): Promise<NextResponse> {
  const body = [
    "# HELP dial_up 1 while this process is serving",
    "# TYPE dial_up gauge",
    "dial_up 1",
    "# HELP dial_process_uptime_seconds Process uptime",
    "# TYPE dial_process_uptime_seconds gauge",
    `dial_process_uptime_seconds ${(Date.now() - startedAt) / 1000}`,
    "",
  ].join("\n");
  return new NextResponse(body, {
    headers: { "content-type": "text/plain; version=0.0.4; charset=utf-8" },
  });
}
