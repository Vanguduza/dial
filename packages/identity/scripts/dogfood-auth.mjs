/**
 * Phase 1 sandbox Auth dogfood — password sign-in → profile (GoTrue).
 * Requires DIAL_INTEGRATION_MODE=sandbox + NEXT_PUBLIC_SUPABASE_* + SUPABASE_SERVICE_ROLE_KEY.
 * Uses a deliverable-looking example.com email (GoTrue rejects fake TLDs).
 * Never prints secret values.
 */
import {
  getSupabasePublicConfig,
  getSupabaseServerConfig,
  signInWithPassword,
  signUpWithPassword,
  upsertProfileAfterAuth,
  selectProfileAs,
  rlsContextFromSession,
  supabaseIntegrationMode,
} from "../src/index.ts";

const mode = supabaseIntegrationMode();
if (mode === "fixture") {
  console.error(
    JSON.stringify({
      ok: false,
      error:
        "Set DIAL_INTEGRATION_MODE=sandbox and Supabase credentials — fixture cannot satisfy G1 Auth anti-stub",
    }),
  );
  process.exit(1);
}

let pub;
let server;
try {
  pub = getSupabasePublicConfig();
  server = getSupabaseServerConfig();
} catch (e) {
  console.error(
    JSON.stringify({
      ok: false,
      mode,
      error: e instanceof Error ? e.message : "Supabase config fail closed",
    }),
  );
  process.exit(1);
}

const email = (
  process.env.DIAL_SANDBOX_AUTH_EMAIL?.trim() ||
  `g1_${Date.now().toString(36)}@example.com`
).toLowerCase();
const password =
  process.env.DIAL_SANDBOX_AUTH_PASSWORD?.trim() || "DialSandbox1!";

async function adminEnsureUser() {
  const url = pub.url.replace(/\/$/, "");
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: server.serviceRoleKey,
      Authorization: `Bearer ${server.serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  });
  if (res.status === 200 || res.status === 201) return "created";
  // already exists is fine
  if (res.status === 422 || res.status === 400) return "exists_or_rejected";
  throw new Error(`admin create user HTTP ${res.status}`);
}

let accessToken;
let userId;
let path = "signup";
try {
  try {
    const up = await signUpWithPassword({ email, password });
    accessToken = up.accessToken;
    userId = up.userId;
  } catch {
    path = "admin_then_signin";
    await adminEnsureUser();
    const inn = await signInWithPassword({ email, password });
    accessToken = inn.accessToken;
    userId = inn.userId;
  }
} catch (e) {
  console.error(
    JSON.stringify({
      ok: false,
      mode,
      error: e instanceof Error ? e.message : "GoTrue sign-in failed",
    }),
  );
  process.exit(1);
}

if (String(accessToken).startsWith("sb_fx_")) {
  console.error(
    JSON.stringify({
      ok: false,
      mode,
      error: "Fixture token issued — G1 Auth anti-stub failed",
    }),
  );
  process.exit(1);
}

const profile = await upsertProfileAfterAuth({
  userId,
  email,
  displayName: "G1 Sandbox",
  accessToken,
});

const session = { userId: profile.userId, role: "customer" };
const me = selectProfileAs(rlsContextFromSession(session), profile.userId);
if (!me) {
  console.error(JSON.stringify({ ok: false, error: "profile missing after auth" }));
  process.exit(1);
}

console.log(
  JSON.stringify({
    ok: true,
    mode,
    auth: "gotrue",
    path,
    userId: me.userId,
    email: me.email,
    displayName: me.displayName,
    tokenPrefix: String(accessToken).slice(0, 8),
    note: "Password → GoTrue → profile. Complete gateway cookie path via POST /api/auth/sign-in then GET /api/auth/me",
  }),
);
