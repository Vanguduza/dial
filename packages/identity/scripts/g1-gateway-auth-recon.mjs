/**
 * G1 gateway Auth recon — same handlers as /api/auth/sign-in + /api/auth/me.
 */
import { POST as signIn } from "../../../apps/gateway-web/src/app/api/auth/sign-in/route.ts";
import { GET as me } from "../../../apps/gateway-web/src/app/api/auth/me/route.ts";
import { sessionCookieName } from "../../../apps/gateway-web/src/lib/auth/session.ts";
import {
  getSupabasePublicConfig,
  getSupabaseServerConfig,
  signUpWithPassword,
} from "../src/index.ts";

const email =
  process.env.DIAL_SANDBOX_AUTH_EMAIL?.trim() ||
  `g1_gw_${Date.now().toString(36)}@example.com`;
const password =
  process.env.DIAL_SANDBOX_AUTH_PASSWORD?.trim() || "DialSandbox1!";

const pub = getSupabasePublicConfig();
const server = getSupabaseServerConfig();
try {
  await signUpWithPassword({ email, password });
} catch {
  await fetch(`${pub.url.replace(/\/$/, "")}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: server.serviceRoleKey,
      Authorization: `Bearer ${server.serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
}

const signRes = await signIn(
  new Request("http://localhost/api/auth/sign-in", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  }),
);
const signJson = await signRes.json();
const setCookie = signRes.headers.get("set-cookie") || "";
const cookieName = sessionCookieName();
const cookieMatch = setCookie.match(new RegExp(`${cookieName}=([^;]+)`));
if (signRes.status !== 200 || !signJson.ok || !cookieMatch) {
  console.log(
    JSON.stringify({
      ok: false,
      step: "sign-in",
      status: signRes.status,
      error: signJson.error || "missing cookie",
      auth: signJson.auth,
    }),
  );
  process.exit(1);
}
if (signJson.auth !== "supabase") {
  console.log(JSON.stringify({ ok: false, error: "expected auth=supabase" }));
  process.exit(1);
}

const meRes = await me(
  new Request("http://localhost/api/auth/me", {
    headers: { cookie: `${cookieName}=${cookieMatch[1]}` },
  }),
);
const meJson = await meRes.json();
if (meRes.status !== 200 || !meJson.ok) {
  console.log(
    JSON.stringify({
      ok: false,
      step: "me",
      status: meRes.status,
      error: meJson.error,
    }),
  );
  process.exit(1);
}

console.log(
  JSON.stringify({
    ok: true,
    mode: process.env.DIAL_INTEGRATION_MODE,
    auth: "gotrue+gateway",
    userId: meJson.userId,
    email: meJson.email,
    displayName: meJson.displayName,
    cookieSet: true,
    note: "G1 Auth path: password → GoTrue → DialSession cookie → GET /api/auth/me",
  }),
);
