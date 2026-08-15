"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Draft = {
  vertical: "spare" | "grocery";
  offerId: string;
  title: string;
  unitPriceUsdMinor: string;
  supplierFormality: "formal" | "informal";
  brand: string;
  qualityTier?: string;
  oem?: string;
  unitLabel?: string;
  coldChain?: string;
  payableFromAi: false;
  ageGateRequired: false;
};

type QueueItem = {
  reviewId: string;
  batchId: string;
  offerId: string;
  status: string;
  vertical: "spare" | "grocery";
  draft?: Draft;
};

type DemandGap = {
  noResultCount: number;
  topQueries: Array<{ query: string; count: number }>;
  informalB2bLeaks: number;
  pendingReview: number;
  approvedAwaitingPublish: number;
};

const SAMPLE_CSV = `vertical,offerId,title,unitPriceUsdMinor,supplierFormality,brand,oem,qualityTier
spare,off_pd15_ui,PD15 UI Spare,2500,formal,Bosch,OEM-UI,OES
grocery,groc_pd15_ui,PD15 UI Oats 1kg,420,formal,Dairibord,1kg,ambient`;

/**
 * PD15 Catalogue Factory admin — CSV → human approve → Meili (spare/grocery).
 * No AI auto-publish. Payable amounts come from CSV/ops only (D-54).
 */
export default function AdminCatalogueFactoryPage() {
  const [secret, setSecret] = useState("");
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [demandGap, setDemandGap] = useState<DemandGap | null>(null);
  const [rejected, setRejected] = useState<Array<{ line: number; reason: string }>>(
    [],
  );
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
      const res = await fetch("/api/admin/catalogue/review", {
        headers: headers(),
      });
      const data = (await res.json()) as {
        error?: string;
        queue?: QueueItem[];
        demandGap?: DemandGap;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setQueue(data.queue ?? []);
      setDemandGap(data.demandGap ?? null);
    } finally {
      setBusy(false);
    }
  }

  async function ingestCsv() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/catalogue/review", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action: "ingest_csv", csvText }),
      });
      const data = (await res.json()) as {
        error?: string;
        queue?: QueueItem[];
        demandGap?: DemandGap;
        rejectedRows?: Array<{ line: number; reason: string }>;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setQueue(data.queue ?? []);
      setDemandGap(data.demandGap ?? null);
      setRejected(data.rejectedRows ?? []);
      setMessage(
        `Ingested · rejected ${data.rejectedRows?.length ?? 0} (liquor/invalid)`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function approve(reviewId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/catalogue/review", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action: "approve", reviewId }),
      });
      const data = (await res.json()) as {
        error?: string;
        demandGap?: DemandGap;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setDemandGap(data.demandGap ?? null);
      setMessage(`Approved ${reviewId} — publish still required (no auto-publish)`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function reject(reviewId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/catalogue/review", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action: "reject", reviewId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Rejected ${reviewId}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function publish(item: QueueItem) {
    if (!item.draft) {
      setMessage("Draft missing — re-ingest CSV");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      if (item.vertical === "grocery") {
        const res = await fetch("/api/admin/catalogue/review", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            action: "publish_grocery",
            batchId: item.batchId,
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          indexUid?: string;
          offerId?: string;
        };
        if (!res.ok) {
          setMessage(data.error ?? `HTTP ${res.status}`);
          return;
        }
        setMessage(`Published grocery ${data.offerId} → ${data.indexUid}`);
      } else {
        const d = item.draft;
        const res = await fetch("/api/admin/catalogue/review", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            action: "publish",
            batchId: item.batchId,
            offer: {
              offerId: d.offerId,
              title: d.title,
              unitPriceUsdMinor: d.unitPriceUsdMinor,
              qualityTier: d.qualityTier ?? "OES",
              supplierFormality: d.supplierFormality,
              oem: d.oem ?? d.offerId,
              brand: d.brand,
            },
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          indexUid?: string;
          doc?: { id?: string };
        };
        if (!res.ok) {
          setMessage(data.error ?? `HTTP ${res.status}`);
          return;
        }
        setMessage(`Published spare ${data.doc?.id} → ${data.indexUid}`);
      }
      await refresh();
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
          <Link href="/admin">Admin</Link> · Catalogue Factory
        </p>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            fontSize: "1.75rem",
            marginTop: dialTokens.space.sm,
          }}
        >
          Catalogue Factory
        </h1>
        <p style={{ opacity: 0.85, maxWidth: 640 }}>
          CSV ingest → human approve → publish to Meili spare / grocery indexes.
          No liquor. No AI auto-publish. Prices are ops/CSV integer minor units
          only (D-49 / D-53 / D-54).
        </p>

        <label style={{ display: "block", marginTop: dialTokens.space.md }}>
          Internal API secret
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            autoComplete="off"
            style={{
              display: "block",
              width: "100%",
              marginTop: 4,
              padding: 8,
            }}
          />
        </label>

        <label style={{ display: "block", marginTop: dialTokens.space.md }}>
          CSV (vertical,offerId,title,unitPriceUsdMinor,supplierFormality,brand,…)
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={6}
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
          <button type="button" disabled={busy} onClick={() => void ingestCsv()}>
            Ingest CSV
          </button>
          <button type="button" disabled={busy} onClick={() => void refresh()}>
            Refresh queue
          </button>
        </div>

        {message ? (
          <p role="status" style={{ marginTop: dialTokens.space.md }}>
            {message}
          </p>
        ) : null}

        {demandGap ? (
          <section style={{ marginTop: dialTokens.space.lg }}>
            <h2 style={{ fontSize: "1.1rem" }}>Demand-gap KPIs</h2>
            <ul style={{ paddingLeft: "1.2rem" }}>
              <li>No-result searches: {demandGap.noResultCount}</li>
              <li>Pending review: {demandGap.pendingReview}</li>
              <li>Approved awaiting publish: {demandGap.approvedAwaitingPublish}</li>
              <li>Informal B2B leaks (spare): {demandGap.informalB2bLeaks}</li>
            </ul>
            {demandGap.topQueries.length > 0 ? (
              <p style={{ fontSize: 14 }}>
                Top queries:{" "}
                {demandGap.topQueries
                  .map((q) => `${q.query} (${q.count})`)
                  .join(", ")}
              </p>
            ) : null}
          </section>
        ) : null}

        {rejected.length > 0 ? (
          <section style={{ marginTop: dialTokens.space.md }}>
            <h2 style={{ fontSize: "1.1rem" }}>Rejected rows</h2>
            <ul>
              {rejected.map((r) => (
                <li key={`${r.line}-${r.reason}`}>
                  Line {r.line}: {r.reason}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section style={{ marginTop: dialTokens.space.lg }}>
          <h2 style={{ fontSize: "1.1rem" }}>Review queue</h2>
          {queue.length === 0 ? (
            <p style={{ opacity: 0.7 }}>Empty — ingest CSV to enqueue drafts.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {queue.map((item) => (
                <li
                  key={item.reviewId}
                  style={{
                    borderTop: `1px solid ${dialTokens.color.brand.ink}22`,
                    padding: `${dialTokens.space.sm} 0`,
                  }}
                >
                  <strong>{item.draft?.title ?? item.offerId}</strong> ·{" "}
                  {item.vertical} · {item.status}
                  {item.draft ? (
                    <span style={{ opacity: 0.8 }}>
                      {" "}
                      · {item.draft.unitPriceUsdMinor} USD minor ·{" "}
                      {item.draft.supplierFormality} · payableFromAi=
                      {String(item.draft.payableFromAi)}
                    </span>
                  ) : null}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {item.status === "queued" ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void approve(item.reviewId)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void reject(item.reviewId)}
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                    {item.status === "approved" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void publish(item)}
                      >
                        Publish to Meili
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
