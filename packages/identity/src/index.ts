/**
 * T1 / PD1 Identity — profiles + RLS (Pack §12 / §15).
 * Auth context is always session-derived; never trust body userId/email/role (D-47).
 * Fixture: in-memory SoR. Sandbox/live: PostgREST `profiles` with service-role upsert + JWT RLS reads.
 */

import { __resetStepUpForTests } from "./stepUp.js";
import { __resetMarketingConsentForTests } from "./marketingConsent.js";
import { __resetCustomerAddressesForTests } from "./customerAddresses.js";
import { __resetNotificationPrefsForTests } from "./notificationPrefs.js";

export type ProfileRole = "customer" | "technician" | "supplier" | "admin";
export type BuyerSegment = "b2c" | "b2b";

export type Profile = {
  userId: string;
  email: string;
  displayName: string;
  role: ProfileRole;
  buyerSegment: BuyerSegment;
  createdAt: string;
};

/** Session SoR for RLS — never constructed from request body identity fields. */
export type RlsContext = {
  userId: string;
  role: ProfileRole;
};

type IdentityStore = {
  profiles: Map<string, Profile>;
  emailIndex: Map<string, string>;
};

function store(): IdentityStore {
  const g = globalThis as typeof globalThis & {
    __dialIdentityStore?: IdentityStore;
  };
  if (!g.__dialIdentityStore) {
    g.__dialIdentityStore = {
      profiles: new Map(),
      emailIndex: new Map(),
    };
  }
  return g.__dialIdentityStore;
}

function userIdFromEmail(email: string): string {
  return `usr_${Buffer.from(email).toString("base64url").slice(0, 16)}`;
}

export function __resetIdentityForTests(): void {
  const s = store();
  s.profiles.clear();
  s.emailIndex.clear();
  __resetStepUpForTests();
  __resetMarketingConsentForTests();
  __resetCustomerAddressesForTests();
  __resetNotificationPrefsForTests();
}

function putProfile(profile: Profile): Profile {
  const s = store();
  s.profiles.set(profile.userId, profile);
  s.emailIndex.set(profile.email, profile.userId);
  return { ...profile };
}

export function signUp(input: {
  email: string;
  displayName: string;
  role?: ProfileRole;
  buyerSegment?: BuyerSegment;
  /** When set (after GoTrue), use auth user id instead of email-derived id. */
  userId?: string;
}): Profile {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  if (!email) throw new Error("email required");
  if (!displayName) throw new Error("displayName required");
  const s = store();
  if (s.emailIndex.has(email)) throw new Error("email already registered");

  const role = input.role ?? "customer";
  const profile: Profile = {
    userId: input.userId ?? userIdFromEmail(email),
    email,
    displayName,
    role,
    buyerSegment: input.buyerSegment ?? "b2c",
    createdAt: new Date().toISOString(),
  };
  return putProfile(profile);
}

export function signInByEmail(emailRaw: string): Profile | null {
  const email = emailRaw.trim().toLowerCase();
  if (!email) return null;
  const userId = store().emailIndex.get(email);
  if (!userId) return null;
  const profile = store().profiles.get(userId);
  return profile ? { ...profile } : null;
}

export function getProfileByUserId(userId: string): Profile | null {
  const profile = store().profiles.get(userId);
  return profile ? { ...profile } : null;
}

/**
 * Upsert profile after AuthN (fixture memory + optional PostgREST).
 * Never accepts role/userId from request body — caller passes auth-derived ids only.
 */
export async function upsertProfileAfterAuth(input: {
  userId: string;
  email: string;
  displayName: string;
  role?: ProfileRole;
  buyerSegment?: BuyerSegment;
  accessToken?: string;
}): Promise<Profile> {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  if (!input.userId) throw new Error("userId required");
  if (!email) throw new Error("email required");
  if (!displayName) throw new Error("displayName required");

  const existing =
    store().profiles.get(input.userId) ?? signInByEmail(email);
  const profile: Profile = {
    userId: input.userId,
    email,
    displayName,
    role: input.role ?? existing?.role ?? "customer",
    buyerSegment: input.buyerSegment ?? existing?.buyerSegment ?? "b2c",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  putProfile(profile);

  const { integrationMode, getSupabaseServerConfig, getSupabaseRestUrl } =
    await import("./supabaseAuth.js");
  if (integrationMode() === "fixture") {
    return { ...profile };
  }

  const { serviceRoleKey, anonKey } = getSupabaseServerConfig();
  const base = getSupabaseRestUrl();
  const res = await fetch(`${base}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      user_id: profile.userId,
      email: profile.email,
      display_name: profile.displayName,
      role: profile.role,
      buyer_segment: profile.buyerSegment,
      created_at: profile.createdAt,
    }),
  });
  if (!res.ok) {
    throw new Error(`profiles upsert HTTP ${res.status}`);
  }
  return { ...profile };
}

/** Load profile by auth user id — memory first; PostgREST with user JWT when configured. */
export async function fetchProfileForAuthUser(input: {
  userId: string;
  accessToken?: string;
}): Promise<Profile | null> {
  const local = getProfileByUserId(input.userId);
  if (local) return local;

  const { integrationMode, getSupabasePublicConfig, getSupabaseRestUrl } =
    await import("./supabaseAuth.js");
  if (integrationMode() === "fixture") return null;
  if (!input.accessToken) return null;

  const { anonKey } = getSupabasePublicConfig();
  const base = getSupabaseRestUrl();
  const res = await fetch(
    `${base}/rest/v1/profiles?user_id=eq.${encodeURIComponent(input.userId)}&select=*`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${input.accessToken}`,
      },
    },
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{
    user_id: string;
    email: string;
    display_name: string;
    role: ProfileRole;
    buyer_segment?: BuyerSegment;
    created_at: string;
  }>;
  const row = rows[0];
  if (!row) return null;
  const profile: Profile = {
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    buyerSegment: row.buyer_segment ?? "b2c",
    createdAt: row.created_at,
  };
  return putProfile(profile);
}

function assertNoBodyUserId(bodyUserId: string | undefined): void {
  if (bodyUserId !== undefined) {
    throw new Error("Refuse body userId for AuthZ (D-47)");
  }
}

function canAccessProfile(ctx: RlsContext, targetUserId: string): boolean {
  if (ctx.role === "admin") return true;
  return ctx.userId === targetUserId;
}

/** RLS: select own profile (or admin all). */
export function selectProfileAs(
  ctx: RlsContext,
  targetUserId: string,
  opts?: { bodyUserId?: string },
): Profile | null {
  assertNoBodyUserId(opts?.bodyUserId);
  if (!canAccessProfile(ctx, targetUserId)) {
    throw new Error("RLS deny: profiles select");
  }
  return getProfileByUserId(targetUserId);
}

/** RLS: update own profile (or admin). */
export function updateProfileAs(
  ctx: RlsContext,
  targetUserId: string,
  patch: { displayName?: string; buyerSegment?: BuyerSegment },
  opts?: { bodyUserId?: string },
): Profile {
  assertNoBodyUserId(opts?.bodyUserId);
  if (!canAccessProfile(ctx, targetUserId)) {
    throw new Error("RLS deny: profiles update");
  }
  const existing = store().profiles.get(targetUserId);
  if (!existing) throw new Error("profile not found");
  if (patch.displayName !== undefined) {
    const displayName = patch.displayName.trim();
    if (!displayName) throw new Error("displayName required");
    existing.displayName = displayName;
  }
  if (patch.buyerSegment !== undefined) {
    existing.buyerSegment = patch.buyerSegment;
  }
  return { ...existing };
}

/** RLS: list — admin only (Pack §12 admin all). */
export function listProfilesAs(
  ctx: RlsContext,
  opts?: { bodyUserId?: string },
): Profile[] {
  assertNoBodyUserId(opts?.bodyUserId);
  if (ctx.role !== "admin") {
    throw new Error("RLS deny: profiles list");
  }
  return [...store().profiles.values()].map((p) => ({ ...p }));
}

export function rlsContextFromProfile(profile: Profile): RlsContext {
  return { userId: profile.userId, role: profile.role };
}

export function rlsContextFromSession(session: {
  userId: string;
  role: "customer" | "ops_admin" | "technician";
}): RlsContext {
  const role: ProfileRole =
    session.role === "ops_admin"
      ? "admin"
      : session.role === "technician"
        ? "technician"
        : "customer";
  return { userId: session.userId, role };
}

/**
 * PD82 thin vertical: sign-up → update own displayName → cross-tenant deny (Pack §10).
 */
export function runPd82AccountProfileThinVertical(): {
  displayNameUpdated: true;
  buyerSegment: "b2c";
  crossTenantDenied: true;
  payableFromAi: false;
} {
  __resetIdentityForTests();
  const alice = signUp({
    email: "alice_pd82@dial.test",
    displayName: "Alice PD82",
  });
  const bob = signUp({
    email: "bob_pd82@dial.test",
    displayName: "Bob PD82",
  });
  const aliceCtx = rlsContextFromProfile(alice);
  const updated = updateProfileAs(aliceCtx, alice.userId, {
    displayName: "Alice Updated",
  });
  if (updated.displayName !== "Alice Updated") {
    throw new Error("PD82 own profile update failed");
  }
  const bobCtx = rlsContextFromProfile(bob);
  let denied = false;
  try {
    updateProfileAs(bobCtx, alice.userId, { displayName: "Hijack" });
  } catch {
    denied = true;
  }
  if (!denied) throw new Error("PD82 expected cross-tenant update deny");
  const self = selectProfileAs(aliceCtx, alice.userId);
  if (!self || self.displayName !== "Alice Updated") {
    throw new Error("PD82 select own profile failed");
  }
  if (alice.buyerSegment !== "b2c") {
    throw new Error("PD82 expected b2c default");
  }
  return {
    displayNameUpdated: true,
    buyerSegment: "b2c",
    crossTenantDenied: true,
    payableFromAi: false,
  };
}

export {
  assertStepUpVerified,
  getStepUpChallenge,
  requestStepUp,
  runPd73IdentityStepUpThinVertical,
  verifyStepUp,
  __resetStepUpForTests,
  type StepUpChallenge,
} from "./stepUp.js";

export {
  getMarketingConsent,
  listMarketingConsentAudit,
  runPd78MarketingConsentThinVertical,
  setMarketingConsent,
  __resetMarketingConsentForTests,
  type MarketingConsentEvent,
  type MarketingConsentState,
} from "./marketingConsent.js";

export {
  getNotificationPrefMatrix,
  setNotificationPref,
  runPd131NotificationPrefsThinVertical,
  __resetNotificationPrefsForTests,
  type NotificationChannel,
  type NotificationCostClass,
  type NotificationPrefCell,
  type NotificationPrefMatrix,
  type NotificationTopic,
} from "./notificationPrefs.js";

export {
  addCustomerAddress,
  deleteCustomerAddress,
  listCustomerAddresses,
  runPd83CustomerAddressesThinVertical,
  setDefaultCustomerAddress,
  __resetCustomerAddressesForTests,
  type CustomerAddress,
} from "./customerAddresses.js";

export {
  getSupabasePublicConfig,
  getSupabaseServerConfig,
  getSupabaseRestUrl,
  signInWithPassword,
  signUpWithPassword,
  getUserFromAccessToken,
  integrationMode as supabaseIntegrationMode,
  type SupabasePublicConfig,
  type SupabaseServerConfig,
} from "./supabaseAuth.js";
