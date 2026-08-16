import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { dialTokens } from "@dial/design-tokens";
import { buildAuthHomeSnapshot } from "../../lib/home/authHome";
import {
  getSessionFromToken,
  parseSessionCookie,
  sessionCookieName,
} from "../../lib/auth/session";

/**
 * PD26 Auth home — Welcome-back + Shop | Services (Pack §9.1).
 * Responsive: stacked lanes on narrow, dual columns from 768px.
 * Rive greeting optional / deferred. No money path.
 */
export default async function AuthHomePage() {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  const session = getSessionFromToken(token);
  if (!session) {
    redirect("/");
  }

  const home = buildAuthHomeSnapshot(session);

  return (
    <main
      className="dial-home"
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${dialTokens.color.brand.surface} 0%, #e8ebe4 55%, ${dialTokens.color.brand.primary}22 100%)`,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.lg,
      }}
    >
      <style>{`
        .dial-home-lanes {
          display: grid;
          gap: ${dialTokens.space.lg};
          grid-template-columns: 1fr;
          max-width: 920px;
          margin: ${dialTokens.space.xl} auto 0;
        }
        @media (min-width: ${home.responsive.desktopMinWidthPx}px) {
          .dial-home-lanes {
            grid-template-columns: 1fr 1fr;
          }
        }
        .dial-home-dest {
          display: block;
          padding: ${dialTokens.space.md};
          border-radius: 10px;
          background: #fff;
          color: ${dialTokens.color.brand.ink};
          text-decoration: none;
          border: 1px solid ${dialTokens.color.brand.primary}22;
        }
        .dial-home-dest:focus-visible {
          outline: 2px solid ${dialTokens.color.brand.accent};
          outline-offset: 2px;
        }
      `}</style>

      <header style={{ maxWidth: 920, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            fontSize: "clamp(2rem, 5vw, 2.75rem)",
            margin: 0,
            color: dialTokens.color.brand.primary,
          }}
        >
          DIAL
        </p>
        <h1
          style={{
            fontSize: "clamp(1.25rem, 3.5vw, 1.75rem)",
            fontWeight: 600,
            margin: `${dialTokens.space.sm} 0 0`,
          }}
        >
          {home.welcomeBack}
        </h1>
        <p style={{ opacity: 0.75, fontSize: 14, marginTop: 6 }}>
          {home.email} · {home.buyerSegment.toUpperCase()}
        </p>
        <span data-testid="pd122-rive-greeting" hidden aria-hidden="true" />
      </header>

      <section className="dial-home-lanes" aria-label="Shop and Services">
        {home.primaryLanes.map((lane) => (
          <article
            key={lane.id}
            style={{
              padding: dialTokens.space.lg,
              borderRadius: 14,
              background:
                lane.id === "shop"
                  ? dialTokens.color.brand.primary
                  : dialTokens.color.brand.accent,
              color: "#fff",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.35rem" }}>{lane.title}</h2>
            <p style={{ margin: "6px 0 14px", opacity: 0.92, fontSize: 14 }}>
              {lane.blurb}
            </p>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "grid",
                gap: dialTokens.space.sm,
              }}
            >
              {lane.destinations.map((d) => (
                <li key={d.id}>
                  <Link className="dial-home-dest" href={d.href}>
                    <strong>{d.label}</strong>
                    <span
                      style={{
                        display: "block",
                        fontSize: 13,
                        opacity: 0.8,
                        marginTop: 2,
                      }}
                    >
                      {d.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

    </main>
  );
}

/** Exported for tests — cookie header → session. */
export function sessionFromCookieHeader(cookieHeader: string | null) {
  return getSessionFromToken(parseSessionCookie(cookieHeader));
}
