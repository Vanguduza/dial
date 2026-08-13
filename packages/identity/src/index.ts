/**
 * T1 Identity — profiles + RLS policy stub (Pack §12 / §15).
 * Auth context is always session-derived; never trust body userId/email/role (D-47).
 */

export type ProfileRole = "customer" | "technician" | "supplier" | "admin";

export type Profile = {
  userId: string;
  email: string;
  displayName: string;
  role: ProfileRole;
  createdAt: string;
};

/** Session SoR for RLS — never constructed from request body identity fields. */
export type RlsContext = {
  userId: string;
  role: ProfileRole;
};

const profiles = new Map<string, Profile>();
const emailIndex = new Map<string, string>();

function userIdFromEmail(email: string): string {
  return `usr_${Buffer.from(email).toString("base64url").slice(0, 16)}`;
}

export function __resetIdentityForTests(): void {
  profiles.clear();
  emailIndex.clear();
}

export function signUp(input: {
  email: string;
  displayName: string;
  role?: ProfileRole;
}): Profile {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  if (!email) throw new Error("email required");
  if (!displayName) throw new Error("displayName required");
  if (emailIndex.has(email)) throw new Error("email already registered");

  const role = input.role ?? "customer";
  const profile: Profile = {
    userId: userIdFromEmail(email),
    email,
    displayName,
    role,
    createdAt: new Date().toISOString(),
  };
  profiles.set(profile.userId, profile);
  emailIndex.set(email, profile.userId);
  return { ...profile };
}

export function signInByEmail(emailRaw: string): Profile | null {
  const email = emailRaw.trim().toLowerCase();
  if (!email) return null;
  const userId = emailIndex.get(email);
  if (!userId) return null;
  const profile = profiles.get(userId);
  return profile ? { ...profile } : null;
}

export function getProfileByUserId(userId: string): Profile | null {
  const profile = profiles.get(userId);
  return profile ? { ...profile } : null;
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
  patch: { displayName?: string },
  opts?: { bodyUserId?: string },
): Profile {
  assertNoBodyUserId(opts?.bodyUserId);
  if (!canAccessProfile(ctx, targetUserId)) {
    throw new Error("RLS deny: profiles update");
  }
  const existing = profiles.get(targetUserId);
  if (!existing) throw new Error("profile not found");
  if (patch.displayName !== undefined) {
    const displayName = patch.displayName.trim();
    if (!displayName) throw new Error("displayName required");
    existing.displayName = displayName;
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
  return [...profiles.values()].map((p) => ({ ...p }));
}

export function rlsContextFromProfile(profile: Profile): RlsContext {
  return { userId: profile.userId, role: profile.role };
}

export {
  getSupabasePublicConfig,
  getSupabaseServerConfig,
  signInWithPassword,
  integrationMode as supabaseIntegrationMode,
  type SupabasePublicConfig,
  type SupabaseServerConfig,
} from "./supabaseAuth.js";
