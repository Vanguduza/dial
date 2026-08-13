import assert from "node:assert/strict";
import { test } from "node:test";
import {
  __resetIdentityForTests,
  listProfilesAs,
  rlsContextFromProfile,
  selectProfileAs,
  signInByEmail,
  signUp,
  updateProfileAs,
} from "./index.js";

test("T1 sign-up/sign-in creates and resolves profile", () => {
  __resetIdentityForTests();
  const created = signUp({
    email: "buyer@dial.test",
    displayName: "Buyer One",
  });
  assert.equal(created.role, "customer");
  assert.equal(signInByEmail("Buyer@dial.test")?.userId, created.userId);
  assert.equal(signInByEmail("missing@dial.test"), null);
  assert.throws(() =>
    signUp({ email: "buyer@dial.test", displayName: "Dup" }),
  );
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
  const {
    getSupabasePublicConfig,
    getSupabaseServerConfig,
    signInWithPassword,
  } = await import("./supabaseAuth.js");
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
