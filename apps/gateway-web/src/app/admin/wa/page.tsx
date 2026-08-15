/**
 * Admin WA Flows sandbox ops (PD12) — Virtual Cloud API Flows, no Baileys, no liquor.
 */
"use client";

import { useCallback, useState } from "react";

type FlowsStatus = {
  mode?: string;
  health?: { ok?: boolean; mode?: string };
  flows?: Array<{ key: string; flowId: string; status: string; vertical: string }>;
  templates?: Array<{ key: string; templateName: string; status: string }>;
  sandboxOutbound?: Array<{ kind: string; messageId: string }>;
  liquorFlows?: boolean;
  error?: string;
};

export default function AdminWaFlowsPage() {
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState<FlowsStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      "x-internal-secret": secret,
    }),
    [secret],
  );

  async function refresh() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/wa/flows", { headers: headers() });
      const data = (await res.json()) as FlowsStatus;
      if (!res.ok) {
        setStatus({ error: data.error ?? `HTTP ${res.status}` });
      } else {
        setStatus(data);
      }
    } finally {
      setBusy(false);
    }
  }

  async function runThinVertical() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/wa/flows", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action: "thin_vertical" }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; result?: unknown };
      if (!res.ok) {
        setMsg(data.error ?? `HTTP ${res.status}`);
      } else {
        setMsg("Thin vertical OK — Spare EcoCash + grocery COD via sandbox Cloud API");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: "1.5rem", maxWidth: 720, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: "1.35rem", marginBottom: "0.35rem" }}>
        WA Flows sandbox
      </h1>
      <p style={{ color: "#444", marginTop: 0 }}>
        Official Meta Cloud API only (D-40). FLOW_SPARE_* + FLOW_GROCERY_* food.
        EcoCash | COD buttons same payment intents as web (D-57). No liquor Flows.
        No Baileys.
      </p>
      <label style={{ display: "block", marginBottom: "0.75rem" }}>
        Internal secret
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          style={{ display: "block", width: "100%", marginTop: 4 }}
          autoComplete="off"
        />
      </label>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" disabled={busy} onClick={() => void refresh()}>
          Refresh status
        </button>
        <button type="button" disabled={busy} onClick={() => void runThinVertical()}>
          Run PD12 thin vertical
        </button>
        <a href="/admin/money/outbox">Money outbox</a>
        <a href="/admin/fdms">FDMS</a>
      </div>
      {msg ? <p role="status">{msg}</p> : null}
      {status?.error ? (
        <p role="alert" style={{ color: "#a00" }}>
          {status.error}
        </p>
      ) : null}
      {status && !status.error ? (
        <section style={{ marginTop: "1.25rem" }}>
          <p>
            Mode: <strong>{status.mode}</strong> · health ok:{" "}
            {String(status.health?.ok)} · liquor Flows:{" "}
            {String(status.liquorFlows)}
          </p>
          <h2 style={{ fontSize: "1.05rem" }}>Registered Flows</h2>
          <ul>
            {(status.flows ?? []).map((f) => (
              <li key={f.key}>
                {f.key} → {f.flowId} ({f.status}, {f.vertical})
              </li>
            ))}
          </ul>
          <h2 style={{ fontSize: "1.05rem" }}>Templates</h2>
          <ul>
            {(status.templates ?? []).map((t) => (
              <li key={t.key}>
                {t.key} → {t.templateName} ({t.status})
              </li>
            ))}
          </ul>
          <h2 style={{ fontSize: "1.05rem" }}>Sandbox outbound</h2>
          <ul>
            {(status.sandboxOutbound ?? []).length === 0 ? (
              <li>None yet</li>
            ) : (
              (status.sandboxOutbound ?? []).map((m) => (
                <li key={m.messageId}>
                  {m.kind} · {m.messageId}
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
