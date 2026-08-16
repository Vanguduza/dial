/**
 * Admin WA Flows + template registry (PD12 / PD40) — official Meta Cloud API only.
 * No Baileys or other unofficial WhatsApp clients (D-40). No liquor flows.
 */
"use client";

import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type FlowsStatus = {
  mode?: string;
  health?: { ok?: boolean; mode?: string };
  flows?: Array<{ key: string; flowId: string; status: string; vertical: string }>;
  templates?: Array<{
    key: string;
    templateName: string;
    status: string;
    envKeyHint?: string;
    vertical?: string;
    payableFromAi?: boolean;
  }>;
  sandboxOutbound?: Array<{ kind: string; messageId: string }>;
  liquorFlows?: boolean;
  baileysForbidden?: boolean;
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

  async function runAction(action: "thin_vertical" | "send_sandbox_template") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/wa/flows", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action,
          ...(action === "send_sandbox_template"
            ? { templateKey: "SPARE_ORDER_CONFIRMED", toE164: "+263771234567" }
            : {}),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        result?: unknown;
      };
      if (!res.ok) {
        setMsg(data.error ?? `HTTP ${res.status}`);
      } else {
        setMsg(
          action === "thin_vertical"
            ? "Thin vertical OK — Spare EcoCash + grocery COD via sandbox Cloud API"
            : "Sandbox template send OK (no payable amounts)",
        );
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  const spareFlows = (status?.flows ?? []).filter((f) =>
    f.key.startsWith("FLOW_SPARE_"),
  );
  const groceryFlows = (status?.flows ?? []).filter((f) =>
    f.key.startsWith("FLOW_GROCERY_"),
  );

  return (
    <main
      data-testid="admin-wa-templates"
      style={{
        minHeight: "100vh",
        padding: dialTokens.space.md,
        maxWidth: 800,
        margin: "0 auto",
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        color: dialTokens.color.brand.ink,
        background: dialTokens.color.brand.surface,
      }}
    >
      <h1
        style={{
          fontFamily: `${dialTokens.font.display}, Georgia, serif`,
          fontSize: "clamp(1.35rem, 4vw, 1.85rem)",
          color: dialTokens.color.brand.primary,
          marginBottom: 4,
        }}
      >
        WA Flows + template registry
      </h1>
      
      <label style={{ display: "block", marginBottom: 12, fontSize: 14 }}>
        Internal secret
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            marginTop: 4,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
          autoComplete="off"
        />
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" disabled={busy || !secret} onClick={() => void refresh()}>
          Refresh status
        </button>
        <button
          type="button"
          disabled={busy || !secret}
          onClick={() => void runAction("thin_vertical")}
        >
          Run PD12 thin vertical
        </button>
        <button
          type="button"
          disabled={busy || !secret}
          data-testid="wa-send-sandbox-template"
          onClick={() => void runAction("send_sandbox_template")}
        >
          Send sandbox template
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
        <section style={{ marginTop: 20 }}>
          <p>
            Mode: <strong>{status.mode}</strong> · health ok:{" "}
            {String(status.health?.ok)} · liquor Flows:{" "}
            <span data-testid="wa-liquor-flows">{String(status.liquorFlows)}</span>{" "}
            · Baileys forbidden:{" "}
            <span data-testid="wa-baileys-forbidden">
              {String(status.baileysForbidden)}
            </span>
          </p>
          <p data-testid="wa-flow-badges" style={{ fontSize: 14 }}>
            <strong>FLOW_SPARE_*</strong> ×{spareFlows.length} ·{" "}
            <strong>FLOW_GROCERY_*</strong> ×{groceryFlows.length}
          </p>
          <h2 style={{ fontSize: "1.05rem" }}>Registered Flows</h2>
          <ul>
            {(status.flows ?? []).map((f) => (
              <li key={f.key}>
                {f.key} → {f.flowId} ({f.status}, {f.vertical})
              </li>
            ))}
          </ul>
          <h2 style={{ fontSize: "1.05rem" }}>Template registry</h2>
          
          <ul data-testid="wa-template-registry">
            {(status.templates ?? []).map((t) => (
              <li key={t.key}>
                <strong>{t.key}</strong> → {t.templateName} ({t.status}
                {t.vertical ? `, ${t.vertical}` : ""})
                {t.envKeyHint ? (
                  <code style={{ marginLeft: 6, fontSize: 12 }}>{t.envKeyHint}</code>
                ) : null}
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
