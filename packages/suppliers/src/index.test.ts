import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import {
  __resetSuppliersForTests,
  confirmOrder,
  enqueueConfirmOrder,
  listConfirmQueue,
  listHeartbeats,
  listStatements,
  onboardSupplier,
  postHeartbeat,
  runPd6SupplierThinVertical,
  uploadSupplierCosts,
} from "./index.js";

beforeEach(() => {
  __resetSuppliersForTests();
});

test("PD6 thin vertical: onboard → upload → heartbeat → confirm → statements", () => {
  const result = runPd6SupplierThinVertical();
  assert.equal(result.currency, "USD");
  assert.equal(result.profile.offerSource, "MARKETPLACE");
  assert.equal(result.profile.tier, "silver");
  assert.equal(result.confirmStatus, "confirmed");
  assert.equal(result.statementLineIds.length, 2);
  assert.ok(listHeartbeats(result.profile.supplierId).length >= 1);
  assert.ok(listStatements(result.profile.supplierId).some((l) => l.kind === "coop_spend"));
});

test("PD6 cost upload rejects float-like non-bigint", () => {
  onboardSupplier({
    supplierId: "sup_a",
    displayName: "A",
    formality: "formal",
    tier: "bronze",
  });
  assert.throws(
    () =>
      uploadSupplierCosts({
        supplierId: "sup_a",
        rows: [
          {
            sku: "X",
            title: "X",
            // @ts-expect-error intentional
            costUsdMinor: 1.5,
            qty: 1,
          },
        ],
      }),
    /bigint/,
  );
});

test("PD6 confirm SLA breach blocks confirm", () => {
  onboardSupplier({
    supplierId: "sup_b",
    displayName: "B",
    formality: "formal",
    tier: "gold",
  });
  const order = enqueueConfirmOrder({
    supplierId: "sup_b",
    amountUsdMinor: 10_00n,
    slaMs: 1,
  });
  const now = Date.now() + 1000;
  const queue = listConfirmQueue("sup_b", now);
  assert.equal(queue.find((o) => o.orderId === order.orderId)?.status, "sla_breached");
  assert.throws(
    () => confirmOrder({ supplierId: "sup_b", orderId: order.orderId, now }),
    /SLA breached/,
  );
});

test("PD6 heartbeat channels dashboard|whatsapp", () => {
  onboardSupplier({
    supplierId: "sup_c",
    displayName: "C",
    formality: "informal",
    tier: "bronze",
  });
  postHeartbeat({ supplierId: "sup_c", channel: "whatsapp", note: "ping" });
  assert.equal(listHeartbeats("sup_c")[0]?.channel, "whatsapp");
});
