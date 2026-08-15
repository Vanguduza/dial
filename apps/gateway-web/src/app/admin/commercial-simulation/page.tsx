"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type SimRun = {
  runId: string;
  title: string;
  mode: string;
  status: string;
  projectedMarginMinor: string;
  watermark: string;
  autoPayAllowed: boolean;
};

/**
 * PD23 Commercial Simulation — Pack §9.5 / D-53 / D-54.
 * Actual vs Simulated; Simulated never auto-pays; not money SoR.
 */
export default function CommercialSimulationPage() {
  const [secret, setSecret] = useState("");
  const [title, setTitle] = useState("PD23 margin scenario");
  const [mode, setMode] = useState<"actual" | "simulated">("simulated");
  const [runs, setRuns] = useState<SimRun[]>([]);
  const [blocked, setBlocked] = useState(0);
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
      const res = await fetch("/api/admin/commercial-simulation", {
        headers: headers(),
      });
      const data = (await res.json()) as {
        error?: string;
        runs?: SimRun[];
        simulatedPayoutAttemptsBlocked?: number;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setRuns(data.runs ?? []);
      setBlocked(data.simulatedPayoutAttemptsBlocked ?? 0);
    } finally {
      setBusy(false);
    }
  }

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/commercial-simulation", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        snapshot?: {
          runs: SimRun[];
          simulatedPayoutAttemptsBlocked: number;
        };
        payout?: { refused: boolean; reason: string };
      };
      if (data.snapshot) {
        setRuns(data.snapshot.runs);
        setBlocked(data.snapshot.simulatedPayoutAttemptsBlocked);
      }
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(
        data.payout?.refused
          ? `Refused: ${data.payout.reason}`
          : data.error ?? "OK",
      );
      if (!data.snapshot) await refresh();
    } finally {
      setBusy(false);
    }
  }

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
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
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
        <h1 style={{ fontSize: "1.35rem", fontWeight: 600 }}>
          Commercial Simulation
        </h1>
        <p style={{ fontSize: 14, opacity: 0.85 }}>
          PD23 · D-54 — Actual vs Simulated watermark. Simulated never auto-pays.
          Not money SoR.{" "}
          <Link href="/admin/compliance/wht">WHT remittance</Link>
          {" · "}
          <Link href="/admin/command-centre">Command Centre</Link>
        </p>

        <label style={{ display: "grid", gap: 6, marginTop: 16, fontSize: 14 }}>
          Internal API secret
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{ padding: 12, borderRadius: 8 }}
          />
        </label>
        <label style={{ display: "grid", gap: 6, marginTop: 8, fontSize: 14 }}>
          Scenario title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: 10, borderRadius: 8 }}
          />
        </label>
        <label style={{ display: "grid", gap: 6, marginTop: 8, fontSize: 14 }}>
          Mode
          <select
            value={mode}
            onChange={(e) =>
              setMode(e.target.value === "actual" ? "actual" : "simulated")
            }
            style={{ padding: 10, borderRadius: 8 }}
          >
            <option value="simulated">Simulated</option>
            <option value="actual">Actual</option>
          </select>
        </label>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <button type="button" disabled={busy} onClick={() => void refresh()}>
            Refresh
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void post({
                action: "create_run",
                title,
                mode,
                projectedMarginMinor: "5000",
              })
            }
          >
            Create run
          </button>
        </div>

        <p style={{ fontSize: 13, marginTop: 12 }}>
          Simulated payout attempts blocked: {blocked}
        </p>
        {message ? <p role="status">{message}</p> : null}

        <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
          {runs.map((r) => (
            <li
              key={r.runId}
              style={{
                padding: 14,
                marginBottom: 10,
                borderRadius: 10,
                background: "#fff",
                border:
                  r.mode === "simulated"
                    ? `2px solid ${dialTokens.color.brand.accent}`
                    : "1px solid #cbd5e1",
              }}
            >
              <strong>{r.title}</strong>
              <div style={{ fontSize: 13 }}>
                {r.runId} · {r.mode} · {r.status} · margin {r.projectedMarginMinor}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{r.watermark}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void post({
                      action: "set_mode",
                      runId: r.runId,
                      mode: r.mode === "simulated" ? "actual" : "simulated",
                    })
                  }
                >
                  Toggle Actual/Simulated
                </button>
                <button
                  type="button"
                  disabled={busy || r.status !== "draft"}
                  onClick={() => void post({ action: "start", runId: r.runId })}
                >
                  Start
                </button>
                <button
                  type="button"
                  disabled={busy || r.status !== "running"}
                  onClick={() =>
                    void post({ action: "complete", runId: r.runId })
                  }
                >
                  Complete
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void post({
                      action: "attempt_payout",
                      runId: r.runId,
                      amountMinor: "1000",
                    })
                  }
                >
                  Attempt payout (must refuse)
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
