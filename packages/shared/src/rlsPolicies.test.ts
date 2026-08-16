import assert from "node:assert/strict";
import { test } from "node:test";
import {
  G1_PRIORITY_RESOURCE_KINDS,
  assertRlsSelect,
  rlsAllowsSelect,
  runG1CrossTenantRlsDenyMatrix,
} from "./rlsPolicies.js";

test("G1 RLS CI: cross-tenant deny on ≥5 priority resources", () => {
  assert.ok(G1_PRIORITY_RESOURCE_KINDS.length >= 5);
  const out = runG1CrossTenantRlsDenyMatrix();
  assert.ok(out.kindsDenied.length >= 5);
  assert.equal(out.bodyUserIdRefused, true);
  assert.equal(out.payableFromAi, false);
  assert.ok(out.kindsDenied.includes("orders"));
  assert.ok(out.kindsDenied.includes("vehicles"));
  assert.ok(out.kindsDenied.includes("promo_credits"));
  assert.ok(out.kindsDenied.includes("delivery_jobs"));
  assert.ok(out.kindsDenied.includes("job_reserves"));
});

test("G1 RLS: job_reserves admin-only; customer denied", () => {
  const row = {
    kind: "job_reserves" as const,
    customerId: "usr_c",
  };
  assert.equal(
    rlsAllowsSelect({ userId: "usr_c", role: "customer" }, row),
    false,
  );
  assert.doesNotThrow(() =>
    assertRlsSelect({ userId: "usr_admin", role: "admin" }, row),
  );
});
