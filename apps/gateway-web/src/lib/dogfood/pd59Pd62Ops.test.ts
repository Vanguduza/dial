/**
 * PD59–PD62 dogfood — assignment timeline, domain modules, COD failure, four-eyes queue.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  runPd59AssignmentEventsThinVertical,
  runPd61CodFailureReasonThinVertical,
} from "@dial/delivery";
import {
  proposeDailyZigRate,
  runPd62FourEyesQueueThinVertical,
  __resetPaymentsForTests,
} from "@dial/payments";
import { runPd60DomainModuleRegistryThinVertical } from "@dial/shared";
import { GET as eventsGet } from "../../app/api/admin/delivery/assignment-events/route.js";
import {
  GET as modulesGet,
  POST as modulesPost,
} from "../../app/api/admin/platform/modules/route.js";
import {
  GET as fourEyesGet,
  POST as fourEyesPost,
} from "../../app/api/admin/four-eyes/route.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("PD59 assignment events timeline", async () => {
  const page = readFileSync(
    join(root, "app/admin/delivery/dispatch/page.tsx"),
    "utf8",
  );
  assert.match(page, /assignment-events|PD59/i);

  const thin = runPd59AssignmentEventsThinVertical();
  assert.equal(thin.hasOfferRejectFifoOverride, true);
  assert.ok(thin.eventTypes.includes("offered"));
  assert.ok(thin.eventTypes.includes("manual_override"));
  assert.equal(thin.payableFromAi, false);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd59_secret";
  try {
    const res = await eventsGet(
      new Request(
        `http://localhost/api/admin/delivery/assignment-events?jobId=${thin.jobId}`,
        { headers: { "x-internal-secret": "pd59_secret" } },
      ),
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as { events: Array<{ jobId: string }> };
    assert.ok(body.events.some((e) => e.jobId === thin.jobId));
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("PD60 domain module registry", async () => {
  const page = readFileSync(
    join(root, "app/admin/platform/modules/page.tsx"),
    "utf8",
  );
  assert.match(page, /admin-domain-modules/);
  assert.match(page, /Unleash|certification/i);

  const thin = runPd60DomainModuleRegistryThinVertical();
  assert.equal(thin.spareCertified, true);
  assert.equal(thin.unleashIsSor, false);
  assert.equal(thin.publicMvpLadder, false);

  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd60_secret";
  try {
    const list = await modulesGet(
      new Request("http://localhost/api/admin/platform/modules", {
        headers: { "x-internal-secret": "pd60_secret" },
      }),
    );
    assert.equal(list.status, 200);
    const certify = await modulesPost(
      new Request("http://localhost/api/admin/platform/modules", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd60_secret",
        },
        body: JSON.stringify({
          moduleId: "tech",
          certification: "certified",
          updatedBy: "ops_pd60_api",
        }),
      }),
    );
    assert.equal(certify.status, 200);
    const body = (await certify.json()) as {
      module: { certification: string; publicMvpLadder: boolean };
      unleashIsSor: boolean;
    };
    assert.equal(body.module.certification, "certified");
    assert.equal(body.module.publicMvpLadder, false);
    assert.equal(body.unleashIsSor, false);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("PD61 COD failure reasons", async () => {
  const thin = runPd61CodFailureReasonThinVertical();
  assert.equal(thin.failureRecorded, true);
  assert.equal(thin.failureReason, "customer_refused");
  assert.equal(thin.floatWarnStillWorks, true);
  assert.equal(thin.currency, "USD");
});

test("PD62 four-eyes queue", async () => {
  const page = readFileSync(join(root, "app/admin/four-eyes/page.tsx"), "utf8");
  assert.match(page, /admin-four-eyes-queue/);
  assert.match(page, /four-eyes|Approve/i);

  const thin = runPd62FourEyesQueueThinVertical();
  assert.equal(thin.queuedThenCleared, true);
  assert.equal(thin.kind, "daily_zig_rate");

  __resetPaymentsForTests();
  const proposal = proposeDailyZigRate({
    zigMinorPerUsd: 2800_00n,
    proposedBy: "ops_a",
  });
  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "pd62_secret";
  try {
    const list = await fourEyesGet(
      new Request("http://localhost/api/admin/four-eyes", {
        headers: { "x-internal-secret": "pd62_secret" },
      }),
    );
    assert.equal(list.status, 200);
    const listed = (await list.json()) as {
      queue: Array<{ proposalId: string }>;
    };
    assert.ok(listed.queue.some((q) => q.proposalId === proposal.proposalId));

    const approve = await fourEyesPost(
      new Request("http://localhost/api/admin/four-eyes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "pd62_secret",
        },
        body: JSON.stringify({
          action: "approve",
          proposalId: proposal.proposalId,
          approvedBy: "ops_b",
        }),
      }),
    );
    assert.equal(approve.status, 200);
    const after = (await approve.json()) as { queue: unknown[] };
    assert.equal(after.queue.length, 0);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});
