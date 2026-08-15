/**
 * PD27 Spare Select Vehicle / Browse EPC dual entry tests.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetCatalogueForTests,
  runPd27SpareDualEntryThinVertical,
} from "@dial/catalogue";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import { GET as entryGet } from "../../app/api/spare/entry/route.js";

const entryPage = join(process.cwd(), "src/app/spare/entry/page.tsx");
const sparePage = join(process.cwd(), "src/app/spare/page.tsx");

test("PD27 UI: dual entry Select Vehicle | Browse EPC", () => {
  const src = readFileSync(entryPage, "utf8");
  assert.match(src, /Select Vehicle/);
  assert.match(src, /Browse EPC/);
  assert.match(src, /chassis_code|chassisCode/);
  assert.match(src, /USD|D-57/);
  assert.match(src, /C-6|reverse-engineered|OpenCatalog|ACES/i);
  const browse = readFileSync(sparePage, "utf8");
  assert.match(browse, /\/spare\/entry|Select Vehicle|entry/);
});

test("PD27 package thin vertical", () => {
  __resetCatalogueForTests();
  const out = runPd27SpareDualEntryThinVertical();
  assert.equal(out.selectVehicleChassis, "KUN26");
  assert.equal(out.sameJoin, true);
  assert.equal(out.reverseEngineeredEpc, false);
  assert.equal(out.payableFromAi, false);
});

test("PD27 API: entry + select + offers; B2B informal hide; reject body role", async () => {
  __resetCatalogueForTests();
  __resetAuthForTests();

  const bad = await entryGet(
    new Request("http://localhost/api/spare/entry?view=entry&userId=evil"),
  );
  assert.equal(bad.status, 400);

  const entry = await entryGet(
    new Request("http://localhost/api/spare/entry?view=entry"),
  );
  assert.equal(entry.status, 200);
  const entryJson = (await entry.json()) as {
    reverseEngineeredEpc: boolean;
    displayCurrency: string;
    makes: string[];
  };
  assert.equal(entryJson.reverseEngineeredEpc, false);
  assert.equal(entryJson.displayCurrency, "USD");
  assert.ok(entryJson.makes.includes("Toyota"));

  const select = await entryGet(
    new Request(
      "http://localhost/api/spare/entry?view=select_vehicle&make=Toyota&model=Hilux&year=2010",
    ),
  );
  assert.equal(select.status, 200);
  const selectJson = (await select.json()) as {
    vehicles: Array<{ chassisCode: string }>;
  };
  assert.equal(selectJson.vehicles[0]?.chassisCode, "KUN26");

  const { token } = createSession({
    email: "fleet.pd27@dial.test",
    buyerSegment: "b2b",
  });
  const cookie = `${sessionCookieName()}=${token}`;
  const offers = await entryGet(
    new Request(
      "http://localhost/api/spare/entry?view=offers&chassis=KUN26&entry=select_vehicle",
      { headers: { cookie } },
    ),
  );
  assert.equal(offers.status, 200);
  const offersJson = (await offers.json()) as {
    hits: Array<{ supplierFormality: string; displayCurrency: string }>;
    sessionRole: string;
  };
  assert.equal(offersJson.sessionRole, "b2b");
  assert.ok(offersJson.hits.every((h) => h.supplierFormality === "formal"));
  assert.ok(offersJson.hits.every((h) => h.displayCurrency === "USD"));
});
