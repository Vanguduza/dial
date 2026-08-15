"use client";

import { useEffect, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type ProfileCard = {
  technicianId: string;
  displayName: string;
  tradeName: string;
  availability: string;
  eligible: boolean;
  managersChoice: boolean;
  valueScore: number | null;
};

/** PD106 — Pack §9.3 technician profile cards with Manager's choice. */
export function TechProfileCards() {
  const [cards, setCards] = useState<ProfileCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/tech/services?view=profiles");
      const json = (await res.json()) as {
        error?: string;
        profiles?: ProfileCard[];
      };
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      setCards(json.profiles ?? []);
    })();
  }, []);

  if (error) return <p style={{ color: "#a11", fontSize: 14 }}>{error}</p>;
  if (cards.length === 0) {
    return <p style={{ fontSize: 14, opacity: 0.7 }}>Loading technicians…</p>;
  }

  return (
    <section style={{ marginTop: dialTokens.space.lg }}>
      <h2 style={{ fontSize: "1.1rem", marginBottom: dialTokens.space.sm }}>
        Technicians
      </h2>
      <p style={{ fontSize: 13, opacity: 0.75, marginTop: 0 }}>
        Profile cards — Manager&apos;s choice flagged. Value Score is not a payable amount.
      </p>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          display: "grid",
          gap: dialTokens.space.md,
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        }}
      >
        {cards.map((c) => (
          <li
            key={c.technicianId}
            data-testid="tech-profile-card"
            style={{
              padding: dialTokens.space.md,
              border: `1px solid ${dialTokens.color.brand.primary}33`,
              borderRadius: 8,
              background: c.managersChoice
                ? `${dialTokens.color.brand.accent}18`
                : "#fff",
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>{c.displayName}</p>
            <p style={{ margin: "4px 0", fontSize: 13 }}>
              {c.tradeName} · {c.availability}
            </p>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>
              {c.managersChoice ? "Manager's choice · " : ""}
              {c.eligible ? "Eligible" : "Not eligible"}
              {c.valueScore != null ? ` · score ${c.valueScore}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
