/**
 * PD20 customer-mobile deepen — Android + iOS source contracts (Windows CI without SDKs).
 * ERP SoR = PD18 spare orders/returns/garage + grocery search (Pack §9.6).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  __resetSpareCustomerForTests,
  runPd20CustomerMobileThinVertical,
} from "@dial/catalogue";
import { GET as ordersGet, POST as ordersPost } from "../../app/api/spare/orders/route.js";
import { POST as returnsPost } from "../../app/api/spare/returns/route.js";
import { POST as garagePost } from "../../app/api/spare/garage/route.js";
import { testAuthCookie } from "../auth/session.js";
import {
  addToCart,
  createCart,
  __resetCatalogueForTests,
} from "@dial/catalogue";

const androidRoot = join(process.cwd(), "../customer-android");
const iosRoot = join(process.cwd(), "../customer-ios");

test("PD20 Android + iOS sources deepen beyond PD5/PD8 browse/checkout", () => {
  const androidClient = readFileSync(
    join(
      androidRoot,
      "core/network/src/main/kotlin/zw/co/dial/customer/network/DialGatewayClient.kt",
    ),
    "utf8",
  );
  const androidApp = readFileSync(
    join(androidRoot, "app/src/main/java/zw/co/dial/customer/ui/DialApp.kt"),
    "utf8",
  );
  const androidTest = readFileSync(
    join(
      androidRoot,
      "core/network/src/test/kotlin/zw/co/dial/customer/network/DialGatewayClientTest.kt",
    ),
    "utf8",
  );
  const iosClient = readFileSync(
    join(iosRoot, "Sources/DialCustomerCore/DialGatewayClient.swift"),
    "utf8",
  );
  const iosApp = readFileSync(join(iosRoot, "App/DialCustomerApp.swift"), "utf8");
  const iosTest = readFileSync(
    join(iosRoot, "Tests/DialCustomerCoreTests/DialGatewayClientTests.swift"),
    "utf8",
  );

  for (const src of [androidClient, iosClient]) {
    assert.match(src, /api\/spare\/orders/);
    assert.match(src, /api\/spare\/returns/);
    assert.match(src, /api\/spare\/garage/);
    assert.match(src, /api\/search\/grocery/);
    assert.match(src, /payableFromAi|reminderConsent/);
    assert.ok(!src.includes("Expo"));
  }
  assert.match(androidApp, /OrdersScreen|Orders/);
  assert.match(androidApp, /GarageScreen|Garage/);
  assert.match(androidApp, /GroceryBrowseScreen|Grocery/);
  assert.match(androidApp, /Jetpack Compose|Compose|PD20/);
  assert.match(iosApp, /SwiftUI/);
  assert.match(iosApp, /PD20/);
  assert.match(iosApp, /Garage|Orders|Grocery/);
  assert.match(androidTest, /pd20_place_track_return_garage/);
  assert.match(iosTest, /testPd20PlaceTrackReturnGarageGrocery/);
});

test("Phase3-prep: Android gateway flavors + iOS GatewayBaseUrl contract", () => {
  const gradle = readFileSync(
    join(androidRoot, "app/build.gradle.kts"),
    "utf8",
  );
  assert.match(gradle, /flavorDimensions/);
  assert.match(gradle, /create\("local"\)/);
  assert.match(gradle, /create\("staging"\)/);
  assert.match(gradle, /dial\.gateway\.baseUrl|DIAL_GATEWAY_BASE_URL/);
  assert.match(gradle, /10\.0\.2\.2:3000/);
  assert.match(gradle, /DIAL_GATEWAY_URL_CONFIGURED/);

  const androidApp = readFileSync(
    join(androidRoot, "app/src/main/java/zw/co/dial/customer/ui/DialApp.kt"),
    "utf8",
  );
  const androidMain = readFileSync(
    join(androidRoot, "app/src/main/java/zw/co/dial/customer/MainActivity.kt"),
    "utf8",
  );
  const iosResolver = readFileSync(
    join(iosRoot, "Sources/DialCustomerCore/GatewayBaseUrl.swift"),
    "utf8",
  );
  const iosApp = readFileSync(join(iosRoot, "App/DialCustomerApp.swift"), "utf8");
  const iosPlist = readFileSync(join(iosRoot, "App/Info.plist"), "utf8");
  const iosTest = readFileSync(
    join(iosRoot, "Tests/DialCustomerCoreTests/DialGatewayClientTests.swift"),
    "utf8",
  );
  assert.match(iosResolver, /DialGatewayBaseURL/);
  assert.match(iosResolver, /DIAL_GATEWAY_BASE_URL/);
  assert.match(iosResolver, /resolveForInternalTrack/);
  assert.match(iosResolver, /isLoopback/);
  assert.match(iosApp, /GatewayBaseUrl\.resolve/);
  assert.match(iosPlist, /DialGatewayBaseURL/);
  assert.match(androidApp, /Pay EcoCash/);
  assert.match(androidApp, /Cash on delivery \(USD\)/);
  assert.match(iosApp, /Pay EcoCash/);
  assert.match(iosApp, /Cash on delivery \(USD\)/);
  assert.match(androidMain, /DIAL_GATEWAY_URL_CONFIGURED/);
  assert.match(iosTest, /testGatewayBaseUrlInternalTrackRejectsLoopback/);
  assert.ok(!gradle.includes("play.google.com"));
});

test("Phase3-prep: native EcoCash|COD CTAs + gateway fail-closed contracts", () => {
  const androidApp = readFileSync(
    join(androidRoot, "app/src/main/java/zw/co/dial/customer/ui/DialApp.kt"),
    "utf8",
  );
  const iosApp = readFileSync(join(iosRoot, "App/DialCustomerApp.swift"), "utf8");
  const gradle = readFileSync(join(androidRoot, "app/build.gradle.kts"), "utf8");
  const mainActivity = readFileSync(
    join(androidRoot, "app/src/main/java/zw/co/dial/customer/MainActivity.kt"),
    "utf8",
  );
  const gatewayUrl = readFileSync(
    join(iosRoot, "Sources/DialCustomerCore/GatewayBaseUrl.swift"),
    "utf8",
  );

  assert.match(androidApp, /Pay EcoCash/);
  assert.match(androidApp, /Cash on delivery \(USD\)/);
  assert.match(androidApp, /cpaReviewed/);
  assert.match(androidApp, /testTag\("cpa-review-ack"\)/);
  assert.match(androidApp, /testTag\("pay-ecocash"\)/);
  assert.match(androidApp, /testTag\("pay-cod"\)/);
  assert.match(iosApp, /Pay EcoCash/);
  assert.match(iosApp, /Cash on delivery \(USD\)/);
  assert.match(iosApp, /cpa-review-ack/);
  assert.match(iosApp, /accessibilityIdentifier\("pay-ecocash"\)/);
  assert.match(iosApp, /accessibilityIdentifier\("pay-cod"\)/);
  assert.match(gradle, /DIAL_GATEWAY_URL_CONFIGURED/);
  assert.match(mainActivity, /DIAL_GATEWAY_URL_CONFIGURED/);
  assert.match(gatewayUrl, /resolveForInternalTrack/);
  assert.match(gatewayUrl, /isLoopback/);
});

test("Phase3-prep: store listing drafts + G2 eng-exception sequencing docs", () => {
  const readiness = readFileSync(
    join(process.cwd(), "../../docs/ops/phase3-native-store-readiness.md"),
    "utf8",
  );
  const drafts = readFileSync(
    join(process.cwd(), "../../docs/ops/phase3-store-listing-drafts.md"),
    "utf8",
  );
  const pretend = readFileSync(
    join(process.cwd(), "../../docs/ops/ecocash-pretend-sandbox.md"),
    "utf8",
  );
  assert.match(readiness, /G2 eng-exception|eng-exception/);
  assert.match(readiness, /phase3-store-listing-drafts/);
  assert.match(readiness, /phase3-privacy-data-safety-draft/);
  assert.match(drafts, /Screenshot matrix/);
  assert.match(drafts, /EcoCash/);
  assert.match(drafts, /g3-native-client-checkout/);
  assert.match(pretend, /eco_sb_/);
  assert.match(pretend, /G2/);
  const privacy = readFileSync(
    join(process.cwd(), "../../docs/ops/phase3-privacy-data-safety-draft.md"),
    "utf8",
  );
  const g3notes = readFileSync(
    join(process.cwd(), "../../docs/ops/evidence/g3/NOTES.md"),
    "utf8",
  );
  assert.match(privacy, /dial_session/);
  assert.match(g3notes, /not G3/);
  assert.ok(!drafts.toLowerCase().includes("g3 green"));
});

test("PD20 package thin vertical + spare API parity", async () => {
  __resetCatalogueForTests();
  __resetSpareCustomerForTests();
  const out = await runPd20CustomerMobileThinVertical();
  assert.equal(out.currency, "USD");
  assert.equal(out.zigOnTrack, false);
  assert.equal(out.returnPayableFromAi, false);

  const cookie = testAuthCookie({ userId: "cust_pd20_api" });
  const cart = createCart();
  addToCart(cart.id, "off_filter_oil_kun26", 1);
  const place = await ordersPost(
    new Request("http://localhost/api/spare/orders", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        cartId: cart.id,
        customerId: "cust_pd20_api",
        payChoice: "cod",
      }),
    }),
  );
  assert.equal(place.status, 200);
  const placeJson = (await place.json()) as { order: { orderId: string } };
  const track = await ordersGet(
    new Request(
      `http://localhost/api/spare/orders?orderId=${encodeURIComponent(placeJson.order.orderId)}`,
      { headers: { cookie } },
    ),
  );
  assert.equal(track.status, 200);
  const trackJson = (await track.json()) as { zigOnTrack: boolean };
  assert.equal(trackJson.zigOnTrack, false);

  const ret = await returnsPost(
    new Request("http://localhost/api/spare/returns", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        action: "open",
        orderId: placeJson.order.orderId,
      }),
    }),
  );
  assert.equal(ret.status, 200);
  const retJson = (await ret.json()) as { claim: { payableFromAi: boolean } };
  assert.equal(retJson.claim.payableFromAi, false);

  const garage = await garagePost(
    new Request("http://localhost/api/spare/garage", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        label: "PD20 Hilux",
        chassisHint: "KUN26",
        reminderConsent: true,
      }),
    }),
  );
  assert.equal(garage.status, 200);
});
