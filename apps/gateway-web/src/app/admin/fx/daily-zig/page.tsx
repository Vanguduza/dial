"use client";

import { dialTokens } from "@dial/design-tokens";
import { useCallback, useState, type FormEvent } from "react";

type AuditRow = {
  fxRateId: string;
  zigMinorPerUsd: string;
  effectiveAt: string;
  setBy: string;
};

/**
 * Admin Daily ZiG rate (D-57 E1b) — ops sets audited rate used at EcoCash checkout.
 * Desktop + mobile usable; shared design-tokens.
 */
export default function DailyZigAdminPage() {
  const [secret, setSecret] = useState("");
  const [zigMinorPerUsd, setZigMinorPerUsd] = useState("250000");
  const [setBy, setSetBy] = useState("ops_admin");
  const [active, setActive] = useState<AuditRow | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
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
      const res = await fetch("/api/admin/fx/daily-zig", { headers: headers() });
      const data = (await res.json()) as {
        error?: string;
        active?: AuditRow | null;
        audit?: AuditRow[];
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setActive(data.active ?? null);
      setAudit(data.audit ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/fx/daily-zig", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ zigMinorPerUsd, setBy }),
      });
      const data = (await res.json()) as { error?: string; rate?: AuditRow };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Saved ${data.rate?.fxRateId}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const fieldStyle = {
    padding: "12px 14px",
    borderRadius: 8,
    border: `1px solid ${dialTokens.color.brand.primary}33`,
    fontSize: 16,
    width: "100%",
    boxSizing: "border-box" as const,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: `linear-gradient(165deg, ${dialTokens.color.brand.surface} 0%, #e4e8df 50%, ${dialTokens.color.brand.primary}18 100%)`,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.lg,
      }}
    >
      <section style={{ maxWidth: 560, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            fontSize: "2rem",
            margin: 0,
            color: dialTokens.color.brand.primary,
          }}
        >
          DIAL
        </p>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 600, marginTop: dialTokens.space.sm }}>
          Daily ZiG rate
        </h1>
        <p style={{ opacity: 0.8, fontSize: 14, marginTop: dialTokens.space.sm }}>
          Ops-audited FX for EcoCash ZiG display at checkout (D-57). Browse stays USD.
          IMTT is DIAL opex — never a checkout line (D-60).{" "}
          <a href="/admin/cost-health">Cost / health</a>
        </p>

        <form
          onSubmit={onSubmit}
          style={{
            marginTop: dialTokens.space.xl,
            display: "grid",
            gap: dialTokens.space.md,
          }}
        >
          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            Internal API secret
            <input
              type="password"
              autoComplete="off"
              value={secret}
              onChange={(ev) => setSecret(ev.target.value)}
              required
              style={fieldStyle}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            ZiG minor per 1 USD (integer)
            <input
              inputMode="numeric"
              pattern="[0-9]+"
              value={zigMinorPerUsd}
              onChange={(ev) => setZigMinorPerUsd(ev.target.value)}
              required
              style={fieldStyle}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            Set by (audit)
            <input
              value={setBy}
              onChange={(ev) => setSetBy(ev.target.value)}
              required
              style={fieldStyle}
            />
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: dialTokens.space.sm }}>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                border: "none",
                background: dialTokens.color.brand.primary,
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save rate
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void refresh()}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                border: `1px solid ${dialTokens.color.brand.primary}55`,
                background: "transparent",
                color: dialTokens.color.brand.ink,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Refresh audit
            </button>
          </div>
        </form>

        {message ? (
          <p style={{ marginTop: dialTokens.space.md, fontSize: 14 }} role="status">
            {message}
          </p>
        ) : null}

        {active ? (
          <p style={{ marginTop: dialTokens.space.lg, fontSize: 14 }}>
            Active <code>{active.fxRateId}</code> · {active.zigMinorPerUsd} minor/USD ·{" "}
            {active.setBy} · {active.effectiveAt}
          </p>
        ) : null}

        {audit.length > 0 ? (
          <ul
            style={{
              marginTop: dialTokens.space.lg,
              paddingLeft: dialTokens.space.lg,
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {audit.map((row) => (
              <li key={row.fxRateId}>
                {row.fxRateId} — {row.zigMinorPerUsd} by {row.setBy} @ {row.effectiveAt}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
