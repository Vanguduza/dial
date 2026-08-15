/**
 * PD31 Technician Bluetooth ESC/POS print hooks (Pack §9.7 / D-46 / D-40a).
 * Ops job ticket — not ZIMRA fiscal printer SoR.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetJobsForTests,
  runPd31BluetoothPrintThinVertical,
} from "@dial/jobs";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { POST as techPost } from "../../app/api/tech/technician/route.js";

const androidRoot = join(process.cwd(), "../technician-android");

test("PD31 Android Compose: pair + print job ticket ESC/POS", () => {
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
  assert.match(client, /pair_thermal_printer|pairThermalPrinter/);
  assert.match(client, /print_job_ticket|printJobTicket/);
  assert.match(client, /zimraFiscalSor/);
  assert.match(client, /identity fields forbidden|never send userId/);
  assert.match(app, /Pair Bluetooth|Print job ticket|ESC\/POS/);
  assert.match(app, /@Composable/);
});

test("PD31 package thin vertical", async () => {
  const out = await runPd31BluetoothPrintThinVertical();
  assert.equal(out.paired, true);
  assert.equal(out.ticketSent, true);
  assert.equal(out.escpos, true);
  assert.equal(out.zimraFiscalSor, false);
  assert.equal(out.fdmsVirtualOnly, true);
  assert.equal(out.payableFromAi, false);
});

test("PD31 API: pair printer + print ticket; not ZIMRA SoR", async () => {
  __resetJobsForTests();
  __resetAuthForTests();
  const { token } = createSession({
    email: "tech.pd31@dial.test",
    buyerSegment: "b2c",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const headers = {
    "content-type": "application/json",
    cookie,
  };

  const seed = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "seed_assigned_job" }),
    }),
  );
  assert.equal(seed.status, 200);
  const seedJson = (await seed.json()) as { job: { id: string } };
  const jobId = seedJson.job.id;

  const pair = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "pair_thermal_printer",
        label: "DIAL pocket thermal",
        bluetoothAddress: "AA:BB:CC:31:00:01",
      }),
    }),
  );
  assert.equal(pair.status, 200);
  const pairJson = (await pair.json()) as {
    printer: {
      printerId: string;
      protocol: string;
      zimraFiscalSor: boolean;
      fdmsVirtualOnly: boolean;
    };
    payableFromAi: boolean;
  };
  assert.equal(pairJson.printer.protocol, "escpos");
  assert.equal(pairJson.printer.zimraFiscalSor, false);
  assert.equal(pairJson.printer.fdmsVirtualOnly, true);
  assert.equal(pairJson.payableFromAi, false);

  const print = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "print_job_ticket",
        jobId,
        printerId: pairJson.printer.printerId,
      }),
    }),
  );
  assert.equal(print.status, 200);
  const printJson = (await print.json()) as {
    printJob: {
      status: string;
      zimraFiscalSor: boolean;
      payableFromAi: boolean;
      escposText: string;
    };
  };
  assert.equal(printJson.printJob.status, "sent");
  assert.equal(printJson.printJob.zimraFiscalSor, false);
  assert.equal(printJson.printJob.payableFromAi, false);
  assert.match(printJson.printJob.escposText, /NOT a fiscal receipt/);

  const reject = await techPost(
    new Request("http://localhost/api/tech/technician", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "pair_thermal_printer",
        userId: "evil",
      }),
    }),
  );
  assert.equal(reject.status, 400);
});
