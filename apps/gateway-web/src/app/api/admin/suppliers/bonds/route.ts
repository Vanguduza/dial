/**
 * PD65 — Supplier bonds API (Pack §9.4). Fail closed without INTERNAL_API_SECRET.
 */
import { NextResponse } from "next/server";
import {
  holdSupplierBond,
  listStatements,
  listSupplierBonds,
  onboardSupplier,
  releaseSupplierBond,
} from "@dial/suppliers";

export const runtime = "nodejs";

function assertInternalSecret(req: Request): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INTERNAL_API_SECRET unset — fail closed" },
      { status: 503 },
    );
  }
  if ((req.headers.get("x-internal-secret") ?? "") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const url = new URL(req.url);
  const supplierId = url.searchParams.get("supplierId") ?? "";
  if (!supplierId) {
    return NextResponse.json({ error: "supplierId required" }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    bonds: listSupplierBonds(supplierId),
    statements: listStatements(supplierId).map((l) => ({
      ...l,
      amountMinor: l.amount.amountMinor.toString(),
      currency: l.amount.currency,
      amount: undefined,
    })),
    payableFromAi: false,
  });
}

export async function POST(req: Request) {
  const denied = assertInternalSecret(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.userId !== undefined || body.role !== undefined) {
    return NextResponse.json(
      { error: "userId/role from body rejected — session/secret SoR only (D-47)" },
      { status: 400 },
    );
  }
  const action = String(body.action ?? "");
  try {
    switch (action) {
      case "ensure_supplier": {
        const supplierId = String(body.supplierId ?? "sup_bond_ops");
        const profile = onboardSupplier({
          supplierId,
          displayName: String(body.displayName ?? "Bond Ops Supplier"),
          formality: "formal",
          tier: "bronze",
        });
        return NextResponse.json({ ok: true, profile, payableFromAi: false });
      }
      case "hold": {
        const bond = holdSupplierBond({
          supplierId: String(body.supplierId ?? ""),
          amountUsdMinor: BigInt(String(body.amountUsdMinor ?? "0")),
          ...(body.note != null ? { note: String(body.note) } : {}),
        });
        return NextResponse.json({
          ok: true,
          bond,
          payableFromAi: false,
          note: "PD65 — bond hold",
        });
      }
      case "release": {
        const bond = releaseSupplierBond({
          bondId: String(body.bondId ?? ""),
          releasedBy: String(body.releasedBy ?? "ops_bonds"),
        });
        return NextResponse.json({
          ok: true,
          bond,
          payableFromAi: false,
          note: "PD65 — bond release",
        });
      }
      default:
        return NextResponse.json(
          { error: "action must be ensure_supplier | hold | release" },
          { status: 400 },
        );
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "bond action failed" },
      { status: 400 },
    );
  }
}
