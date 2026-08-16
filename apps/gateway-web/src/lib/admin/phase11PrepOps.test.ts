/**
 * Phase 11 G11 dogfood — Intelligence Factory no auto-promote / Simulated never pays.
 * G11 exit evidence: Promptfoo fail→no promote; Actual KPI action cannot pay.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { POST as ccPost } from "../../app/api/admin/command-centre/route.js";
import {
  GET as intelGet,
  POST as intelPost,
} from "../../app/api/admin/intelligence/route.js";

test("Phase11-prep intelligence API fail-closed + auto-publish blocked", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  delete process.env.INTERNAL_API_SECRET;
  try {
    const closed = await intelGet(
      new Request("http://localhost/api/admin/intelligence"),
    );
    assert.equal(closed.status, 503);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }

  process.env.INTERNAL_API_SECRET = "p11_intel_secret";
  try {
    const create = await intelPost(
      new Request("http://localhost/api/admin/intelligence", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p11_intel_secret",
        },
        body: JSON.stringify({
          action: "create_shadow",
          title: "Phase11 prep checklist draft",
          draftBody: "Human-reviewed checklist only — draft economics from rate_card.",
          kind: "checklist",
        }),
      }),
    );
    assert.equal(create.status, 200);
    const createJson = (await create.json()) as { shadowId: string };
    assert.ok(createJson.shadowId.startsWith("sh_"));

    const autoPub = await intelPost(
      new Request("http://localhost/api/admin/intelligence", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p11_intel_secret",
        },
        body: JSON.stringify({
          action: "attempt_auto_publish",
          shadowId: createJson.shadowId,
        }),
      }),
    );
    const autoJson = (await autoPub.json()) as {
      ok: boolean;
      blocked?: boolean;
      error?: string;
    };
    assert.equal(autoJson.ok, false);
    assert.equal(autoJson.blocked, true);
    assert.match(String(autoJson.error ?? ""), /auto-publish|Promptfoo|human/i);

    const promoteEarly = await intelPost(
      new Request("http://localhost/api/admin/intelligence", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p11_intel_secret",
        },
        body: JSON.stringify({
          action: "promote",
          shadowId: createJson.shadowId,
        }),
      }),
    );
    assert.equal(promoteEarly.status, 400);

    const simPay = await intelPost(
      new Request("http://localhost/api/admin/intelligence", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p11_intel_secret",
        },
        body: JSON.stringify({ action: "attempt_simulated_payout" }),
      }),
    );
    const simJson = (await simPay.json()) as {
      ok: boolean;
      blocked?: boolean;
      error?: string;
    };
    assert.equal(simJson.ok, false);
    assert.equal(simJson.blocked, true);
    assert.match(String(simJson.error ?? ""), /Simulated|never auto-pay/i);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("Phase11-prep intelligence Promptfoo fail blocks promote", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "p11_intel_fail_secret";
  try {
    const create = await intelPost(
      new Request("http://localhost/api/admin/intelligence", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p11_intel_fail_secret",
        },
        body: JSON.stringify({
          action: "create_shadow",
          title: "G11 Promptfoo fail gate",
          draftBody: "Eval draft — needsHumanQuote only",
          kind: "guided_intake_eval",
        }),
      }),
    );
    assert.equal(create.status, 200);
    const createJson = (await create.json()) as { shadowId: string };

    const pfFail = await intelPost(
      new Request("http://localhost/api/admin/intelligence", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p11_intel_fail_secret",
        },
        body: JSON.stringify({
          action: "promptfoo",
          shadowId: createJson.shadowId,
          promptfooPassed: false,
          reportId: "pf_g11_http_fail",
        }),
      }),
    );
    assert.equal(pfFail.status, 200);

    const promoteFail = await intelPost(
      new Request("http://localhost/api/admin/intelligence", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p11_intel_fail_secret",
        },
        body: JSON.stringify({
          action: "promote",
          shadowId: createJson.shadowId,
        }),
      }),
    );
    assert.equal(promoteFail.status, 400);
    const promoteJson = (await promoteFail.json()) as { error?: string };
    assert.match(String(promoteJson.error ?? ""), /Promptfoo|human/i);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("Phase11-prep Command Centre Actual KPI recommended action cannot pay", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "p11_cc_action_secret";
  try {
    const refresh = await ccPost(
      new Request("http://localhost/api/admin/command-centre", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p11_cc_action_secret",
        },
        body: JSON.stringify({
          action: "seed_alert_observations",
          mode: "actual",
        }),
      }),
    );
    assert.equal(refresh.status, 200);
    const refreshJson = (await refresh.json()) as {
      tiles?: Array<{
        recommendedActions?: Array<{ id: string; autoPay: boolean }>;
      }>;
    };
    const actions = (refreshJson.tiles ?? []).flatMap(
      (t) => t.recommendedActions ?? [],
    );
    assert.ok(actions.length >= 1, "expected at least one recommended action");
    const target = actions[0]!;
    assert.equal(target.autoPay, false);

    const exec = await ccPost(
      new Request("http://localhost/api/admin/command-centre", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p11_cc_action_secret",
        },
        body: JSON.stringify({
          action: "execute_recommended_action",
          mode: "actual",
          actionId: target.id,
        }),
      }),
    );
    assert.equal(exec.status, 200);
    const execBody = (await exec.json()) as {
      autoPayAllowed: boolean;
      payout?: { refused: boolean };
      action?: { autoPay: boolean };
    };
    assert.equal(execBody.autoPayAllowed, false);
    assert.equal(execBody.action?.autoPay, false);
    assert.equal(execBody.payout?.refused, true);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});

test("Phase11-prep Command Centre Simulated + Actual payout both refuse money SoR", async () => {
  const prev = process.env.INTERNAL_API_SECRET;
  process.env.INTERNAL_API_SECRET = "p11_cc_secret";
  try {
    const sim = await ccPost(
      new Request("http://localhost/api/admin/command-centre", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p11_cc_secret",
        },
        body: JSON.stringify({
          action: "attempt_payout",
          mode: "simulated",
          amountMinor: "500",
        }),
      }),
    );
    assert.equal(sim.status, 403);
    const simBody = (await sim.json()) as { autoPayAllowed: boolean };
    assert.equal(simBody.autoPayAllowed, false);

    const actual = await ccPost(
      new Request("http://localhost/api/admin/command-centre", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": "p11_cc_secret",
        },
        body: JSON.stringify({
          action: "attempt_payout",
          mode: "actual",
          amountMinor: "500",
        }),
      }),
    );
    assert.equal(actual.status, 200);
    const actualBody = (await actual.json()) as {
      autoPayAllowed: boolean;
      payout?: { refused: boolean };
    };
    assert.equal(actualBody.autoPayAllowed, false);
    assert.equal(actualBody.payout?.refused, true);
  } finally {
    if (prev === undefined) delete process.env.INTERNAL_API_SECRET;
    else process.env.INTERNAL_API_SECRET = prev;
  }
});
