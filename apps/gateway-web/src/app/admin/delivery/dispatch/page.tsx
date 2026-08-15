"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Board = {
  fifoJobIds: string[];
  availableCouriers: string[];
  jobs: Array<{ id: string; status: string; orderId: string; offerId?: string }>;
  offers: Array<{ id: string; jobId: string; courierId: string; status: string }>;
};

/**
 * PD10 live dispatch board — FIFO + offers vs @dial/delivery (D-45).
 * MapLibre track remains /admin/delivery/track.
 */
export default function AdminDispatchBoardPage() {
  const [secret, setSecret] = useState("");
  const [board, setBoard] = useState<Board | null>(null);
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
      const res = await fetch("/api/admin/delivery/dispatch", { headers: headers() });
      const data = (await res.json()) as { error?: string; board?: Board };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setBoard(data.board ?? null);
    } finally {
      setBusy(false);
    }
  }

  async function seed(action: "seed_fifo_job" | "seed_offer_job") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/delivery/dispatch", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { error?: string; jobId?: string; workflowPhase?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(`Seeded ${data.jobId} · phase ${data.workflowPhase}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function overrideAssign(jobId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/delivery/dispatch", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          action: "manual_override_assign",
          jobId,
          courierId: "cour_ops_override",
          assignedBy: "ops_dispatch",
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        job?: { id: string; status: string; assignedCourierId?: string };
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(
        `Override assigned ${data.job?.id} → ${data.job?.assignedCourierId} (${data.job?.status})`,
      );
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
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Link href="/admin/delivery/track">Live track</Link>
        {" · "}
        <Link href="/admin/command-centre">Command Centre</Link>
        {" · "}
        <Link href="/home">Home</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Dispatch board
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          Live <code>delivery_jobs</code> FIFO + offers — SoR <code>@dial/delivery</code> +{" "}
          <code>DeliveryDispatchWorkflow</code> (not Fleetbase).
        </p>
        <label style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 16 }}>
          Internal API secret
          <input
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc", maxWidth: 360 }}
          />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() => void refresh()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: dialTokens.color.brand.primary,
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Refresh board
          </button>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() => void seed("seed_fifo_job")}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: `1px solid ${dialTokens.color.brand.primary}`,
              background: "transparent",
              fontWeight: 600,
            }}
          >
            Seed FIFO job
          </button>
          <button
            type="button"
            disabled={busy || !secret}
            onClick={() => void seed("seed_offer_job")}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: `1px solid ${dialTokens.color.brand.accent}`,
              background: "transparent",
              fontWeight: 600,
            }}
          >
            Seed offer job
          </button>
        </div>
        {message ? <p role="status">{message}</p> : null}
        {board ? (
          <>
            <p style={{ marginTop: 16 }}>
              Available couriers: <strong>{board.availableCouriers.length}</strong> · FIFO depth:{" "}
              <strong>{board.fifoJobIds.length}</strong>
            </p>
            <h2 style={{ fontSize: "1.1rem" }}>FIFO</h2>
            <ul style={{ fontSize: 13 }}>
              {board.fifoJobIds.map((id) => (
                <li key={id}>
                  <code>{id}</code>
                  <button
                    type="button"
                    disabled={busy || !secret}
                    onClick={() => void overrideAssign(id)}
                    style={{ marginLeft: 8 }}
                  >
                    Manual override assign
                  </button>
                </li>
              ))}
            </ul>
            <h2 style={{ fontSize: "1.1rem" }}>Jobs</h2>
            <ul style={{ fontSize: 13, lineHeight: 1.6 }}>
              {board.jobs.map((j) => (
                <li key={j.id}>
                  <code>{j.id}</code> · {j.status} · order {j.orderId}
                  {j.offerId ? ` · offer ${j.offerId}` : ""}
                </li>
              ))}
            </ul>
            <h2 style={{ fontSize: "1.1rem" }}>Offers</h2>
            <ul style={{ fontSize: 13, lineHeight: 1.6 }}>
              {board.offers.map((o) => (
                <li key={o.id}>
                  <code>{o.id}</code> · {o.status} · {o.courierId} → job {o.jobId}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </main>
  );
}
