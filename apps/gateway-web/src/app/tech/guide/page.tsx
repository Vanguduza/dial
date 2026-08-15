"use client";

import Link from "next/link";
import { useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Checklist = {
  id: string;
  title: string;
  catalogId?: string;
  steps: string[];
};

/**
 * PD137 — Calm tech guide + symptom → checklist (Pack §9.3 FixItNow patterns).
 * Never AI-priced — resolve maps keywords only.
 */
export default function TechGuidePage() {
  const [symptom, setSymptom] = useState("");
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function diagnose() {
    setBusy(true);
    setMessage(null);
    setChecklist(null);
    try {
      const res = await fetch("/api/tech/technician", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "resolve_checklist_by_symptom",
          symptom,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        checklist?: Checklist;
        payableFromAi?: boolean;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setChecklist(data.checklist ?? null);
      setMessage(
        data.payableFromAi === false
          ? "Keyword diagnose only — quotes stay rate_card drafts"
          : null,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="pd137-tech-guide"
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${dialTokens.color.brand.surface} 0%, #e8ebe4 55%, ${dialTokens.color.brand.accent}22 100%)`,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <p>
          <Link href="/tech">Tech home</Link>
          {" · "}
          <Link href="/tech/book">Book</Link>
        </p>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
          }}
        >
          Calm diagnose guide
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          PD137 — describe the symptom; we map a checklist. AI never writes
          payable amounts.
        </p>
        <label style={{ display: "grid", gap: 6, marginTop: 16 }}>
          Symptom
          <textarea
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            rows={3}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </label>
        <button
          type="button"
          disabled={busy || !symptom.trim()}
          onClick={() => void diagnose()}
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 8,
            border: "none",
            background: dialTokens.color.brand.primary,
            color: "#fff",
            fontWeight: 600,
          }}
        >
          Resolve checklist
        </button>
        {message ? (
          <p role="status" style={{ marginTop: 12 }}>
            {message}
          </p>
        ) : null}
        {checklist ? (
          <section style={{ marginTop: 20 }} data-testid="pd137-resolved-checklist">
            <h2 style={{ fontSize: "1.1rem" }}>{checklist.title}</h2>
            {checklist.catalogId ? (
              <p style={{ fontSize: 13, opacity: 0.7 }}>{checklist.catalogId}</p>
            ) : null}
            <ol>
              {checklist.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p>
              <Link href={`/tech/checklist/${checklist.id}`}>Open runner</Link>
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
