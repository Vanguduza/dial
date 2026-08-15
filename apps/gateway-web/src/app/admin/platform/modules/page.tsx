/**
 * PD60 — Domain module registry (D-53). Certification SoR ≠ Unleash.
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type ModuleRow = {
  moduleId: string;
  label: string;
  certification: string;
  publicMvpLadder: false;
  updatedBy: string;
  updatedAt: string;
};

export default function AdminDomainModulesPage() {
  const [secret, setSecret] = useState("");
  const [modules, setModules] = useState<ModuleRow[]>([]);
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
      const res = await fetch("/api/admin/platform/modules", { headers: headers() });
      const data = (await res.json()) as {
        error?: string;
        modules?: ModuleRow[];
        unleashIsSor?: boolean;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setModules(data.modules ?? []);
      setMessage(
        data.unleashIsSor === false
          ? "Registry SoR (not Unleash) · CERTIFIED–DORMANT ≠ public MVP ladder"
          : null,
      );
    } finally {
      setBusy(false);
    }
  }

  async function certify(moduleId: string, certification: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/platform/modules", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          moduleId,
          certification,
          updatedBy: "ops_platform",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-domain-modules"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/admin/four-eyes">Four-eyes queue</Link>
        {" · "}
        <Link href="/admin/command-centre">Command Centre</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Domain modules
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          PD60 certification registry (D-53). Not Unleash. Draft / certified / dormant /
          retired — not a public multi-phase MVP ladder.
        </p>
        <label style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 16 }}>
          Internal API secret
          <input
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc", maxWidth: 360 }}
          />
        </label>
        <button
          type="button"
          disabled={busy || !secret}
          onClick={() => void refresh()}
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
          Refresh registry
        </button>
        {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
        <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
          {modules.map((m) => (
            <li
              key={m.moduleId}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                display: "grid",
                gap: 8,
              }}
            >
              <strong>{m.label}</strong>
              <span style={{ fontSize: 13, opacity: 0.75 }}>
                {m.moduleId} · {m.certification} · by {m.updatedBy}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(["draft", "certified", "dormant", "retired"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={busy || !secret || m.certification === c}
                    onClick={() => void certify(m.moduleId, c)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid #ccc",
                      background: m.certification === c ? "#eee" : "#fff",
                      fontSize: 13,
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
