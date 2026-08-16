/**
 * Spare returns API — session + object-level AuthZ (D-47).
 */
import { NextResponse } from "next/server";
import {
  attachSpareReturnEvidence,
  getSpareOrderDurable,
  getSpareReturnClaim,
  openSpareReturnClaim,
  resolveSpareReturnClaim,
} from "@dial/catalogue";
import { apiError, newRequestId, parseJsonBody } from "@dial/shared";
import { z } from "zod";
import {
  assertResourceAccess,
  requireSession,
} from "../../../../lib/auth/session.js";

export const runtime = "nodejs";

async function assertOrderOwner(
  session: NonNullable<Awaited<ReturnType<typeof requireSession>>>,
  orderId: string,
): Promise<void> {
  const order = await getSpareOrderDurable(orderId);
  if (!order?.customerId) return;
  if (session.role === "ops_admin") return;
  assertResourceAccess({
    session,
    resourceOwnerId: order.customerId,
    resourceKind: "order",
  });
}

export async function GET(req: Request) {
  const requestId = newRequestId(req.headers.get("x-request-id"));
  const session = await requireSession(req);
  if (!session) {
    return NextResponse.json(apiError("session required", "unauthorized", requestId), {
      status: 401,
    });
  }
  const claimId = new URL(req.url).searchParams.get("claimId");
  if (!claimId) {
    return NextResponse.json(apiError("claimId required", "invalid_body", requestId), {
      status: 400,
    });
  }
  const claim = getSpareReturnClaim(claimId);
  if (!claim) {
    return NextResponse.json(apiError("Unknown claim", "not_found", requestId), {
      status: 404,
    });
  }
  try {
    await assertOrderOwner(session, claim.orderId);
  } catch (e) {
    return NextResponse.json(
      apiError(e instanceof Error ? e.message : "forbidden", "forbidden", requestId),
      { status: 403 },
    );
  }
  return NextResponse.json({ requestId, claim, payableFromAi: false });
}

export async function POST(req: Request) {
  const requestId = newRequestId(req.headers.get("x-request-id"));
  const session = await requireSession(req);
  if (!session) {
    return NextResponse.json(apiError("session required", "unauthorized", requestId), {
      status: 401,
    });
  }
  const schema = z
    .object({
      action: z.enum(["open", "resolve", "attach_evidence"]),
      orderId: z.string().optional(),
      claimId: z.string().optional(),
      path: z.enum(["refund", "replace", "refund_or_replace"]).optional(),
      kind: z.enum(["photo", "note"]).optional(),
      payloadRef: z.string().optional(),
    })
    .strict();
  const parsed = await parseJsonBody(req, schema);
  if (!parsed.ok) {
    return NextResponse.json(apiError(parsed.error, parsed.code, requestId), {
      status: 400,
    });
  }
  const body = parsed.data;
  try {
    if (body.action === "open") {
      if (!body.orderId) {
        return NextResponse.json(apiError("orderId required", "invalid_body", requestId), {
          status: 400,
        });
      }
      await assertOrderOwner(session, body.orderId);
      const claim = openSpareReturnClaim({
        orderId: body.orderId,
        path:
          body.path === "refund" || body.path === "replace"
            ? body.path
            : "refund_or_replace",
      });
      return NextResponse.json({ ok: true, requestId, claim, payableFromAi: false });
    }
    if (body.action === "attach_evidence") {
      if (!body.claimId || !body.payloadRef) {
        return NextResponse.json(
          apiError("claimId and payloadRef required", "invalid_body", requestId),
          { status: 400 },
        );
      }
      const existing = getSpareReturnClaim(body.claimId);
      if (existing) await assertOrderOwner(session, existing.orderId);
      const claim = attachSpareReturnEvidence({
        claimId: body.claimId,
        kind: body.kind === "note" ? "note" : "photo",
        payloadRef: body.payloadRef,
      });
      return NextResponse.json({ ok: true, requestId, claim, payableFromAi: false });
    }
    if (body.action === "resolve") {
      if (!body.claimId || (body.path !== "refund" && body.path !== "replace")) {
        return NextResponse.json(
          apiError("claimId and path refund|replace required", "invalid_body", requestId),
          { status: 400 },
        );
      }
      const existing = getSpareReturnClaim(body.claimId);
      if (existing) await assertOrderOwner(session, existing.orderId);
      const claim = resolveSpareReturnClaim({
        claimId: body.claimId,
        path: body.path,
      });
      return NextResponse.json({ ok: true, requestId, claim, payableFromAi: false });
    }
    return NextResponse.json(
      apiError("action must be open|attach_evidence|resolve", "invalid_body", requestId),
      { status: 400 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "returns failed";
    const status = msg.startsWith("IDOR") ? 403 : 400;
    return NextResponse.json(
      apiError(msg, status === 403 ? "forbidden" : "bad_request", requestId),
      { status },
    );
  }
}
