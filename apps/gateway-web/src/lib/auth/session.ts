/**
 * T1 Identity session stub (Pack §15) — JWT/Supabase later.
 * Never trust userId/email/role from request body (D-47).
 */
export type DialSession = {
  userId: string;
  email: string;
  role: "customer" | "ops_admin" | "technician";
  /** Spare buyer segment for Meili/search (D-49). Session only — never from body. */
  buyerSegment: "b2c" | "b2b";
};

const COOKIE = "dial_session";

const sessions = new Map<string, DialSession>();

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
  sessions.set(token, session);
  return { token, session };
}

export function getSessionFromToken(token: string | undefined): DialSession | null {
  if (!token) return null;
  return sessions.get(token) ?? null;
}

export function parseSessionCookie(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  const part = cookieHeader.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${COOKIE}=`));
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
  | "courier_location";

/** Object-level AuthZ stub — resource owner must match session, never body. */
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
  sessions.clear();
}
