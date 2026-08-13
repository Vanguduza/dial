/**
 * Shared fixture helpers for PSP adapters — no live HTTP in fixture mode.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { WebhookAdmission } from "./types.js";

export function sha512Upper(concat: string): string {
  return createHash("sha512").update(concat, "utf8").digest("hex").toUpperCase();
}

export function hmacSha256Hex(secret: string, rawBody: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function parseJsonBody(rawBody: string): Record<string, unknown> {
  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function fixtureWebhook(input: {
  eventId: string;
  type: string;
  providerRef: string;
  status: WebhookAdmission["status"];
  payload?: unknown;
}): WebhookAdmission {
  return {
    eventId: input.eventId,
    type: input.type,
    providerRef: input.providerRef,
    status: input.status,
    payload: input.payload ?? {},
  };
}
