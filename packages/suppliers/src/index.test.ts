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
  runPd38HeartbeatSlaThinVertical,
  runPd65SupplierBondThinVertical,
  runPd71OrderFailoverAcceptThinVertical,
  runPd84SupplierStockUploadThinVertical,
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

test("PD65 supplier bond hold → release", () => {
  const out = runPd65SupplierBondThinVertical();
  assert.equal(out.bondHeldThenReleased, true);
  assert.ok(out.bondStatementLines >= 2);
  assert.equal(out.currency, "USD");
  assert.equal(out.payableFromAi, false);
});

test("PD116 supplier statement PDF stub", async () => {
  const { runPd116SupplierStatementPdfThinVertical } = await import("./index.js");
  const out = runPd116SupplierStatementPdfThinVertical();
  assert.equal(out.lineCount, 2);
  assert.equal(out.format, "text/plain+pdf-stub");
  assert.equal(out.payableFromAi, false);
  assert.ok(out.documentId);
});

test("PD71 order failover accept after SLA breach", () => {
  const out = runPd71OrderFailoverAcceptThinVertical();
  assert.equal(out.failoverAccepted, true);
  assert.equal(out.toSupplierId, "sup_pd71_b");
  assert.equal(out.payableFromAi, false);
});

test("PD84 supplier stock upload pending_review", () => {
  const out = runPd84SupplierStockUploadThinVertical();
  assert.equal(out.status, "pending_review");
  assert.equal(out.rowCount, 2);
  assert.equal(out.offerSource, "MARKETPLACE");
  assert.equal(out.payableFromAi, false);
});

test("PD93 customer shadow failover thin vertical", async () => {
  const { runPd93CustomerShadowFailoverThinVertical } = await import("./index.js");
  const out = runPd93CustomerShadowFailoverThinVertical();
  assert.equal(out.listed, true);
  assert.equal(out.accepted, true);
  assert.equal(out.toSupplierId, "sup_pd93_b");
  assert.equal(out.payableFromAi, false);
});

test("PD103 failover Idempotency-Key thin vertical", async () => {
  const { runPd103FailoverIdempotencyKeyThinVertical } = await import("./index.js");
  const out = runPd103FailoverIdempotencyKeyThinVertical();
  assert.equal(out.missingRejected, true);
  assert.equal(out.replaySameOrder, true);
  assert.equal(out.payableFromAi, false);
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

test("PD125 tableflow CSV preview", async () => {
  const { runPd125TableflowCsvPreviewThinVertical } = await import("./index.js");
  const out = runPd125TableflowCsvPreviewThinVertical();
  assert.ok(out.validCount >= 2);
  assert.ok(out.invalidCount >= 1);
  assert.equal(out.ingested, false);
  assert.equal(out.tableflowCloudSor, false);
  assert.equal(out.payableFromAi, false);
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

test("PD38 heartbeat SLA + confirm breach escalations", () => {
  const out = runPd38HeartbeatSlaThinVertical();
  assert.equal(out.heartbeatMissingEscalate, true);
  assert.equal(out.confirmBreachEscalate, true);
  assert.equal(out.acked, true);
  assert.equal(out.healthyAfterHeartbeat, true);
  assert.equal(out.payableFromAi, false);
});
