import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetPaymentsForTests,
  createCheckoutPayment,
  getActiveFxRate,
  setDailyZigRate,
  usdToZig,
} from "./index.js";

test("daily ZiG rate converts USD minor to ZWG with fx_rate_id", () => {
  __resetPaymentsForTests();
  const rate = setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "ops_test" });
  assert.equal(getActiveFxRate()?.fxRateId, rate.fxRateId);
  const zig = usdToZig(10_00n, rate);
  assert.equal(zig.currency, "ZWG");
  assert.equal(zig.amountMinor, 10_00n * 2500_00n / 100n);
});

test("checkout EcoCash button creates intent with ZWG display + fx_rate_id", async () => {
  __resetPaymentsForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "ops_test" });
  const { intent } = await createCheckoutPayment({
    choice: "ecocash",
    orderId: "ord_1",
    amountUsdMinor: 15_00n,
    idempotencyKey: "eco-1",
  });
  assert.ok(intent);
  assert.equal(intent!.method, "ecocash_direct");
  assert.equal(intent!.amount.currency, "USD");
  assert.equal(intent!.displayPayable?.currency, "ZWG");
  assert.ok(intent!.fxRateId);
  assert.equal(intent!.status, "awaiting_customer");
});

test("checkout COD button places COD order settle USD + indicative ZiG", async () => {
  __resetPaymentsForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "ops_test" });
  const { intent, codOrder } = await createCheckoutPayment({
    choice: "cod",
    orderId: "ord_2",
    amountUsdMinor: 20_00n,
    idempotencyKey: "cod-1",
  });
  assert.ok(codOrder);
  assert.equal(codOrder!.amountUsd.currency, "USD");
  assert.equal(codOrder!.indicativeZig.currency, "ZWG");
  assert.equal(intent?.method, "cod_cash");
  assert.equal(intent?.status, "authorized");
});

test("payment intent idempotency key is no-op on replay", async () => {
  __resetPaymentsForTests();
  setDailyZigRate({ zigMinorPerUsd: 2500_00n, setBy: "ops_test" });
  const a = await createCheckoutPayment({
    choice: "ecocash",
    orderId: "ord_3",
    amountUsdMinor: 5_00n,
    idempotencyKey: "same-key",
  });
  const b = await createCheckoutPayment({
    choice: "ecocash",
    orderId: "ord_3",
    amountUsdMinor: 5_00n,
    idempotencyKey: "same-key",
  });
  assert.equal(a.intent?.id, b.intent?.id);
});
