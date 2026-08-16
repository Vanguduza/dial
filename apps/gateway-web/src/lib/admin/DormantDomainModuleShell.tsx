/**
 * Phase 7 prep — admin shells for CERTIFIED–DORMANT modules (D-53).
 * Shows registry certification only; no fake live ops while dormant.
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

export type DormantDomainModuleId = "hr_payroll" | "pricing" | "analytics";

type ModuleRow = {
  moduleId: string;
  label: string;
  certification: string;
  publicMvpLadder: false;
  updatedBy: string;
  updatedAt: string;
  payableFromAi: false;
};

type Props = {
  moduleId: DormantDomainModuleId;
  title: string;
  testId: string;
};

export function DormantDomainModuleShell({ moduleId, title, testId }: Props) {
  const [secret, setSecret] = useState("");
  const [row, setRow] = useState<ModuleRow | null>(null);
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
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        setRow(null);
        return;
      }
      const found = (data.modules ?? []).find((m) => m.moduleId === moduleId) ?? null;
      setRow(found);
      if (!found) setMessage(`module ${moduleId} missing`);
    } finally {
      setBusy(false);
    }
  }

  const dormant = row?.certification === "dormant";

  return (
    <main
      data-testid={testId}
      data-module-id={moduleId}
      data-certification={row?.certification ?? "unknown"}
      data-dormant={dormant ? "true" : "false"}
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/admin/platform/modules">Domain modules</Link>
        {" · "}
        <Link href="/admin/command-centre">Command Centre</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            marginTop: 12,
          }}
        >
          {title}
        </h1>

        <label style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 16 }}>
          Internal API secret
          <input
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              maxWidth: 360,
            }}
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
          Refresh status
        </button>

        {message ? (
          <p role="status" style={{ marginTop: 12 }}>
            {message}
          </p>
        ) : null}

        {row ? (
          <section
            data-testid={`${testId}-status`}
            style={{
              marginTop: 20,
              padding: "12px 0",
              borderTop: "1px solid rgba(0,0,0,0.08)",
              display: "grid",
              gap: 6,
              fontSize: 14,
            }}
          >
            <strong>{row.label}</strong>
            <span>
              {row.moduleId} · {row.certification}
            </span>
            <span>
              publicMvpLadder={String(row.publicMvpLadder)} · payableFromAi=
              {String(row.payableFromAi)}
            </span>
            <span style={{ opacity: 0.75 }}>
              {row.updatedBy} · {row.updatedAt}
            </span>
            {dormant ? (
              <span data-testid={`${testId}-dormant-banner`}>DORMANT</span>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
