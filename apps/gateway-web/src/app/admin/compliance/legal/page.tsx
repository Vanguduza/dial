"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Education = { id: string; title: string; summary: string };
type Terms = { versionId: string; audience: string; title: string };
type Checklist = {
  entityType: string;
  entityId: string;
  items: Array<{ id: string; label: string; status: string }>;
};

/**
 * PD24 Legal compliance hub — Pack §9.5 / §3.8.
 * Education, entity checklists, versioned T&Cs — not a money path.
 */
export default function LegalComplianceHubPage() {
  const [secret, setSecret] = useState("");
  const [education, setEducation] = useState<Education[]>([]);
  const [terms, setTerms] = useState<Terms[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const headers = useCallback(
    () => ({
      "content-type": "application/json",
      "x-internal-secret": secret,
    }),
    [secret],
  );

  async function refresh() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/compliance/legal", {
        headers: headers(),
      });
      const data = (await res.json()) as {
        error?: string;
        education?: Education[];
        terms?: Terms[];
        checklists?: Checklist[];
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setEducation(data.education ?? []);
      setTerms(data.terms ?? []);
      setChecklists(data.checklists ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/compliance/legal", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        snapshot?: {
          education: Education[];
          terms: Terms[];
          checklists: Checklist[];
        };
        terms?: Terms;
        acceptance?: { acceptanceId: string };
      };
      if (data.snapshot) {
        setEducation(data.snapshot.education);
        setTerms(data.snapshot.terms);
        setChecklists(data.snapshot.checklists);
      }
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(
        data.acceptance
          ? `Accepted ${data.acceptance.acceptanceId}`
          : data.terms
            ? `Published ${data.terms.versionId}`
            : "OK — payableFromAi=false",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        fontFamily: dialTokens.font.body,
        maxWidth: 720,
        margin: "0 auto",
        padding: "1.5rem 1rem 3rem",
        color: dialTokens.color.brand.ink,
      }}
    >
      <p style={{ margin: 0 }}>
        <Link href="/admin/projects">Projects toggle</Link>
        {" · "}
        <Link href="/admin/compliance/wht">WHT remittance</Link>
      </p>
      <h1 style={{ fontSize: "1.5rem", marginTop: "0.75rem" }}>
        Legal compliance hub
      </h1>
      <p style={{ color: dialTokens.color.brand.accent, lineHeight: 1.45 }}>
        Education, entity checklists, and versioned T&amp;Cs (§3.8). Acceptance
        is logged; this hub never writes ledger or payable amounts.
      </p>

      <label style={{ display: "block", marginTop: "1rem" }}>
        INTERNAL_API_SECRET
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          style={{ display: "block", width: "100%", marginTop: 4 }}
        />
      </label>
      <button type="button" disabled={busy} onClick={() => void refresh()}>
        Refresh
      </button>

      <section style={{ marginTop: "1.25rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Education</h2>
        <ul>
          {education.map((e) => (
            <li key={e.id}>
              <strong>{e.title}</strong> — {e.summary}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Entity checklists</h2>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void post({
              action: "seed_checklist",
              entityType: "technician",
              entityId: "tech_legal_ui",
            })
          }
        >
          Seed technician checklist
        </button>
        <ul>
          {checklists.map((c) => (
            <li key={`${c.entityType}:${c.entityId}`}>
              {c.entityType}/{c.entityId}:{" "}
              {c.items.map((i) => i.label).join("; ")}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Terms &amp; Conditions</h2>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void post({
              action: "publish_terms",
              audience: "customer",
              title: "Customer T&C",
              bodyRef: "fixture://tc/customer/ui",
            })
          }
        >
          Publish customer T&amp;C
        </button>
        <ul>
          {terms.map((t) => (
            <li key={t.versionId}>
              {t.versionId} · {t.audience} · {t.title}{" "}
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void post({
                    action: "accept_terms",
                    versionId: t.versionId,
                    partyId: "party_ui",
                    channel: "admin",
                  })
                }
              >
                Log acceptance
              </button>
            </li>
          ))}
        </ul>
      </section>

      {message && (
        <p role="status" style={{ marginTop: "1rem" }}>
          {message}
        </p>
      )}
    </main>
  );
}
