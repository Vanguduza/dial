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

/** Object-level AuthZ stub — resource owner must match session, never body. */
export function assertResourceAccess(input: {
  session: DialSession;
  resourceOwnerId: string;
  /** Forbidden: callers must not pass body userId as authority. */
  bodyUserId?: string;
}): void {
  if (input.bodyUserId !== undefined) {
    throw new Error("Refuse body userId for AuthZ (D-47)");
  }
  if (input.session.userId !== input.resourceOwnerId) {
    throw new Error("IDOR: session user cannot access this resource");
  }
}

export function sessionCookieName(): string {
  return COOKIE;
}

export function __resetAuthForTests(): void {
  sessions.clear();
}
