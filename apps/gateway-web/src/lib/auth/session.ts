/**
 * PD1 Identity session — DialSession cookie cache over Supabase Auth + profiles.
 * Never trust userId/email/role from request body (D-47).
 */
import type { ProfileRole } from "@dial/identity";

export type DialSession = {
  userId: string;
  email: string;
  role: "customer" | "ops_admin" | "technician";
  /** Spare buyer segment for Meili/search (D-49). Session only — never from body. */
  buyerSegment: "b2c" | "b2b";
};

const COOKIE = "dial_session";

type SessionStore = Map<string, DialSession>;

function sessions(): SessionStore {
  const g = globalThis as typeof globalThis & {
    __dialSessionStore?: SessionStore;
  };
  if (!g.__dialSessionStore) {
    g.__dialSessionStore = new Map();
  }
  return g.__dialSessionStore;
}

function dialRoleFromProfile(role: ProfileRole): DialSession["role"] {
  if (role === "admin") return "ops_admin";
  if (role === "technician") return "technician";
  return "customer";
}

export function createSession(input: {
  email: string;
  userId?: string;
  role?: DialSession["role"];
  buyerSegment?: DialSession["buyerSegment"];
}): { token: string; session: DialSession } {
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error("email required");
  const token = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  const session: DialSession = {
    userId:
      input.userId ??
      `usr_${Buffer.from(email).toString("base64url").slice(0, 16)}`,
    email,
    role: input.role ?? "customer",
    buyerSegment: input.buyerSegment ?? "b2c",
  };
  sessions().set(token, session);
  return { token, session };
}

export function getSessionFromToken(token: string | undefined): DialSession | null {
  if (!token) return null;
  return sessions().get(token) ?? null;
}

export function parseSessionCookie(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  const part = cookieHeader
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${COOKIE}=`));
  return part?.slice(COOKIE.length + 1);
}

/** Priority resources for T9 / Appendix A.1 IDOR smoke (≥5). */
export type ProtectedResourceKind =
  | "job"
  | "order"
  | "vehicle"
  | "promo_credit"
  | "delivery_job"
  | "delivery_offer"
  | "courier_location"
  | "profile";

/** Object-level AuthZ — resource owner must match session, never body. */
export function assertResourceAccess(input: {
  session: DialSession;
  resourceOwnerId: string;
  resourceKind?: ProtectedResourceKind;
  /** Forbidden: callers must not pass body userId as authority. */
  bodyUserId?: string;
}): void {
  if (input.bodyUserId !== undefined) {
    throw new Error("Refuse body userId for AuthZ (D-47)");
  }
  if (input.session.userId !== input.resourceOwnerId) {
    const kind = input.resourceKind ? ` (${input.resourceKind})` : "";
    throw new Error(`IDOR: session user cannot access this resource${kind}`);
  }
}

/** Authorize before cache read — keys must include userId (D-47). */
export function userScopedCacheKey(userId: string, suffix: string): string {
  if (!userId) throw new Error("userId required for cache key");
  return `u:${userId}:${suffix}`;
}

export function sessionCookieName(): string {
  return COOKIE;
}

export function __resetAuthForTests(): void {
  sessions().clear();
}

/**
 * Supabase password sign-in → profile row → DialSession cookie SoR (PD1).
 * Never trusts body userId/role; loads role + buyerSegment from profile.
 */
export async function createSessionFromSupabasePassword(input: {
  email: string;
  password: string;
  buyerSegment?: DialSession["buyerSegment"];
}): Promise<{ token: string; session: DialSession; accessToken: string }> {
  const {
    signInWithPassword,
    fetchProfileForAuthUser,
    upsertProfileAfterAuth,
  } = await import("@dial/identity");
  const auth = await signInWithPassword({
    email: input.email,
    password: input.password,
  });
  let profile = await fetchProfileForAuthUser({
    userId: auth.userId,
    accessToken: auth.accessToken,
  });
  if (!profile) {
    profile = await upsertProfileAfterAuth({
      userId: auth.userId,
      email: auth.email,
      displayName: auth.email.split("@")[0] || "DIAL user",
      accessToken: auth.accessToken,
      ...(input.buyerSegment !== undefined
        ? { buyerSegment: input.buyerSegment }
        : {}),
    });
  }
  const created = createSession({
    email: profile.email,
    userId: profile.userId,
    role: dialRoleFromProfile(profile.role),
    buyerSegment: input.buyerSegment ?? profile.buyerSegment,
  });
  return { ...created, accessToken: auth.accessToken };
}

/**
 * Supabase password sign-up → profile upsert → DialSession (PD1).
 */
export async function createSessionFromSupabaseSignUp(input: {
  email: string;
  password: string;
  displayName: string;
  buyerSegment?: DialSession["buyerSegment"];
}): Promise<{ token: string; session: DialSession; accessToken: string }> {
  const { signUpWithPassword, upsertProfileAfterAuth } = await import(
    "@dial/identity"
  );
  const auth = await signUpWithPassword({
    email: input.email,
    password: input.password,
  });
  const profile = await upsertProfileAfterAuth({
    userId: auth.userId,
    email: auth.email,
    displayName: input.displayName,
    accessToken: auth.accessToken,
    ...(input.buyerSegment !== undefined
      ? { buyerSegment: input.buyerSegment }
      : {}),
  });
  const created = createSession({
    email: profile.email,
    userId: profile.userId,
    role: dialRoleFromProfile(profile.role),
    buyerSegment: profile.buyerSegment,
  });
  return { ...created, accessToken: auth.accessToken };
}
