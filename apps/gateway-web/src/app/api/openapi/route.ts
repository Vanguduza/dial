/**
 * S134 — serve OpenAPI skeleton for health + webhook integration surface.
 * Never embeds secrets (D-47).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

let cached: unknown | null = null;

function loadSpec(): unknown {
  if (cached) return cached;
  const candidates = [
    join(process.cwd(), "docs/integrations/openapi-gateway.json"),
    join(process.cwd(), "../../docs/integrations/openapi-gateway.json"),
  ];
  for (const p of candidates) {
    try {
      cached = JSON.parse(readFileSync(p, "utf8")) as unknown;
      return cached;
    } catch {
      /* try next */
    }
  }
  throw new Error("openapi-gateway.json not found");
}

export async function GET(): Promise<NextResponse> {
  try {
    const spec = loadSpec();
    return NextResponse.json(spec, {
      headers: {
        "cache-control": "public, max-age=60",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "openapi skeleton unavailable" },
      { status: 500 },
    );
  }
}
