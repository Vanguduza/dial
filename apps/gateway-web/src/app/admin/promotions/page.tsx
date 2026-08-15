"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Snapshot = {
  campaigns: Array<{
    id: string;
    type: string;
    name: string;
    status: string;
    budgets: Array<{ limit: string; used: string; currency?: string }>;
  }>;
  coopAgreements: Array<{
    campaignId: string;
    supplierId: string;
    status: string;
    supplierFundShareBps: number;
    dialFundShareBps: number;
  }>;
  referralEdges: Array<{
    edgeId: string;
    code: string;
    status: string;
    fraudHold: string;
    fraudReason?: string;
  }>;
  cashOutAttemptsBlocked: number;
};

/**
 * PD16 Promotions & referrals admin — Pack §9.5 / D-42.
 * Create PLATFORM/FLASH/REFERRAL; approve SUPPLIER_COOP; fraud holds; no cash-out.
 */
export default function AdminPromotionsPage() {
  const [secret, setSecret] = useState("");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("Ops PLATFORM spare");
  const [budget, setBudget] = useState("10000");

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
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        snapshot?: Snapshot;
        blocked?: boolean;
        campaignId?: string;
        edgeId?: string;
        agreementStatus?: string;
      };
      if (data.snapshot) setSnapshot(data.snapshot);
      if (!res.ok && !data.blocked) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return data;
      }
      if (data.blocked) {
        setMessage(`Cash-out blocked (D-42): ${data.error}`);
        return data;
      }
      setMessage(
        data.campaignId
          ? `OK · campaign ${data.campaignId}`
          : data.edgeId
            ? `OK · edge ${data.edgeId}`
            : data.agreementStatus
              ? `OK · coop ${data.agreementStatus}`
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
      const res = await fetch("/api/admin/promotions", { headers: headers() });
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
          <Link href="/admin">Admin</Link> · Promotions & referrals
        </p>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            fontSize: "1.75rem",
            marginTop: dialTokens.space.sm,
          }}
        >
          Promotions & referrals
        </h1>
        <p style={{ opacity: 0.85, maxWidth: 640 }}>
          Create PLATFORM / FLASH / REFERRAL, approve SUPPLIER_COOP, hold fraud
          edges, enforce budgets. Promo credit never cash-outs (@dial/promotions
          only — D-42).
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
                action: "create_campaign",
                type: "PLATFORM",
                name,
                budgetSpendLimitMinor: budget,
              })
            }
          >
            Create PLATFORM
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void post({
                action: "create_campaign",
                type: "FLASH",
                name: `${name} FLASH`,
                budgetSpendLimitMinor: budget,
              })
            }
          >
            Create FLASH
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void post({
                action: "create_campaign",
                type: "REFERRAL",
                name: `${name} REFERRAL`,
                budgetSpendLimitMinor: budget,
                codePrefix: "OPS",
                referrerReward: {
                  kind: "promo_credit",
                  amountMinor: "500",
                  currency: "USD",
                },
                refereeReward: {
                  kind: "promo_credit",
                  amountMinor: "300",
                  currency: "USD",
                },
              })
            }
          >
            Create REFERRAL
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void post({
                action: "propose_coop",
                name: "Co-op sample",
                supplierId: "sup_demo",
                offerIds: ["off_demo"],
                supplierFundShareBps: 6000,
                dialFundShareBps: 4000,
                budgetSpendLimitMinor: budget,
              })
            }
          >
            Propose SUPPLIER_COOP
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void post({
                action: "attempt_cash_out",
                customerId: "cust_demo",
                amountMinor: "100",
              })
            }
          >
            Attempt cash-out (must block)
          </button>
        </div>

        <label style={{ display: "block", marginTop: dialTokens.space.md }}>
          Campaign name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginTop: dialTokens.space.sm }}>
          Budget spend limit (USD minor)
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
          />
        </label>

        {message ? (
          <p role="status" style={{ marginTop: dialTokens.space.md }}>
            {message}
          </p>
        ) : null}

        {snapshot ? (
          <>
            <section style={{ marginTop: dialTokens.space.lg }}>
              <h2 style={{ fontSize: "1.1rem" }}>Campaigns</h2>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {snapshot.campaigns.map((c) => (
                  <li
                    key={c.id}
                    style={{
                      borderTop: `1px solid ${dialTokens.color.brand.ink}22`,
                      padding: `${dialTokens.space.sm} 0`,
                    }}
                  >
                    <strong>{c.name}</strong> · {c.type} · {c.status} · budget{" "}
                    {c.budgets[0]?.used}/{c.budgets[0]?.limit}{" "}
                    {c.budgets[0]?.currency ?? "USD"} minor
                    {c.status === "draft" && c.type !== "SUPPLIER_COOP" ? (
                      <button
                        type="button"
                        disabled={busy}
                        style={{ marginLeft: 8 }}
                        onClick={() =>
                          void post({ action: "activate", campaignId: c.id })
                        }
                      >
                        Activate
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>

            <section style={{ marginTop: dialTokens.space.md }}>
              <h2 style={{ fontSize: "1.1rem" }}>SUPPLIER_COOP queue</h2>
              {snapshot.coopAgreements.length === 0 ? (
                <p style={{ opacity: 0.7 }}>None</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {snapshot.coopAgreements.map((a) => (
                    <li
                      key={a.campaignId}
                      style={{
                        borderTop: `1px solid ${dialTokens.color.brand.ink}22`,
                        padding: `${dialTokens.space.sm} 0`,
                      }}
                    >
                      {a.supplierId} · {a.status} ·{" "}
                      {a.supplierFundShareBps}/{a.dialFundShareBps} bps
                      {a.status === "proposed" ? (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            style={{ marginLeft: 8 }}
                            onClick={() =>
                              void post({
                                action: "accept_coop",
                                campaignId: a.campaignId,
                              })
                            }
                          >
                            Supplier accept
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            style={{ marginLeft: 8 }}
                            onClick={() =>
                              void post({
                                action: "approve_coop",
                                campaignId: a.campaignId,
                              })
                            }
                          >
                            Ops approve
                          </button>
                        </>
                      ) : null}
                      {a.status === "supplier_accepted" ? (
                        <button
                          type="button"
                          disabled={busy}
                          style={{ marginLeft: 8 }}
                          onClick={() =>
                            void post({
                              action: "approve_coop",
                              campaignId: a.campaignId,
                            })
                          }
                        >
                          Ops approve
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section style={{ marginTop: dialTokens.space.md }}>
              <h2 style={{ fontSize: "1.1rem" }}>
                Fraud holds · cash-outs blocked:{" "}
                {snapshot.cashOutAttemptsBlocked}
              </h2>
              {snapshot.referralEdges.length === 0 ? (
                <p style={{ opacity: 0.7 }}>No referral edges yet</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {snapshot.referralEdges.map((e) => (
                    <li
                      key={e.edgeId}
                      style={{
                        borderTop: `1px solid ${dialTokens.color.brand.ink}22`,
                        padding: `${dialTokens.space.sm} 0`,
                      }}
                    >
                      {e.code} · {e.status} · hold={e.fraudHold}
                      {e.fraudReason ? ` (${e.fraudReason})` : ""}
                      {e.fraudHold !== "held" ? (
                        <button
                          type="button"
                          disabled={busy}
                          style={{ marginLeft: 8 }}
                          onClick={() =>
                            void post({
                              action: "fraud_hold",
                              edgeId: e.edgeId,
                              reason: "ops_manual_hold",
                            })
                          }
                        >
                          Hold
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          style={{ marginLeft: 8 }}
                          onClick={() =>
                            void post({
                              action: "fraud_release",
                              edgeId: e.edgeId,
                            })
                          }
                        >
                          Release
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
