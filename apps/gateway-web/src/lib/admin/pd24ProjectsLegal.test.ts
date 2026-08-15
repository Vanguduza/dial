/**
 * PD24 Admin Projects toggle + legal compliance hub tests.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetJobsForTests,
  runPd24AdminProjectsLegalThinVertical,
} from "@dial/jobs";
import {
  GET as projectsGet,
  POST as projectsPost,
} from "../../app/api/admin/projects/route.js";
import {
  GET as legalGet,
  POST as legalPost,
} from "../../app/api/admin/compliance/legal/route.js";

const projectsPage = join(process.cwd(), "src/app/admin/projects/page.tsx");
const legalPage = join(
  process.cwd(),
  "src/app/admin/compliance/legal/page.tsx",
);

test("PD24 admin UI: Projects toggle + legal hub", () => {
  const projects = readFileSync(projectsPage, "utf8");
  const legal = readFileSync(legalPage, "utf8");
  assert.match(projects, /Projects client toggle|coming soon|C-3/);
  assert.match(projects, /labour-law|payableFromAi/);
  assert.match(legal, /Legal compliance hub|§3\.8|Terms/);
  assert.match(legal, /payableFromAi|never writes/i);
});

test("PD24 package thin vertical", () => {
  __resetJobsForTests();
  const out = runPd24AdminProjectsLegalThinVertical();
  assert.equal(out.defaultComingSoon, true);
  assert.equal(out.liveBlockedWithoutGates, true);
  assert.equal(out.liveAfterGates, true);
  assert.equal(out.payableFromAi, false);
});

test("PD24 admin APIs: fail closed + gates + T&C", async () => {
  __resetJobsForTests();
  delete process.env.INTERNAL_API_SECRET;

  assert.equal(
    (await projectsGet(new Request("http://localhost/api/admin/projects")))
      .status,
    503,
  );
  assert.equal(
    (
      await legalGet(
        new Request("http://localhost/api/admin/compliance/legal"),
      )
    ).status,
    503,
  );

  process.env.INTERNAL_API_SECRET = "pd24-test-secret";
  const headers = {
    "content-type": "application/json",
    "x-internal-secret": "pd24-test-secret",
  };

  const liveBlocked = await projectsPost(
    new Request("http://localhost/api/admin/projects", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "set_visibility",
        visibility: "live",
        setBy: "ops_api",
      }),
    }),
  );
  assert.equal(liveBlocked.status, 400);

  const gates = await projectsPost(
    new Request("http://localhost/api/admin/projects", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "set_gates",
        labourLawReviewAck: true,
        fundedWorkingCapitalAck: true,
        setBy: "counsel_api",
      }),
    }),
  );
  assert.equal(gates.status, 200);

  const live = await projectsPost(
    new Request("http://localhost/api/admin/projects", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "set_visibility",
        visibility: "live",
        setBy: "ops_api",
      }),
    }),
  );
  assert.equal(live.status, 200);
  const liveJson = (await live.json()) as {
    clientSurface: { mode: string };
  };
  assert.equal(liveJson.clientSurface.mode, "live");

  const draft = await projectsPost(
    new Request("http://localhost/api/admin/projects", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "create_internal_draft",
        title: "API scaffold",
        createdBy: "ops_api",
      }),
    }),
  );
  assert.equal(draft.status, 200);
  const draftJson = (await draft.json()) as {
    draft: { payableFromAi: boolean; clientVisible: boolean };
  };
  assert.equal(draftJson.draft.payableFromAi, false);
  assert.equal(draftJson.draft.clientVisible, false);

  const publish = await legalPost(
    new Request("http://localhost/api/admin/compliance/legal", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "publish_terms",
        audience: "customer",
        title: "Customer T&C",
        bodyRef: "fixture://tc/customer/api",
      }),
    }),
  );
  assert.equal(publish.status, 200);
  const pubJson = (await publish.json()) as {
    terms: { versionId: string };
  };

  const accept = await legalPost(
    new Request("http://localhost/api/admin/compliance/legal", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "accept_terms",
        versionId: pubJson.terms.versionId,
        partyId: "cust_api",
        channel: "admin",
      }),
    }),
  );
  assert.equal(accept.status, 200);

  const bodyReject = await projectsPost(
    new Request("http://localhost/api/admin/projects", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "set_gates",
        userId: "evil",
        labourLawReviewAck: true,
        fundedWorkingCapitalAck: true,
      }),
    }),
  );
  assert.equal(bodyReject.status, 400);
});
