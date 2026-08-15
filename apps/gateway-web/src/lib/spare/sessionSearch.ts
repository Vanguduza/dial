/**
 * PD3 Spare UI — session-scoped search against catalogue/Meili path (PD2).
 * Never trusts body/query role (D-47); buyerSegment from DialSession only (D-49).
 */
import {
  searchOffersAsync,
  type SearchSessionRole,
  type StubOffer,
} from "@dial/catalogue";
import {
  getSessionFromToken,
  sessionCookieName,
  type DialSession,
} from "../auth/session";

export function sessionRoleFromDialSession(
  session: DialSession | null | undefined,
): SearchSessionRole {
  return session?.buyerSegment === "b2b" ? "b2b" : "b2c";
}

export function sessionFromCookieStore(
  get: (name: string) => { value: string } | undefined,
): {
  session: DialSession | null;
  sessionRole: SearchSessionRole;
} {
  const session = getSessionFromToken(get(sessionCookieName())?.value);
  return { session, sessionRole: sessionRoleFromDialSession(session) };
}

export async function searchSpareForSession(
  q: string,
  sessionRole: SearchSessionRole,
  opts?: { chassis?: string },
): Promise<{
  hits: StubOffer[];
  source: "memory" | "meili";
  meiliFilter: string;
  indexUid: string;
  currency: "USD";
  chassisFilter?: string;
}> {
  const chassis = opts?.chassis?.trim();
  if (chassis) {
    const { searchOffersByChassis, meiliFilterForSession } = await import(
      "@dial/catalogue"
    );
    const hits = searchOffersByChassis({
      chassisCode: chassis,
      sessionRole,
      entryPath: "select_vehicle",
    });
    return {
      hits: hits as StubOffer[],
      source: "memory",
      meiliFilter: meiliFilterForSession(sessionRole),
      indexUid: process.env.MEILI_SPARE_INDEX?.trim() || "spare_offers_v1",
      currency: "USD",
      chassisFilter: chassis,
    };
  }
  const result = await searchOffersAsync(q, { sessionRole });
  return {
    hits: result.hits,
    source: result.source,
    meiliFilter: result.meiliFilter,
    indexUid: result.indexUid,
    currency: "USD",
  };
}

/** PDP lookup — applies D-49 session filter (B2B cannot open informal via deep link). */
export async function findOfferForSession(
  offerId: string,
  sessionRole: SearchSessionRole,
): Promise<StubOffer | null> {
  const { hits } = await searchSpareForSession("", sessionRole);
  return hits.find((o) => o.offerId === offerId) ?? null;
}
