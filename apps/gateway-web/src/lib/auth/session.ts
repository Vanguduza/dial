/**
 * PD1 Identity session — DialSession cookie cache over Supabase Auth + profiles.
 * Never trust userId/email/role from request body (D-47).
 */
import type { ProfileRole } from "@dial/identity";
import type Redis from "ioredis";

export type DialSession = {
  userId: string;
  email: string;
  role: "customer" | "ops_admin" | "technician";
  /** Spare buyer segment for Meili/search (D-49). Session only — never from body. */
  buyerSegment: "b2c" | "b2b";
};

const COOKIE = "dial_session";
const REDIS_PREFIX = "dial:session:";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

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

let redisPromise: Promise<Redis | null> | null = null;

function redisEnabled(): boolean {
  const mode = (process.env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  return Boolean(process.env.REDIS_URL?.trim()) && mode !== "fixture";
}

async function redisClient(): Promise<Redis | null> {
  if (!redisEnabled()) return null;
  if (!redisPromise) {
    redisPromise = import("ioredis")
      .then(({ default: RedisCtor }) => {
        const client = new RedisCtor(process.env.REDIS_URL!, {
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
        });
        client.on("error", () => undefined);
        return client;
      })
      .catch(() => null);
  }
  return redisPromise;
}

function persistSession(token: string, session: DialSession): void {
  sessions().set(token, session);
  void redisClient().then((client) => {
    if (!client) return;
    return client.set(
      `${REDIS_PREFIX}${token}`,
      JSON.stringify(session),
      "EX",
      SESSION_TTL_SECONDS,
    );
  });
}

async function loadSession(token: string): Promise<DialSession | null> {
  const mem = sessions().get(token);
  if (mem) return mem;
  const client = await redisClient();
  if (!client) return null;
  const raw = await client.get(`${REDIS_PREFIX}${token}`);
  if (!raw) return null;
  const session = JSON.parse(raw) as DialSession;
  sessions().set(token, session);
  return session;
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
  persistSession(token, session);
  return { token, session };
}

export function getSessionFromToken(token: string | undefined): DialSession | null {
  if (!token) return null;
  return sessions().get(token) ?? null;
}

export async function getSessionFromTokenDurable(
  token: string | undefined,
): Promise<DialSession | null> {
  if (!token) return null;
  return loadSession(token);
}

export async function requireSession(
  req: Request,
): Promise<DialSession | null> {
  return getSessionFromTokenDurable(parseSessionCookie(req.headers.get("cookie")));
}

export async function requireAdminSession(
  req: Request,
): Promise<DialSession | null> {
  const session = await requireSession(req);
  if (!session || session.role !== "ops_admin") return null;
  return session;
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

/** Test helper — never used as a production identity source. */
export function testAuthCookie(input: {
  userId: string;
  email?: string;
  role?: DialSession["role"];
  buyerSegment?: DialSession["buyerSegment"];
}): string {
  const { token } = createSession({
    userId: input.userId,
    email: input.email ?? `${input.userId}@dial.test`,
    ...(input.role ? { role: input.role } : {}),
    ...(input.buyerSegment ? { buyerSegment: input.buyerSegment } : {}),
  });
  return `${COOKIE}=${token}`;
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
