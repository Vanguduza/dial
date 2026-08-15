/**
 * T4 Tech home — FixItNow-patterned intake entry (Pack §15).
 */
import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";
import { listChecklists } from "../../lib/tech/stubs";

export default function TechHomePage() {
  const lists = listChecklists();
  return (
    <main
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${dialTokens.color.brand.surface} 0%, #e8ebe4 50%, ${dialTokens.color.brand.accent}22 100%)`,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
            margin: 0,
            color: dialTokens.color.brand.primary,
          }}
        >
          Dial a Tech
        </p>
        <p style={{ opacity: 0.75, fontSize: 14 }}>
          Book services · emergency bypasses AI pricing · quotes are drafts only
        </p>
        <nav style={{ display: "flex", gap: dialTokens.space.md, flexWrap: "wrap", marginTop: dialTokens.space.sm }}>
          <Link href="/home">Home</Link>
          <Link href="/tech/book">Book</Link>
          <Link href="/tech/guide">Guide</Link>
          <Link href="/tech/emergency">Emergency</Link>
          <Link href="/tech/jobs">My jobs</Link>
        </nav>
        <p style={{ fontSize: 13, opacity: 0.7, marginTop: dialTokens.space.sm }}>
          Calm professional guide (Pack §9.3 FixItNow patterns). Not AI-hype. Quotes are rate_card
          drafts — AI never writes payable amounts.
        </p>
        <section style={{ marginTop: dialTokens.space.xl }}>
          <h2 style={{ fontSize: "1.1rem" }}>Diagnose</h2>
          <p style={{ fontSize: 14, opacity: 0.75, marginTop: 0 }}>
            Run a guided checklist, then book a Cal.com slot when you know the need.
          </p>
        </section>
        <section style={{ marginTop: dialTokens.space.lg }}>
          <h2 style={{ fontSize: "1.1rem" }}>Checklists</h2>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              display: "grid",
              gap: dialTokens.space.md,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {lists.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/tech/checklist/${c.id}`}
                  style={{
                    display: "block",
                    padding: dialTokens.space.md,
                    background: "#fff",
                    borderRadius: 12,
                    textDecoration: "none",
                    color: dialTokens.color.brand.ink,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  <strong>{c.title}</strong>
                  <div style={{ fontSize: 13, opacity: 0.65 }}>{c.steps.length} steps</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
