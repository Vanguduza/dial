"use client";

import { useEffect, useState } from "react";

type ProfileCard = {
  technicianId: string;
  displayName: string;
  tradeName: string;
  availability: string;
  eligible: boolean;
  managersChoice: boolean;
  valueScore: number | null;
  oemSpecialties?: string[];
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

  if (error) return <p className="fin-msg fin-msg--err">{error}</p>;
  if (cards.length === 0) {
    return <p className="fin-page__meta">Loading technicians…</p>;
  }

  return (
    <section style={{ marginTop: "1.25rem" }}>
      <h2 style={{ fontSize: "1.15rem", marginBottom: "0.75rem" }}>
        Technicians
      </h2>
      <ul className="fin-cards">
        {cards.map((c) => (
          <li key={c.technicianId}>
            <div
              className="fin-card"
              data-testid="tech-profile-card"
              style={
                c.managersChoice
                  ? { borderColor: "var(--fin-primary)", background: "var(--fin-primary-soft)" }
                  : undefined
              }
            >
              <strong>{c.displayName}</strong>
              <span>
                {c.tradeName} · {c.availability}
              </span>
              <span>
                {c.managersChoice ? "Manager's choice · " : ""}
                {c.eligible ? "Eligible" : "Not eligible"}
                {c.valueScore != null ? ` · score ${c.valueScore}` : ""}
              </span>
              {(c.oemSpecialties ?? []).length > 0 ? (
                <span data-testid="tech-oem-specialty">
                  Specialist: {c.oemSpecialties!.join(", ")}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
