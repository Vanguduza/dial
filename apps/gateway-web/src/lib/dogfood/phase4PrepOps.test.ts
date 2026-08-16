/**
 * Phase 4 prep dogfood — confirm-SLA board API, two-supplier Factory, B2B leak=0.
 * Does not claim G4 (needs DATABASE_URL + Meili publish on sandbox).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runPhase4PrepTwoSupplierFactoryReadyThinVertical } from "@dial/suppliers";
import {
  GET as confirmSlaGet,
  POST as confirmSlaPost,
} from "../../app/api/admin/suppliers/confirm-sla/route.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("Phase4-prep admin confirm-SLA page shell", () => {
  const page = readFileSync(
    join(root, "app/admin/suppliers/confirm-sla/page.tsx"),
    "utf8",
  );
  assert.match(page, /admin-confirm-sla/);
  assert.match(page, /confirm-sla-message/);
  assert.match(page, /x-internal-secret/);
  assert.match(page, /no AI payable writes/i);
});

test("Phase4-prep confirm-SLA API fail-closed + seed board + IDOR guard", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  delete process.env.INTERNAL_API_SECRET;
  try {
    const closed = await confirmSlaGet(
      new Request("http://localhost/api/admin/suppliers/confirm-sla"),
    );
    assert.equal(closed.status, 503);
    const closedBody = (await closed.json()) as { error: string };
    assert.match(closedBody.error, /INTERNAL_API_SECRET/);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }

  process.env.INTERNAL_API_SECRET = "p4_confirm_sla_secret";
  try {
    const badSecret = await confirmSlaGet(
      new Request("http://localhost/api/admin/suppliers/confirm-sla", {
        headers: { "x-internal-secret": "wrong" },
      }),
    );
    assert.equal(badSecret.status, 401);

    const seed = await confirmSlaPost(
      new Request("http://localhost/api/admin/suppliers/confirm-sla", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p4_confirm_sla_secret",
        },
        body: JSON.stringify({ action: "seed_board" }),
      }),
    );
    assert.equal(seed.status, 200);
    const seedBody = (await seed.json()) as {
      seeded: boolean;
      queueCount: number;
      openEscalations: number;
      payableFromAi: false;
    };
    assert.equal(seedBody.seeded, true);
    assert.ok(seedBody.queueCount >= 1);
    assert.ok(seedBody.openEscalations >= 1);
    assert.equal(seedBody.payableFromAi, false);

    const board = await confirmSlaGet(
      new Request("http://localhost/api/admin/suppliers/confirm-sla", {
        headers: { "x-internal-secret": "p4_confirm_sla_secret" },
      }),
    );
    assert.equal(board.status, 200);
    const boardBody = (await board.json()) as {
      queue: Array<{ orderId: string; supplierId: string; status: string }>;
      openEscalations: Array<{ escalationId: string }>;
      payableFromAi: false;
    };
    assert.ok(boardBody.queue.length >= 1);
    assert.ok(boardBody.openEscalations.length >= 1);
    assert.equal(boardBody.payableFromAi, false);

    const confirmable = boardBody.queue.find((o) => o.status === "awaiting_confirm");
    assert.ok(confirmable, "expected at least one awaiting_confirm order");
    const confirmed = await confirmSlaPost(
      new Request("http://localhost/api/admin/suppliers/confirm-sla", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p4_confirm_sla_secret",
        },
        body: JSON.stringify({
          action: "confirm",
          supplierId: confirmable.supplierId,
          orderId: confirmable.orderId,
        }),
      }),
    );
    assert.equal(confirmed.status, 200);

    const bodyReject = await confirmSlaPost(
      new Request("http://localhost/api/admin/suppliers/confirm-sla", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p4_confirm_sla_secret",
        },
        body: JSON.stringify({ action: "seed_board", userId: "evil" }),
      }),
    );
    assert.equal(bodyReject.status, 400);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("Phase4-prep two-supplier Factory + B2B leak=0 (fixture CI)", async () => {
  const suppliers = await runPhase4PrepTwoSupplierFactoryReadyThinVertical();
  assert.ok(suppliers.formalFactoryRows >= 1);
  assert.ok(suppliers.informalFactoryRows >= 1);
  assert.equal(suppliers.b2bInformalLeak, 0);
  assert.equal(suppliers.confirmPersisted, "fixture_skip");
  assert.equal(suppliers.coopPersisted, "fixture_skip");
  assert.ok(suppliers.confirmBoardOrders >= 1);
  assert.ok(suppliers.slaEscalationsOpen >= 1);
  assert.equal(suppliers.offerSource, "MARKETPLACE");
  assert.equal(suppliers.payableFromAi, false);
  assert.equal(suppliers.liquorAllowed, false);
});
