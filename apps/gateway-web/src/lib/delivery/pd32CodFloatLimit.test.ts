/**
 * PD32 Delivery COD float-limit warning (Pack §9.8 / D-7).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetDeliveryForTests,
  runPd32CodFloatLimitThinVertical,
} from "@dial/delivery";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { POST as courierPost } from "../../app/api/delivery/courier/route.js";

const androidRoot = join(process.cwd(), "../delivery-android");

test("PD32 Android Compose: COD float-limit warn", () => {
  const client = readFileSync(
    join(
      androidRoot,
      "core/network/src/main/kotlin/zw/co/dial/delivery/network/DialDeliveryClient.kt",
    ),
    "utf8",
  );
  const app = readFileSync(
    join(androidRoot, "app/src/main/java/zw/co/dial/delivery/ui/DeliveryApp.kt"),
    "utf8",
  );
  assert.match(client, /set_cod_float_limit|setCodFloatLimit/);
  assert.match(client, /evaluate_cod_float|evaluateCodFloat/);
  assert.match(client, /cod_collect_attempt|codCollectAttempt/);
  assert.match(client, /identity fields forbidden|never send userId/);
  assert.match(app, /float|COD/);
  assert.match(app, /@Composable/);
});

test("PD32 package thin vertical", () => {
  const out = runPd32CodFloatLimitThinVertical();
  assert.equal(out.withinLimitNoWarn, true);
  assert.equal(out.overLimitWarned, true);
  assert.equal(out.blockedWithoutAck, true);
  assert.equal(out.recordedWithAck, true);
  assert.equal(out.payableFromAi, false);
  assert.equal(out.currency, "USD");
});

test("PD32 API: float warn blocks until ack", async () => {
  __resetDeliveryForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "rider.pd32@dial.test",
    buyerSegment: "b2c",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const headers = {
    "content-type": "application/json",
    cookie,
  };

  await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "set_cod_float_limit",
        floatLimitUsdMinor: "5000",
      }),
    }),
  );

  const seed = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "seed_offer", codUsdMinor: "6000" }),
    }),
  );
  assert.equal(seed.status, 200);
  const seedJson = (await seed.json()) as {
    offer: { id: string };
    job: { id: string };
  };
  await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "accept_offer",
        offerId: seedJson.offer.id,
      }),
    }),
  );

  const evalRes = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "evaluate_cod_float",
        collectUsdMinor: "6000",
      }),
    }),
  );
  assert.equal(evalRes.status, 200);
  const evalJson = (await evalRes.json()) as {
    evaluation: { floatLimitWarning: boolean };
  };
  assert.equal(evalJson.evaluation.floatLimitWarning, true);

  const blocked = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "cod_collect_attempt",
        jobId: seedJson.job.id,
        collectUsdMinor: "6000",
        acknowledgedWarning: false,
      }),
    }),
  );
  assert.equal(blocked.status, 200);
  const blockedJson = (await blocked.json()) as {
    ok: boolean;
    attempt: { status: string };
  };
  assert.equal(blockedJson.ok, false);
  assert.equal(blockedJson.attempt.status, "blocked_unacked_warning");

  const acked = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "cod_collect_attempt",
        jobId: seedJson.job.id,
        collectUsdMinor: "6000",
        acknowledgedWarning: true,
      }),
    }),
  );
  assert.equal(acked.status, 200);
  const ackedJson = (await acked.json()) as {
    ok: boolean;
    attempt: { status: string; floatLimitWarning: boolean };
  };
  assert.equal(ackedJson.ok, true);
  assert.equal(ackedJson.attempt.status, "recorded");
  assert.equal(ackedJson.attempt.floatLimitWarning, true);

  const reject = await courierPost(
    new Request("http://localhost/api/delivery/courier", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "evaluate_cod_float",
        collectUsdMinor: "100",
        userId: "evil",
      }),
    }),
  );
  assert.equal(reject.status, 400);
});
