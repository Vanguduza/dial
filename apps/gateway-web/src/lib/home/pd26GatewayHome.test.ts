/**
 * PD26 Gateway auth home Shop | Services tests.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetAuthForTests,
  createSession,
  sessionCookieName,
} from "../auth/session.js";
import {
  buildAuthHomeSnapshot,
  runPd26GatewayHomeThinVertical,
} from "./authHome.js";
import { GET as homeGet } from "../../app/api/home/route.js";

const homePage = join(process.cwd(), "src/app/home/page.tsx");

test("PD26 home UI: Welcome-back + Shop | Services + responsive", () => {
  const src = readFileSync(homePage, "utf8");
  assert.match(src, /Welcome back|welcomeBack/);
  assert.match(src, /Shop/);
  assert.match(src, /Services/);
  assert.match(src, /min-width:\s*\$\{home\.responsive\.desktopMinWidthPx\}px|768/);
  assert.match(src, /payableFromAi|PD26/);
  assert.match(src, /dial-home-lanes/);
});

test("PD26 thin vertical", () => {
  const out = runPd26GatewayHomeThinVertical();
  assert.match(out.welcomeBack, /^Welcome back/);
  assert.equal(out.laneCount, 2);
  assert.equal(out.sessionRestored, true);
  assert.equal(out.responsiveMobileFirst, true);
  assert.equal(out.payableFromAi, false);
  assert.equal(out.anonymousBlocked, true);
  assert.equal(out.shopHref, "/spare");
  assert.ok(out.servicesHref.startsWith("/tech"));
});

test("PD26 B2B home includes supplier desk under Shop", () => {
  __resetAuthForTests();
  const { session } = createSession({
    email: "fleet.pd26@dial.test",
    buyerSegment: "b2b",
  });
  const snap = buildAuthHomeSnapshot(session);
  const shop = snap.primaryLanes.find((l) => l.id === "shop");
  assert.ok(shop?.destinations.some((d) => d.href === "/supplier"));
});

test("PD26 /api/home: fail closed + session snapshot", async () => {
  __resetAuthForTests();
  assert.equal(
    (await homeGet(new Request("http://localhost/api/home"))).status,
    401,
  );

  const { token } = createSession({
    email: "home.pd26@dial.test",
    buyerSegment: "b2c",
  });
  const cookie = `${sessionCookieName()}=${token}`;

  const badQuery = await homeGet(
    new Request("http://localhost/api/home?userId=evil", {
      headers: { cookie },
    }),
  );
  assert.equal(badQuery.status, 400);

  const ok = await homeGet(
    new Request("http://localhost/api/home", { headers: { cookie } }),
  );
  assert.equal(ok.status, 200);
  const json = (await ok.json()) as {
    home: {
      welcomeBack: string;
      primaryLanes: Array<{ id: string }>;
      payableFromAi: boolean;
      sessionRestored: boolean;
    };
  };
  assert.match(json.home.welcomeBack, /^Welcome back/);
  assert.equal(json.home.primaryLanes.length, 2);
  assert.equal(json.home.payableFromAi, false);
  assert.equal(json.home.sessionRestored, true);
});
