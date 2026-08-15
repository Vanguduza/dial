import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

test("S98 worker-queues fixture start exits 0", async () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const run = join(here, "run.ts");
  const code = await new Promise<number>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", run],
      {
        env: { ...process.env, DIAL_INTEGRATION_MODE: "fixture" },
        cwd: join(here, ".."),
      },
    );
    let err = "";
    child.stderr.on("data", (d) => {
      err += String(d);
    });
    child.on("error", reject);
    child.on("close", (c) => resolve(c ?? 1));
    setTimeout(() => {
      child.kill();
      reject(new Error(`timeout: ${err}`));
    }, 60_000);
  });
  assert.equal(code, 0);
});

test("S116 money outbox drain hook empties ledger outbox", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const {
    __resetLedgerForTests,
    enqueueMoneyOutbox,
    listMoneyOutbox,
  } = await import("@dial/ledger");
  __resetLedgerForTests();
  enqueueMoneyOutbox({ kind: "ledger_posted", refId: "jr_s116" });
  assert.equal(listMoneyOutbox().length, 1);
  const { runMoneyOutboxDrain } = await import("./moneyOutbox.js");
  const result = await runMoneyOutboxDrain({ enqueueSideEffects: true });
  assert.ok(result.drained.some((d) => d.kind === "ledger_posted"));
  assert.equal(result.remaining, 0);
  assert.equal(listMoneyOutbox().length, 0);
});
