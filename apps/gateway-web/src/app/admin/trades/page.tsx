"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Trade = { id: string; name: string; lifecycle: string };
type JobClass = { id: string; tradeId: string; name: string; lifecycle: string };
type Dispute = {
  disputeId: string;
  technicianId: string;
  status: string;
  reason: string;
};
type ValueScore = {
  technicianId: string;
  score: number;
  confidence: string;
  factorContributions: Array<{ factor: string; contribution: number }>;
};

/**
 * PD19 Admin Trade/JobClass + Value Score (D-53).
 * Lifecycle editor + disputes. Never writes payable amounts.
 */
export default function AdminTradesPage() {
  const [secret, setSecret] = useState("");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [jobClasses, setJobClasses] = useState<JobClass[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [valueScore, setValueScore] = useState<ValueScore | null>(null);
  const [techId, setTechId] = useState("tech_ops");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      const res = await fetch("/api/admin/trades", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        trades?: Trade[];
        jobClasses?: JobClass[];
        disputes?: Dispute[];
        valueScore?: ValueScore;
        trade?: Trade;
        jobClass?: JobClass;
      };
      if (data.trades) setTrades(data.trades);
      if (data.jobClasses) setJobClasses(data.jobClasses);
      if (data.disputes) setDisputes(data.disputes);
      if (data.valueScore) setValueScore(data.valueScore);
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(
        data.trade
          ? `Trade ${data.trade.id} · ${data.trade.lifecycle}`
          : data.jobClass
            ? `JobClass ${data.jobClass.id}`
            : "OK",
      );
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/trades?technicianId=${encodeURIComponent(techId)}`,
        { headers: headers() },
      );
      const data = (await res.json()) as {
        error?: string;
        trades?: Trade[];
        jobClasses?: JobClass[];
        disputes?: Dispute[];
        valueScore?: ValueScore | null;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setTrades(data.trades ?? []);
      setJobClasses(data.jobClasses ?? []);
      setDisputes(data.disputes ?? []);
      setValueScore(data.valueScore ?? null);
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
          <Link href="/admin">Admin</Link> · Trades & Value Score
        </p>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            fontSize: "1.75rem",
            marginTop: dialTokens.space.sm,
          }}
        >
          Trade / JobClass + Value Score
        </h1>
        

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
              void post({ action: "create_trade", name: "Ops HVAC" })
            }
          >
            Create trade (draft)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void post({
                action: "set_value_score",
                technicianId: techId,
                score: 70,
              })
            }
          >
            Set Value Score
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void post({
                action: "open_dispute",
                technicianId: techId,
                reason: "ops review",
                openedBy: "ops_ui",
              })
            }
          >
            Open dispute
          </button>
        </div>

        <label style={{ display: "block", marginTop: dialTokens.space.md }}>
          Technician id
          <input
            value={techId}
            onChange={(e) => setTechId(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>

        {message ? (
          <p role="status" style={{ marginTop: dialTokens.space.md }}>
            {message}
          </p>
        ) : null}

        <section style={{ marginTop: dialTokens.space.lg }}>
          <h2 style={{ fontSize: "1.1rem" }}>Trades</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {trades.map((t) => (
              <li
                key={t.id}
                style={{
                  borderTop: `1px solid ${dialTokens.color.brand.ink}22`,
                  padding: `${dialTokens.space.sm} 0`,
                }}
              >
                {t.name} · {t.id} · {t.lifecycle}
                {t.lifecycle === "draft" ? (
                  <button
                    type="button"
                    disabled={busy}
                    style={{ marginLeft: 8 }}
                    onClick={() =>
                      void post({
                        action: "set_trade_lifecycle",
                        tradeId: t.id,
                        lifecycle: "active",
                      })
                    }
                  >
                    Activate
                  </button>
                ) : null}
                {t.lifecycle === "active" ? (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      style={{ marginLeft: 8 }}
                      onClick={() =>
                        void post({
                          action: "create_job_class",
                          tradeId: t.id,
                          name: `${t.name} diagnose`,
                        })
                      }
                    >
                      Add JobClass
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      style={{ marginLeft: 8 }}
                      onClick={() =>
                        void post({
                          action: "set_trade_lifecycle",
                          tradeId: t.id,
                          lifecycle: "retired",
                        })
                      }
                    >
                      Retire
                    </button>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginTop: dialTokens.space.md }}>
          <h2 style={{ fontSize: "1.1rem" }}>JobClasses</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {jobClasses.map((j) => (
              <li
                key={j.id}
                style={{
                  borderTop: `1px solid ${dialTokens.color.brand.ink}22`,
                  padding: `${dialTokens.space.sm} 0`,
                }}
              >
                {j.name} · {j.id} · {j.lifecycle} · trade {j.tradeId}
                {j.lifecycle === "draft" ? (
                  <button
                    type="button"
                    disabled={busy}
                    style={{ marginLeft: 8 }}
                    onClick={() =>
                      void post({
                        action: "set_job_class_lifecycle",
                        jobClassId: j.id,
                        lifecycle: "active",
                      })
                    }
                  >
                    Activate
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        {valueScore ? (
          <section style={{ marginTop: dialTokens.space.md }}>
            <h2 style={{ fontSize: "1.1rem" }}>Value Score</h2>
            <p>
              {valueScore.technicianId}: {valueScore.score} (
              {valueScore.confidence})
            </p>
            <ul>
              {valueScore.factorContributions.map((f) => (
                <li key={f.factor}>
                  {f.factor}: {f.contribution}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section style={{ marginTop: dialTokens.space.md }}>
          <h2 style={{ fontSize: "1.1rem" }}>Disputes</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {disputes.map((d) => (
              <li
                key={d.disputeId}
                style={{
                  borderTop: `1px solid ${dialTokens.color.brand.ink}22`,
                  padding: `${dialTokens.space.sm} 0`,
                }}
              >
                {d.disputeId} · {d.technicianId} · {d.status} · {d.reason}
                {d.status === "open" ? (
                  <button
                    type="button"
                    disabled={busy}
                    style={{ marginLeft: 8 }}
                    onClick={() =>
                      void post({
                        action: "resolve_dispute",
                        disputeId: d.disputeId,
                        resolution: "upheld",
                        resolvedBy: "ops_ui",
                        compensatingDelta: 5,
                      })
                    }
                  >
                    Uphold +5
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
