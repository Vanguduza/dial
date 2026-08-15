/**
 * PD70 / PD138 — Customer promo credit balance + referral share UI (Pack §9.6 / D-42).
 * Session SoR; promo_credit never cash-outs.
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Balance = {
  customerId: string;
  balanceMinor: string;
  currency: string;
  cashOutAllowed: false;
};

type Program = {
  campaignId: string;
  codePrefix: string;
  rewardKind: "promo_credit";
  cashOutAllowed: false;
};

type Share = {
  shareCode: string;
  shareUrl: string;
  rewardKind: "promo_credit";
  cashOutAllowed: false;
};

export default function AccountPromoPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [share, setShare] = useState<Share | null>(null);
  const [campaignId, setCampaignId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");

  const refreshBalance = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/promo?view=balance");
      const data = (await res.json()) as {
        error?: string;
        balance?: Balance;
        cashOutAllowed?: boolean;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setBalance(data.balance ?? null);
      if (data.cashOutAllowed === false) {
        setMessage("Promo credit never cash-outs (D-42)");
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const loadPrograms = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/promo?view=referral_programs");
      const data = (await res.json()) as {
        error?: string;
        programs?: Program[];
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      const list = data.programs ?? [];
      setPrograms(list);
      if (list[0] && !campaignId) setCampaignId(list[0].campaignId);
    } finally {
      setBusy(false);
    }
  }, [campaignId]);

  async function shareReferralCode() {
    setBusy(true);
    setMessage(null);
    setShare(null);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "share_referral",
          campaignId,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        share?: Share;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setShare(data.share ?? null);
      setMessage("Share code ready — promo_credit only (D-42)");
    } finally {
      setBusy(false);
    }
  }

  async function validateCode() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "validate_code", code }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean; reason?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(data.ok ? `Code valid: ${code}` : `Rejected: ${data.reason ?? "unknown"}`);
    } finally {
      setBusy(false);
    }
  }

  async function tryCashOut() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "attempt_cash_out", amountMinor: "100" }),
      });
      const data = (await res.json()) as { error?: string };
      if (res.status === 400 || data.error === "promo_credit_cash_out_forbidden") {
        setMessage("Cash-out blocked — promo_credit only (D-42)");
        return;
      }
      setMessage(data.error ?? `HTTP ${res.status}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="account-promo-balance"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Link href="/home">Home</Link>
        {" · "}
        <Link href="/spare">Spare</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Promo & referrals
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          PD70 / PD138 — promo credit balance, code validate, referral share. Never cash-out
          (D-42).
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          <button
            type="button"
            disabled={busy}
            onClick={() => void refreshBalance()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: dialTokens.color.brand.primary,
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Refresh balance
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void tryCashOut()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fff",
            }}
          >
            Attempt cash-out
          </button>
        </div>
        {balance ? (
          <p style={{ marginTop: 16 }} data-testid="promo-balance-value">
            Balance: <strong>{balance.balanceMinor}</strong> {balance.currency} minor ·
            cash-out {String(balance.cashOutAllowed)}
          </p>
        ) : null}
        <section
          data-testid="pd138-referral-share"
          style={{ marginTop: 24, display: "grid", gap: 8 }}
        >
          <h2 style={{ fontSize: "1.05rem", margin: 0 }}>Referral share</h2>
          <button type="button" disabled={busy} onClick={() => void loadPrograms()}>
            Load referral programs
          </button>
          {programs.length > 0 ? (
            <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
              Campaign
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
              >
                {programs.map((p) => (
                  <option key={p.campaignId} value={p.campaignId}>
                    {p.codePrefix} · {p.campaignId}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            type="button"
            disabled={busy || !campaignId.trim()}
            onClick={() => void shareReferralCode()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: dialTokens.color.brand.primary,
              color: "#fff",
              fontWeight: 600,
              width: "fit-content",
            }}
          >
            Generate share code
          </button>
          {share ? (
            <div data-testid="pd138-share-payload">
              <p>
                Code: <strong>{share.shareCode}</strong>
              </p>
              <p style={{ wordBreak: "break-all", fontSize: 13 }}>{share.shareUrl}</p>
              <p style={{ fontSize: 13, opacity: 0.75 }}>
                Reward: {share.rewardKind} · cash-out {String(share.cashOutAllowed)}
              </p>
            </div>
          ) : null}
        </section>
        <label style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 20 }}>
          Promo code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </label>
        <button
          type="button"
          disabled={busy || !code.trim()}
          onClick={() => void validateCode()}
          style={{ marginTop: 8, padding: "8px 12px" }}
        >
          Validate
        </button>
        {message ? <p role="status" style={{ marginTop: 12 }}>{message}</p> : null}
      </div>
    </main>
  );
}
