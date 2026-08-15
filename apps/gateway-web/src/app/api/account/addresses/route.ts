/**
 * PD83 — customer delivery addresses (Pack customers.addresses). Session SoR.
 */
import { NextResponse } from "next/server";
import {
  addCustomerAddress,
  deleteCustomerAddress,
  listCustomerAddresses,
  setDefaultCustomerAddress,
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
  const url = new URL(req.url);
  if (url.searchParams.has("userId") || url.searchParams.has("role")) {
    return NextResponse.json(
      { error: "role/userId from query rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  const customerId = customerIdFromSession(session.email);
  return NextResponse.json({
    addresses: listCustomerAddresses(customerId),
    mapSor: "maplibre",
    payableFromAi: false,
    note: "PD83 — delivery addresses pin+landmark+phone",
  });
}

export async function POST(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    label?: string;
    lat?: number;
    lng?: number;
    landmark?: string;
    phoneE164?: string;
    isDefault?: boolean;
    userId?: string;
    role?: string;
  };
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "role/userId from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  const customerId = customerIdFromSession(session.email);
  try {
    const address = addCustomerAddress({
      customerId,
      label: String(body.label ?? ""),
      lat: Number(body.lat),
      lng: Number(body.lng),
      landmark: String(body.landmark ?? ""),
      phoneE164: String(body.phoneE164 ?? ""),
      ...(body.isDefault !== undefined ? { isDefault: body.isDefault } : {}),
    });
    return NextResponse.json({ ok: true, address, mapSor: "maplibre" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "address failed" },
      { status: 400 },
    );
  }
}

export async function PATCH(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    addressId?: string;
    setDefault?: boolean;
    userId?: string;
  };
  if (body.userId !== undefined) {
    return NextResponse.json(
      { error: "userId from body rejected — session SoR only (D-47)" },
      { status: 400 },
    );
  }
  const customerId = customerIdFromSession(session.email);
  try {
    if (body.setDefault === true && body.addressId) {
      const address = setDefaultCustomerAddress({
        customerId,
        addressId: body.addressId,
      });
      return NextResponse.json({ ok: true, address });
    }
    return NextResponse.json({ error: "setDefault + addressId required" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "address update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: Request) {
  const session = sessionOr401(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const addressId = url.searchParams.get("addressId");
  if (!addressId) {
    return NextResponse.json({ error: "addressId required" }, { status: 400 });
  }
  const customerId = customerIdFromSession(session.email);
  try {
    const result = deleteCustomerAddress({ customerId, addressId });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "address delete failed" },
      { status: 400 },
    );
  }
}
