"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Balance = {
  technicianId: string;
  yearOfAssessment: number;
  grossPaidMinor: string;
  withheldMinor: string;
  hasItf263: boolean;
};

type Remittance = {
  batchId: string;
  status: string;
  totalWithheldMinor: string;
  payableFromAi: boolean;
  submittedBy: string | null;
};

/**
 * PD23 Compliance / WHT remittance centre — Pack §9.5 / D-50.
 * 30% without ITF263; remittance draft→submit→ack; AI never writes payable.
 */
export default function ComplianceWhtPage() {
  const [secret, setSecret] = useState("");
  const [technicianId, setTechnicianId] = useState("tech_pd23");
  const [payoutUsdMinor, setPayoutUsdMinor] = useState("10000");
  const [hasItf263, setHasItf263] = useState(false);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [remittances, setRemittances] = useState<Remittance[]>([]);
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
      const res = await fetch("/api/admin/compliance/wht", { headers: headers() });
      const data = (await res.json()) as {
        error?: string;
        balances?: Balance[];
        remittances?: Remittance[];
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setBalances(data.balances ?? []);
      setRemittances(data.remittances ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/compliance/wht", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        withholdMinor?: string;
        rateBps?: number;
        snapshot?: { balances: Balance[]; remittances: Remittance[] };
        batch?: Remittance;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      if (data.snapshot) {
        setBalances(data.snapshot.balances);
        setRemittances(data.snapshot.remittances);
      }
      setMessage(
        data.withholdMinor != null
          ? `WHT ${data.withholdMinor} @ ${data.rateBps} bps`
          : data.batch
            ? `Batch ${data.batch.batchId} · ${data.batch.status}`
            : "OK",
      );
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
          Compliance / WHT remittance
        </h1>
        <p style={{ fontSize: 14, opacity: 0.85 }}>
          PD23 · D-50 — without ITF263, 30% withhold into{" "}
          <code>withholding_balances</code>. Remittance is human-submitted.
          AI never writes payable amounts.{" "}
          <Link href="/admin/commercial-simulation">Commercial Simulation</Link>
          {" · "}
          <Link href="/admin/tech/take-home">Take-Home</Link>
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <button type="button" disabled={busy} onClick={() => void refresh()}>
            Refresh
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void post({
                action: "record_payout",
                technicianId,
                payoutUsdMinor,
                hasItf263,
              })
            }
          >
            Record payout (WHT)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void post({ action: "create_remittance_draft" })}
          >
            Create remittance draft
          </button>
        </div>

        <label style={{ display: "grid", gap: 6, marginTop: 12, fontSize: 14 }}>
          Technician ID
          <input
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            style={{ padding: 10, borderRadius: 8 }}
          />
        </label>
        <label style={{ display: "grid", gap: 6, marginTop: 8, fontSize: 14 }}>
          Payout USD minor
          <input
            value={payoutUsdMinor}
            onChange={(e) => setPayoutUsdMinor(e.target.value)}
            style={{ padding: 10, borderRadius: 8 }}
          />
        </label>
        <label style={{ display: "flex", gap: 8, marginTop: 8, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={hasItf263}
            onChange={(e) => setHasItf263(e.target.checked)}
          />
          Has ITF263 clearance (0% withhold)
        </label>

        {message ? <p role="status">{message}</p> : null}

        <h2 style={{ fontSize: "1.1rem", marginTop: 24 }}>Balances</h2>
        <ul style={{ fontSize: 13, lineHeight: 1.6 }}>
          {balances.length === 0 ? <li>None</li> : null}
          {balances.map((b) => (
            <li key={`${b.technicianId}-${b.yearOfAssessment}`}>
              {b.technicianId} · withheld {b.withheldMinor} · ITF263=
              {String(b.hasItf263)}
            </li>
          ))}
        </ul>

        <h2 style={{ fontSize: "1.1rem", marginTop: 24 }}>Remittances</h2>
        <ul style={{ fontSize: 13, lineHeight: 1.6 }}>
          {remittances.length === 0 ? <li>None</li> : null}
          {remittances.map((r) => (
            <li key={r.batchId}>
              {r.batchId} · {r.status} · total {r.totalWithheldMinor} · AI payable=
              {String(r.payableFromAi)}
              {r.status === "draft" ? (
                <button
                  type="button"
                  style={{ marginLeft: 8 }}
                  disabled={busy}
                  onClick={() =>
                    void post({
                      action: "submit_remittance",
                      batchId: r.batchId,
                      submittedBy: "ops_pd23",
                    })
                  }
                >
                  Submit
                </button>
              ) : null}
              {r.status === "submitted" ? (
                <button
                  type="button"
                  style={{ marginLeft: 8 }}
                  disabled={busy}
                  onClick={() =>
                    void post({
                      action: "acknowledge_remittance",
                      batchId: r.batchId,
                    })
                  }
                >
                  Acknowledge
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
