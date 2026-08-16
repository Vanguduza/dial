import assert from "node:assert/strict";
import { test } from "node:test";
import {
  persistOfferSnapshotDurable,
  persistOrderDurable,
  persistFdmsOutboxDurable,
} from "./durableCommerce.js";

test("G2 durable commerce fixture skips network", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  assert.equal(
    await persistOfferSnapshotDurable({
      snapshotId: "ofs_fix",
      offerId: "off_a",
      priceMinor: 1000n,
      supplierFormality: "formal",
    }),
    "fixture_skip",
  );
  assert.equal(
    await persistOrderDurable({
      orderId: "ord_fix",
      customerId: "cust_fx",
      status: "confirmed",
      totalMinor: 1000n,
      lines: [
        {
          lineId: "ol_1",
          offerId: "off_a",
          title: "Filter",
          qty: 1,
          unitPriceMinor: 1000n,
        },
      ],
    }),
    "fixture_skip",
  );
  assert.equal(
    await persistFdmsOutboxDurable({
      id: "fdms_fx",
      orderId: "ord_fix",
      receiptClass: "GOODS_FORMAL",
      amountMinor: 1000n,
      currency: "USD",
      channel: "web",
      status: "queued",
    }),
    "fixture_skip",
  );
});

test("G2 durable commerce sandbox fail closed without Supabase", async () => {
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_ANON_KEY;
  await assert.rejects(() =>
    persistOfferSnapshotDurable({
      snapshotId: "ofs_x",
      offerId: "off_x",
      priceMinor: 1n,
      supplierFormality: "formal",
    }),
  );
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});
