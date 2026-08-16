import assert from "node:assert/strict";
import { test } from "node:test";
import { GET as groceryTrack } from "../../app/api/grocery/track/route.js";
import { GET as garageGet } from "../../app/api/spare/garage/route.js";
import { GET as returnsGet } from "../../app/api/spare/returns/route.js";
import { POST as slotPost } from "../../app/api/grocery/slot/route.js";
import { testAuthCookie, __resetAuthForTests } from "../auth/session.js";

test("IDOR: grocery track / garage / returns / slot require a session", async () => {
  __resetAuthForTests();
  const anonTrack = await groceryTrack(
    new Request("http://localhost/api/grocery/track?orderId=ord_x"),
  );
  assert.equal(anonTrack.status, 401);

  const other = testAuthCookie({ userId: "usr_other" });
  const garage = await garageGet(
    new Request("http://localhost/api/spare/garage?customerId=usr_victim", {
      headers: { cookie: other },
    }),
  );
  assert.equal(garage.status, 400);

  const anonReturns = await returnsGet(
    new Request("http://localhost/api/spare/returns?claimId=sret_x"),
  );
  assert.equal(anonReturns.status, 401);

  const anonSlot = await slotPost(
    new Request("http://localhost/api/grocery/slot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slotId: "slot_1" }),
    }),
  );
  assert.equal(anonSlot.status, 401);
});
