"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Shadow = {
  shadowId: string;
  status: string;
  draft: {
    title: string;
    kind: string;
    payableFromAi: boolean;
    flashLiteSafetyOrgan: string;
  };
  promptfooPassed: boolean | null;
  humanApproved: boolean;
  promotedDatasetVersionId: string | null;
};

type Snapshot = {
  shadows: Shadow[];
  datasets: Array<{ versionId: string; outcomeWeighted: boolean; fromShadowId?: string }>;
  autoPublishAttemptsBlocked: number;
  simulatedPayoutAttemptsBlocked: number;
};

/**
 * PD17 Intelligence Factory — shadow → Promptfoo → human promote (D-54).
 * No auto-publish. Drafts never payable. Simulated never auto-pays. Flash-Lite P1.
 */
export default function AdminIntelligenceFactoryPage() {
  const [secret, setSecret] = useState("");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("Roadside battery checklist draft");
  const [draftBody, setDraftBody] = useState(
    "1) Confirm safety\n2) Test voltage\n3) Route to human quote",
  );

  const headers = useCallback(
    () => ({
      "content-type": "application/json",
      "x-internal-secret": secret,
    }),
    [secret],
  );

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/intelligence", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        snapshot?: Snapshot;
        blocked?: boolean;
        shadowId?: string;
        datasetVersionId?: string;
      };
      if (data.snapshot) setSnapshot(data.snapshot);
      if (data.blocked) {
        setMessage(`Blocked (D-54): ${data.error}`);
        return data;
      }
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return data;
      }
      setMessage(
        data.datasetVersionId
          ? `Promoted → ${data.datasetVersionId}`
          : data.shadowId
            ? `Shadow ${data.shadowId}`
            : "OK",
      );
      return data;
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/intelligence", { headers: headers() });
      const data = (await res.json()) as { error?: string; snapshot?: Snapshot };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setSnapshot(data.snapshot ?? null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <p style={{ margin: 0 }}>
          <Link href="/admin">Admin</Link> · Intelligence Factory
        </p>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            fontSize: "1.75rem",
            marginTop: dialTokens.space.sm,
          }}
        >
          Intelligence Factory
        </h1>
        <p style={{ opacity: 0.85, maxWidth: 640 }}>
          Shadow draft → Promptfoo eval → human approve → promote to
          outcome-weighted dataset. No auto-publish. AI never writes payable
          amounts. Flash-Lite safety organ stays P1. Simulated never auto-pays
          (D-54).
        </p>

        <label style={{ display: "block", marginTop: dialTokens.space.md }}>
          Internal API secret
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            autoComplete="off"
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>

        <label style={{ display: "block", marginTop: dialTokens.space.md }}>
          Draft title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginTop: dialTokens.space.sm }}>
          Draft body (checklist — no prices)
          <textarea
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            rows={4}
            style={{
              display: "block",
              width: "100%",
              marginTop: 4,
              padding: 8,
              fontFamily: "ui-monospace, monospace",
              fontSize: 13,
            }}
          />
        </label>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: dialTokens.space.sm,
            marginTop: dialTokens.space.md,
          }}
        >
          <button type="button" disabled={busy} onClick={() => void refresh()}>
            Refresh
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void post({
                action: "create_shadow",
                title,
                draftBody,
                kind: "checklist",
              })
            }
          >
            Create shadow
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void post({ action: "attempt_auto_publish", shadowId: "x" })
            }
          >
            Attempt auto-publish (must block)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void post({ action: "attempt_simulated_payout" })}
          >
            Attempt Simulated payout (must block)
          </button>
        </div>

        {message ? (
          <p role="status" style={{ marginTop: dialTokens.space.md }}>
            {message}
          </p>
        ) : null}

        {snapshot ? (
          <>
            <p style={{ marginTop: dialTokens.space.md, fontSize: 14 }}>
              Auto-publish blocked: {snapshot.autoPublishAttemptsBlocked} ·
              Simulated payouts blocked:{" "}
              {snapshot.simulatedPayoutAttemptsBlocked}
            </p>
            <section style={{ marginTop: dialTokens.space.lg }}>
              <h2 style={{ fontSize: "1.1rem" }}>Shadow queue</h2>
              {snapshot.shadows.length === 0 ? (
                <p style={{ opacity: 0.7 }}>Empty</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {snapshot.shadows.map((s) => (
                    <li
                      key={s.shadowId}
                      style={{
                        borderTop: `1px solid ${dialTokens.color.brand.ink}22`,
                        padding: `${dialTokens.space.sm} 0`,
                      }}
                    >
                      <strong>{s.draft.title}</strong> · {s.status} ·{" "}
                      {s.draft.kind} · payableFromAi=
                      {String(s.draft.payableFromAi)} · Flash-Lite{" "}
                      {s.draft.flashLiteSafetyOrgan}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                          marginTop: 8,
                        }}
                      >
                        {s.promptfooPassed !== true && s.status !== "promoted" ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void post({
                                action: "promptfoo",
                                shadowId: s.shadowId,
                                promptfooPassed: true,
                                reportId: "pf_ops_ui",
                              })
                            }
                          >
                            Mark Promptfoo pass
                          </button>
                        ) : null}
                        {s.promptfooPassed === true && !s.humanApproved ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void post({
                                action: "human_approve",
                                shadowId: s.shadowId,
                                approver: "ops_ui",
                              })
                            }
                          >
                            Human approve
                          </button>
                        ) : null}
                        {s.promptfooPassed === true &&
                        s.humanApproved &&
                        s.status !== "promoted" ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void post({
                                action: "promote",
                                shadowId: s.shadowId,
                              })
                            }
                          >
                            Promote
                          </button>
                        ) : null}
                        {s.status !== "promoted" && s.status !== "rejected" ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void post({
                                action: "reject",
                                shadowId: s.shadowId,
                                reason: "ops_reject",
                              })
                            }
                          >
                            Reject
                          </button>
                        ) : null}
                      </div>
                      {s.promotedDatasetVersionId ? (
                        <p style={{ fontSize: 13, opacity: 0.8 }}>
                          Dataset {s.promotedDatasetVersionId}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section style={{ marginTop: dialTokens.space.md }}>
              <h2 style={{ fontSize: "1.1rem" }}>Promoted datasets</h2>
              <ul>
                {snapshot.datasets.map((d) => (
                  <li key={d.versionId}>
                    {d.versionId} · outcomeWeighted=
                    {String(d.outcomeWeighted)}
                    {d.fromShadowId ? ` · from ${d.fromShadowId}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
