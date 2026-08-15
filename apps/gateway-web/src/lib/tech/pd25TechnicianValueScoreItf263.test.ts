/**
 * PD25 Technician Android Value Score + ITF263 (Pack §9.7 / D-50 / D-53).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetJobsForTests,
  runPd25ValueScoreDeviceThinVertical,
} from "@dial/jobs";
import {
  __resetPaymentsForTests,
  runPd25Itf263TakeHomeThinVertical,
} from "@dial/payments";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import {
  GET as techGet,
  POST as techPost,
} from "../../app/api/tech/technician/route.js";

const androidRoot = join(process.cwd(), "../technician-android");

test("PD25 Android Compose: Value Score + ITF263 + Take-Home breakdown", () => {
  const client = readFileSync(
    join(
      androidRoot,
      "core/network/src/main/kotlin/zw/co/dial/technician/network/DialTechnicianClient.kt",
    ),
    "utf8",
  );
  const app = readFileSync(
    join(androidRoot, "app/src/main/java/zw/co/dial/technician/ui/TechnicianApp.kt"),
    "utf8",
  );
  assert.match(client, /fetchValueScore|view=value_score/);
  assert.match(client, /uploadItf263|upload_itf263/);
  assert.match(client, /takeHomeBreakdown|take_home_breakdown/);
  assert.match(client, /never send userId\/role|identity fields forbidden/);
  assert.match(app, /Value Score|ITF263|Take-Home breakdown/);
  assert.match(app, /@Composable/);
});

test("PD25 package thin verticals", () => {
  __resetJobsForTests();
  const vs = runPd25ValueScoreDeviceThinVertical();
  assert.equal(vs.factorsExplainable, true);
  assert.equal(vs.payableFromAi, false);

  __resetPaymentsForTests();
  const itf = runPd25Itf263TakeHomeThinVertical();
  assert.equal(itf.withoutItf263RateBps, 3000);
  assert.equal(itf.withItf263RateBps, 0);
  assert.equal(itf.payableFromAi, false);
});

test("PD25 gateway: value_score + ITF263 upload/verify + Take-Home", async () => {
  __resetJobsForTests();
  __resetPaymentsForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "tech.pd25@dial.test",
    buyerSegment: "b2c",
  });
  const cookie = `${sessionCookieName()}=${token}`;

  const vsRes = await techGet(
    new Request("http://localhost/api/tech/technician?view=value_score", {
      headers: { cookie },
    }),
  );
  assert.equal(vsRes.status, 200);
  const vsJson = (await vsRes.json()) as {
    valueScore: { score: number; factorContributions: unknown[] };
    payableFromAi: boolean;
  };
  assert.ok(vsJson.valueScore.score >= 1);
  assert.ok(vsJson.valueScore.factorContributions.length >= 1);
  assert.equal(vsJson.payableFromAi, false);

  const bdNo = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "take_home_breakdown",
        grossUsdMinor: "12000",
        dialFeeUsdMinor: "2000",
      }),
    }),
  );
  assert.equal(bdNo.status, 200);
  const bdNoJson = (await bdNo.json()) as {
    rateBps: number;
    withholdMinor: string;
    payableFromAi: boolean;
  };
  assert.equal(bdNoJson.rateBps, 3000);
  assert.equal(bdNoJson.withholdMinor, "3000");
  assert.equal(bdNoJson.payableFromAi, false);

  const upload = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "upload_itf263",
        documentRef: "fixture://itf263/pd25.pdf",
      }),
    }),
  );
  assert.equal(upload.status, 200);

  const verify = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ action: "verify_itf263_fixture" }),
    }),
  );
  assert.equal(verify.status, 200);

  const bdYes = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "take_home_breakdown",
        grossUsdMinor: "12000",
        dialFeeUsdMinor: "2000",
      }),
    }),
  );
  assert.equal(bdYes.status, 200);
  const bdYesJson = (await bdYes.json()) as {
    rateBps: number;
    hasItf263: boolean;
    withholdMinor: string;
  };
  assert.equal(bdYesJson.rateBps, 0);
  assert.equal(bdYesJson.hasItf263, true);
  assert.equal(bdYesJson.withholdMinor, "0");

  const bodyReject = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "upload_itf263",
        userId: "evil",
        documentRef: "x",
      }),
    }),
  );
  assert.equal(bodyReject.status, 400);
});
