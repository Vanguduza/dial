/**
 * PD38 — supplier heartbeat + confirm SLA dogfood (gateway).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  __resetSuppliersForTests,
  runPd38HeartbeatSlaThinVertical,
} from "@dial/suppliers";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import {
  GET as portalGet,
  POST as portalPost,
} from "../../app/api/supplier/portal/route.js";

describe("PD38 supplier heartbeat SLA", () => {
  it("package thin vertical greens", () => {
    const r = runPd38HeartbeatSlaThinVertical();
    assert.equal(r.payableFromAi, false);
    assert.equal(r.healthyAfterHeartbeat, true);
  });

  it("portal GET exposes heartbeatSla + escalations; rejects body userId", async () => {
    __resetSuppliersForTests();
    __resetAuthForTests();
    const { token } = createSession({ email: "pd38ops@dial.local" });
    const cookie = `${sessionCookieName()}=${token}`;

    const onboard = await portalPost(
      new Request("http://localhost/api/supplier/portal", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          action: "onboard",
          displayName: "PD38 Portal Agency",
          tier: "silver",
          formality: "formal",
        }),
      }),
    );
    assert.equal(onboard.status, 200);

    const denied = await portalPost(
      new Request("http://localhost/api/supplier/portal", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          action: "sync_sla",
          userId: "attacker",
        }),
      }),
    );
    assert.equal(denied.status, 400);

    const sync = await portalPost(
      new Request("http://localhost/api/supplier/portal", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({ action: "sync_sla" }),
      }),
    );
    assert.equal(sync.status, 200);
    const syncBody = (await sync.json()) as {
      heartbeatSla: { health: string; escalate: boolean };
      payableFromAi: false;
    };
    assert.equal(syncBody.heartbeatSla.health, "missing");
    assert.equal(syncBody.payableFromAi, false);

    const get = await portalGet(
      new Request("http://localhost/api/supplier/portal", {
        headers: { cookie },
      }),
    );
    assert.equal(get.status, 200);
    const body = (await get.json()) as {
      heartbeatSla: { health: string };
      escalations: Array<{ kind: string; payableFromAi: false }>;
    };
    assert.ok(body.heartbeatSla);
    assert.ok(body.escalations.some((e) => e.kind === "heartbeat_stale"));
  });
});
