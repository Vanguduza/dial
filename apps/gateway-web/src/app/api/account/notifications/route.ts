/**
 * PD131 — Notification preference centre (channel × topic). Session SoR (D-47).
 */
import { NextResponse } from "next/server";
import {
  getNotificationPrefMatrix,
  setNotificationPref,
  type NotificationChannel,
  type NotificationTopic,
} from "@dial/identity";
import {
  getSessionFromToken,
  parseSessionCookie,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

function sessionOr401(req: Request) {
  return getSessionFromToken(parseSessionCookie(req.headers.get("cookie")));
}

function customerIdFromSession(email: string): string {
  return `cust_${email.split("@")[0]!.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
}

export async function GET(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    new URL(req.url).searchParams.has("userId") ||
    new URL(req.url).searchParams.has("role")
  ) {
    return NextResponse.json(
      { error: "role/userId from query rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  const customerId = customerIdFromSession(session.email);
  return NextResponse.json({
    matrix: getNotificationPrefMatrix(customerId),
    payableFromAi: false,
    note: "PD131 — channel×topic prefs; utility vs marketing",
  });
}

export async function POST(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    channel?: string;
    topic?: string;
    enabled?: boolean;
    userId?: string;
    role?: string;
  };
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "role/userId from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  if (typeof body.enabled !== "boolean" || !body.channel || !body.topic) {
    return NextResponse.json(
      { error: "channel, topic, enabled required" },
      { status: 400 },
    );
  }
  const customerId = customerIdFromSession(session.email);
  try {
    const matrix = setNotificationPref({
      customerId,
      channel: body.channel as NotificationChannel,
      topic: body.topic as NotificationTopic,
      enabled: body.enabled,
    });
    return NextResponse.json({
      ok: true,
      matrix,
      payableFromAi: false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "pref update failed" },
      { status: 400 },
    );
  }
}
