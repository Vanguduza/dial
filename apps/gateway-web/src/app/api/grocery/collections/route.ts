/**
 * PD134 — Grocery home collections (Pack grocery / §9.2 parity).
 */
import { NextResponse } from "next/server";
import { listGroceryCollections } from "@dial/catalogue";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.has("userId") || url.searchParams.has("role")) {
    return NextResponse.json(
      { error: "role/userId from query rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  const session = getSessionFromToken(
    parseSessionCookie(req.headers.get("cookie")),
  );
  const sessionRole =
    session?.buyerSegment === "b2b" ? ("b2b" as const) : ("b2c" as const);
  const collections = listGroceryCollections(sessionRole);
  return NextResponse.json({
    collections,
    liquorAllowed: false,
    payableFromAi: false,
    note: "PD134 — grocery collections; food/pantry only",
  });
}
