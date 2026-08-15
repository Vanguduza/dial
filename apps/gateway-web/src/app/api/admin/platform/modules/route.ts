/**
 * PD60 — domain module registry (D-53). Certification SoR = DB/registry, not Unleash.
 */
import { NextResponse } from "next/server";
import {
  listDomainModules,
  setDomainModuleCertification,
  type DomainModuleCert,
} from "@dial/shared";

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
  return NextResponse.json({
    ok: true,
    modules: listDomainModules(),
    unleashIsSor: false,
    publicMvpLadder: false,
    payableFromAi: false,
    note: "PD60 — domain module certification registry (D-53)",
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
  try {
    const moduleId = String(body.moduleId ?? "");
    const certification = String(body.certification ?? "") as DomainModuleCert;
    const updatedBy = String(body.updatedBy ?? "ops_platform");
    const row = setDomainModuleCertification({
      moduleId,
      certification,
      updatedBy,
    });
    return NextResponse.json({
      ok: true,
      module: row,
      unleashIsSor: false,
      publicMvpLadder: false,
      payableFromAi: false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "module update failed" },
      { status: 400 },
    );
  }
}
