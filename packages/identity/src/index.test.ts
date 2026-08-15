import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetIdentityForTests,
  listProfilesAs,
  rlsContextFromProfile,
  runPd73IdentityStepUpThinVertical,
  selectProfileAs,
  signInByEmail,
  signUp,
  signUpWithPassword,
  signInWithPassword,
  upsertProfileAfterAuth,
  updateProfileAs,
  getSupabasePublicConfig,
  getSupabaseServerConfig,
} from "./index.js";

test("T1 sign-up/sign-in creates and resolves profile", () => {
  __resetIdentityForTests();
  const created = signUp({
    email: "buyer@dial.test",
    displayName: "Buyer One",
  });
  assert.equal(created.role, "customer");
  assert.equal(created.buyerSegment, "b2c");
  assert.equal(signInByEmail("Buyer@dial.test")?.userId, created.userId);
  assert.equal(signInByEmail("missing@dial.test"), null);
  assert.throws(() =>
    signUp({ email: "buyer@dial.test", displayName: "Dup" }),
  );
});

test("PD73 identity step-up thin vertical", () => {
  const out = runPd73IdentityStepUpThinVertical();
  assert.equal(out.verified, true);
  assert.equal(out.wrongCodeBlocked, true);
  assert.equal(out.gateEnforced, true);
  assert.equal(out.payableFromAi, false);
});

test("PD78 marketing consent thin vertical", async () => {
  const { runPd78MarketingConsentThinVertical } = await import("./index.js");
  const out = runPd78MarketingConsentThinVertical();
  assert.equal(out.granted, true);
  assert.equal(out.revoked, true);
  assert.ok(out.auditLen >= 2);
  assert.equal(out.payableFromAi, false);
});

test("PD131 notification prefs thin vertical", async () => {
  const { runPd131NotificationPrefsThinVertical } = await import("./index.js");
  const out = runPd131NotificationPrefsThinVertical();
  assert.ok(out.cellCount >= 15);
  assert.equal(out.marketingWasOff, true);
  assert.equal(out.marketingOptIn, true);
  assert.equal(out.utilityRemainsOn, true);
  assert.equal(out.payableFromAi, false);
});

test("PD82 account profile thin vertical", async () => {
  const { runPd82AccountProfileThinVertical } = await import("./index.js");
  const out = runPd82AccountProfileThinVertical();
  assert.equal(out.displayNameUpdated, true);
  assert.equal(out.crossTenantDenied, true);
  assert.equal(out.buyerSegment, "b2c");
  assert.equal(out.payableFromAi, false);
});

test("PD83 customer addresses thin vertical", async () => {
  const { runPd83CustomerAddressesThinVertical } = await import("./index.js");
  const out = runPd83CustomerAddressesThinVertical();
  assert.equal(out.defaultPinned, true);
  assert.equal(out.promotedAfterDelete, true);
  assert.equal(out.mapSor, "maplibre");
  assert.equal(out.payableFromAi, false);
});

test("T1 RLS profiles: own CRUD; cross-tenant deny; admin all", () => {
  __resetIdentityForTests();
  const alice = signUp({ email: "alice@dial.test", displayName: "Alice" });
  const bob = signUp({ email: "bob@dial.test", displayName: "Bob" });
  const admin = signUp({
    email: "ops@dial.test",
    displayName: "Ops",
    role: "admin",
  });

  const aliceCtx = rlsContextFromProfile(alice);
  const bobCtx = rlsContextFromProfile(bob);
  const adminCtx = rlsContextFromProfile(admin);

  assert.equal(selectProfileAs(aliceCtx, alice.userId)?.email, "alice@dial.test");
  assert.throws(() => selectProfileAs(aliceCtx, bob.userId));
  assert.throws(() =>
    selectProfileAs(aliceCtx, alice.userId, { bodyUserId: "attacker" }),
  );

  const updated = updateProfileAs(aliceCtx, alice.userId, {
    displayName: "Alice Updated",
  });
  assert.equal(updated.displayName, "Alice Updated");
  assert.throws(() =>
    updateProfileAs(bobCtx, alice.userId, { displayName: "Hijack" }),
  );

  assert.throws(() => listProfilesAs(aliceCtx));
  const all = listProfilesAs(adminCtx);
  assert.equal(all.length, 3);
  assert.equal(selectProfileAs(adminCtx, bob.userId)?.email, "bob@dial.test");
});

test("S93 Supabase Auth fixture sign-in + fail-closed server config", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  const pub = getSupabasePublicConfig();
  assert.ok(pub.url);
  assert.ok(pub.anonKey);
  const server = getSupabaseServerConfig();
  assert.ok(server.serviceRoleKey);
  const session = await signInWithPassword({
    email: "buyer@dial.test",
    password: "x",
  });
  assert.ok(session.accessToken.startsWith("sb_fx_"));
  assert.equal(session.email, "buyer@dial.test");

  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert.throws(() => getSupabasePublicConfig());
  process.env.DIAL_INTEGRATION_MODE = "fixture";
});

test("PD1 Supabase sign-up + profile upsert (fixture) + short password reject", async () => {
  process.env.DIAL_INTEGRATION_MODE = "fixture";
  __resetIdentityForTests();
  await assert.rejects(
    () =>
      signUpWithPassword({
        email: "new@dial.test",
        password: "short",
      }),
    /at least 8/,
  );
  const auth = await signUpWithPassword({
    email: "new@dial.test",
    password: "password1",
  });
  assert.ok(auth.accessToken.startsWith("sb_fx_"));
  const profile = await upsertProfileAfterAuth({
    userId: auth.userId,
    email: auth.email,
    displayName: "New User",
    buyerSegment: "b2b",
    accessToken: auth.accessToken,
  });
  assert.equal(profile.buyerSegment, "b2b");
  assert.equal(signInByEmail("new@dial.test")?.displayName, "New User");
  const ctx = rlsContextFromProfile(profile);
  assert.equal(selectProfileAs(ctx, profile.userId)?.buyerSegment, "b2b");
});
