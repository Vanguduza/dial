"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

/**
 * PD127 — PicPeak evidence gallery (approve/reject + next/prev).
 */
export default function AdminEvidenceGalleryPage() {
  const [secret, setSecret] = useState("");
  const [jobId, setJobId] = useState("");
  const [items, setItems] = useState<
    Array<{
      evidenceId: string;
      kind: string;
      reviewStatus: string;
      nearDupeOf: string | null;
      index: number;
      total: number;
    }>
  >([]);
  const [cursor, setCursor] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const headers = useCallback(
    () => ({
      "content-type": "application/json",
      "x-internal-secret": secret,
    }),
    [secret],
  );

  const load = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const q = jobId ? `?jobId=${encodeURIComponent(jobId)}` : "";
      const res = await fetch(`/api/admin/evidence/gallery${q}`, {
        headers: headers(),
      });
      const data = (await res.json()) as {
        error?: string;
        gallery?: { items?: typeof items; customerPhotoShare?: boolean };
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setItems(data.gallery?.items ?? []);
      setCursor(0);
      setMessage(
        data.gallery?.customerPhotoShare === false
          ? "PicPeak ops gallery — not customer photo-share"
          : null,
      );
    } finally {
      setBusy(false);
    }
  }, [headers, jobId]);

  async function review(decision: "approve" | "reject") {
    const cur = items[cursor];
    if (!cur) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/evidence/gallery", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "review",
          evidenceId: cur.evidenceId,
          decision,
          reviewedBy: "ops_ui",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  const current = items[cursor];

  return (
    <main
      data-testid="pd127-picpeak-gallery"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: "1.5rem",
      }}
    >
      <p>
        <Link href="/admin/disputes">Disputes</Link>
      </p>
      <h1>Evidence gallery</h1>
      <p>PicPeak pattern — lightbox review; near-dupe flag; never payable.</p>
      <label>
        Internal secret{" "}
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          autoComplete="off"
        />
      </label>{" "}
      <label>
        Job id{" "}
        <input value={jobId} onChange={(e) => setJobId(e.target.value)} />
      </label>{" "}
      <button type="button" disabled={busy} onClick={() => void load()}>
        Load
      </button>
      {message ? <p role="status">{message}</p> : null}
      {current ? (
        <section aria-label="lightbox">
          <p>
            [{current.index + 1}/{current.total}] {current.evidenceId} ·{" "}
            {current.kind} · {current.reviewStatus}
            {current.nearDupeOf ? ` · near-dupe of ${current.nearDupeOf}` : ""}
          </p>
          <button
            type="button"
            disabled={busy || cursor <= 0}
            onClick={() => setCursor((c) => Math.max(0, c - 1))}
          >
            Prev
          </button>{" "}
          <button
            type="button"
            disabled={busy || cursor >= items.length - 1}
            onClick={() => setCursor((c) => Math.min(items.length - 1, c + 1))}
          >
            Next
          </button>{" "}
          <button
            type="button"
            disabled={busy}
            onClick={() => void review("approve")}
          >
            Approve
          </button>{" "}
          <button
            type="button"
            disabled={busy}
            onClick={() => void review("reject")}
          >
            Reject
          </button>
        </section>
      ) : (
        <p>No evidence loaded.</p>
      )}
    </main>
  );
}
