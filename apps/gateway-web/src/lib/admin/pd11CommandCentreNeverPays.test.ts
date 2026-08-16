/**
 * Phase 11 prep (not G11) — Command Centre HTTP forbids Simulated payout (D-54).
 * Fixture INTERNAL_API_SECRET only; does not claim G11 exit.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { POST } from "../../app/api/admin/command-centre/route.js";

test("Phase11-prep: Simulated attempt_payout returns 403 autoPayAllowed=false", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "phase11_prep_cc_secret";
  try {
    const res = await POST(
      new Request("http://localhost/api/admin/command-centre", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "phase11_prep_cc_secret",
        },
        body: JSON.stringify({
          action: "attempt_payout",
          mode: "simulated",
          amountMinor: "100",
        }),
      }),
    );
    assert.equal(res.status, 403);
    const body = (await res.json()) as {
      ok: boolean;
      autoPayAllowed: boolean;
      error?: string;
      mode?: string;
    };
    assert.equal(body.ok, false);
    assert.equal(body.autoPayAllowed, false);
    assert.equal(body.mode, "simulated");
    assert.match(String(body.error ?? ""), /never auto-pay|Simulated/i);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("Phase11-prep: Actual attempt_payout refuses — CC not money SoR", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "phase11_prep_cc_secret";
  try {
    const res = await POST(
      new Request("http://localhost/api/admin/command-centre", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "phase11_prep_cc_secret",
        },
        body: JSON.stringify({
          action: "attempt_payout",
          mode: "actual",
          amountMinor: "100",
        }),
      }),
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      ok: boolean;
      autoPayAllowed: boolean;
      payout?: { refused: boolean };
    };
    assert.equal(body.ok, true);
    assert.equal(body.autoPayAllowed, false);
    assert.equal(body.payout?.refused, true);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});
