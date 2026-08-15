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

type Breakdown = {
  grossUsdMinor: string;
  dialFeeUsdMinor: string;
  taxableShareUsdMinor: string;
  withholdMinor: string;
  netPayoutMinor: string;
  rateBps: number;
  hasItf263: boolean;
  itf263Status: string;
  certificatePdfRef: string | null;
  payableFromAi: false;
};

/**
 * PD10 / PD52 Technician Take-Home — ITF263 upload/verify + breakdown (D-50).
 * Draft economics only; AI never writes payable amounts.
 */
export default function TechTakeHomePage() {
  const [secret, setSecret] = useState("");
  const [technicianId, setTechnicianId] = useState("tech_pd52");
  const [grossUsdMinor, setGrossUsdMinor] = useState("12000");
  const [dialFeeUsdMinor, setDialFeeUsdMinor] = useState("2000");
  const [balances, setBalances] = useState<Balance[]>([]);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const headers = useCallback(
    () => ({
      "content-type": "application/json",
      "x-internal-secret": secret,
    }),
    [secret],
  );

  async function refreshAll() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/tech/take-home?view=all", {
        headers: headers(),
      });
      const data = (await res.json()) as { error?: string; balances?: Balance[] };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setBalances(data.balances ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/tech/take-home", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ technicianId, ...body }),
      });
      const data = (await res.json()) as {
        error?: string;
        breakdown?: Breakdown;
        itf263?: { status?: string };
        netPayoutMinor?: string;
        withholdMinor?: string;
        rateBps?: number;
        certificate?: {
          certificatePdfRef?: string;
          withholdingYtdMinor?: string;
          stubPdfBase64?: string;
        };
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      if (data.breakdown) setBreakdown(data.breakdown);
      if (data.certificate?.stubPdfBase64) {
        const bin = atob(data.certificate.stubPdfBase64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `wht-cert-${technicianId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
      setMessage(
        data.certificate
          ? `PD76 cert ${data.certificate.certificatePdfRef} · YTD ${data.certificate.withholdingYtdMinor}`
          : data.breakdown
            ? `net ${data.breakdown.netPayoutMinor} · WHT ${data.breakdown.withholdMinor} (${data.breakdown.rateBps} bps) · ITF=${data.breakdown.itf263Status}`
            : data.itf263
              ? `ITF263 → ${data.itf263.status}`
              : `net ${data.netPayoutMinor} · WHT ${data.withholdMinor}`,
      );
      await refreshAll();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="admin-tech-take-home"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/admin/command-centre">Command Centre</Link>
        {" · "}
        <Link href="/admin/compliance/wht">WHT remittance</Link>
        {" · "}
        <Link href="/admin/disputes">Disputes</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Technician Take-Home
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          PD52 — gross → DIAL fee → ITF263|30% WHT → net. Upload/verify ITF263;
          certificate PDF stub only. Draft — human + pricing engine write payables.
        </p>
        <label style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 16 }}>
          Internal API secret
          <input
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 12 }}>
          Technician id
          <input
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 12 }}>
          Gross USD minor
          <input
            value={grossUsdMinor}
            onChange={(e) => setGrossUsdMinor(e.target.value)}
            inputMode="numeric"
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 12 }}>
          DIAL fee USD minor
          <input
            value={dialFeeUsdMinor}
            onChange={(e) => setDialFeeUsdMinor(e.target.value)}
            inputMode="numeric"
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() =>
              void post({
                action: "breakdown",
                grossUsdMinor,
                dialFeeUsdMinor,
              })
            }
          >
            Compute Take-Home
          </button>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() => void post({ action: "upload_itf263" })}
          >
            Upload ITF263
          </button>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() =>
              void post({ action: "verify_itf263", status: "verified" })
            }
          >
            Verify ITF263
          </button>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() => void post({ action: "download_certificate" })}
          >
            Download WHT cert (PD76)
          </button>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() => void refreshAll()}
          >
            List balances
          </button>
        </div>
        {breakdown ? (
          <section style={{ marginTop: 16, fontSize: 14 }}>
            <h2 style={{ fontSize: 16 }}>Breakdown</h2>
            <p>
              taxable {breakdown.taxableShareUsdMinor} · withhold{" "}
              {breakdown.withholdMinor} · net {breakdown.netPayoutMinor} ·{" "}
              {breakdown.rateBps} bps · ITF {breakdown.itf263Status}
            </p>
            {breakdown.certificatePdfRef ? (
              <p style={{ opacity: 0.75 }}>
                Cert stub: {breakdown.certificatePdfRef}
              </p>
            ) : null}
          </section>
        ) : null}
        {message ? <p role="status">{message}</p> : null}
        <h2 style={{ fontSize: "1.1rem", marginTop: 24 }}>Durable balances</h2>
        <ul style={{ fontSize: 13, lineHeight: 1.6 }}>
          {balances.map((b) => (
            <li key={`${b.technicianId}-${b.yearOfAssessment}`}>
              <code>{b.technicianId}</code> · Y{b.yearOfAssessment} · gross{" "}
              {b.grossPaidMinor} · withheld {b.withheldMinor} · ITF263=
              {String(b.hasItf263)}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
