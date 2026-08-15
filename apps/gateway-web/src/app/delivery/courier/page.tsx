/**
 * PD51 Courier hub (web) — Pack §9.8 deepen: float banner, POD photo, COD ack.
 * Session SoR; MapLibre track via admin; payableFromAi=false.
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Offer = { id: string; jobId: string; status: string };
type Job = {
  id: string;
  status: string;
  codAmountUsdMinor?: string;
  podPhotoRef?: string;
};
type FloatState = {
  floatLimitUsdMinor: string;
  heldUsdMinor: string;
};

export default function CourierHubPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [courierId, setCourierId] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [float, setFloat] = useState<FloatState | null>(null);
  const [floatBanner, setFloatBanner] = useState<string | null>(null);
  const [ackFloat, setAckFloat] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/delivery/courier");
      const data = (await res.json()) as {
        error?: string;
        courierId?: string;
        offers?: Offer[];
        jobs?: Job[];
        float?: FloatState;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setCourierId(data.courierId ?? null);
      setOffers(data.offers ?? []);
      setJobs(data.jobs ?? []);
      setFloat(data.float ?? null);
    } finally {
      setBusy(false);
    }
  }, []);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/delivery/courier", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        evaluation?: { floatLimitWarning?: boolean; message?: string };
        attempt?: { status?: string };
        job?: Job;
        podPhotoRef?: string | null;
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      if (data.evaluation?.floatLimitWarning) {
        setFloatBanner(data.evaluation.message ?? "COD float limit warning");
      }
      if (data.attempt?.status) {
        setMessage(`COD attempt: ${data.attempt.status}`);
      } else if (data.podPhotoRef) {
        setMessage(`POD photo ${data.podPhotoRef}`);
      } else if (data.job) {
        setMessage(`Job ${data.job.id} → ${data.job.status}`);
      } else {
        setMessage("OK");
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const activeJob = jobs.find(
    (j) => j.status === "assigned" || j.status === "in_transit" || j.status === "pod_captured",
  );

  return (
    <main
      data-testid="courier-hub"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/admin/delivery/track">Live track</Link>
        {" · "}
        <Link href="/admin/delivery/dispatch">Dispatch</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
          }}
        >
          Courier hub
        </h1>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          PD51 — float banner + POD photo stub + COD ack. MapLibre/OSRM SoR (not
          Google). Session auth required.
        </p>
        {floatBanner ? (
          <p
            role="alert"
            data-testid="cod-float-banner"
            style={{
              marginTop: 12,
              padding: 12,
              background: "#fff3cd",
              border: "1px solid #c9a227",
            }}
          >
            {floatBanner}
          </p>
        ) : null}
        {float ? (
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            Float held {float.heldUsdMinor} / limit {float.floatLimitUsdMinor} USD
            minor · courier {courierId}
          </p>
        ) : null}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <button type="button" disabled={busy} onClick={() => void refresh()}>
            Refresh
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void act({ action: "set_availability", status: "available" })}
          >
            Go available
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void act({ action: "seed_offer", codUsdMinor: "4000" })}
          >
            Seed offer
          </button>
        </div>
        <ul style={{ marginTop: 16 }}>
          {offers.map((o) => (
            <li key={o.id}>
              Offer {o.id} · {o.status}
              <button
                type="button"
                disabled={busy}
                onClick={() => void act({ action: "accept_offer", offerId: o.id })}
                style={{ marginLeft: 8 }}
              >
                Accept
              </button>
            </li>
          ))}
        </ul>
        {activeJob ? (
          <section style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 16 }}>Active job {activeJob.id}</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void act({ action: "start_transit", jobId: activeJob.id })
                }
              >
                Start transit
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void act({
                    action: "capture_pod",
                    jobId: activeJob.id,
                    photoRef: `fixture://pod/${activeJob.id}.jpg`,
                  })
                }
              >
                Capture POD + photo
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void act({
                    action: "evaluate_cod_float",
                    collectUsdMinor: activeJob.codAmountUsdMinor ?? "4000",
                  })
                }
              >
                Check float banner
              </button>
            </div>
            <label
              style={{
                display: "flex",
                gap: 8,
                marginTop: 12,
                alignItems: "center",
              }}
            >
              <input
                type="checkbox"
                checked={ackFloat}
                onChange={(e) => setAckFloat(e.target.checked)}
              />
              Ack COD float warning
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void act({
                  action: "cod_collect_attempt",
                  jobId: activeJob.id,
                  collectUsdMinor: activeJob.codAmountUsdMinor ?? "4000",
                  acknowledgedWarning: ackFloat,
                })
              }
              style={{ marginTop: 8 }}
            >
              COD collect
            </button>
          </section>
        ) : null}
        {message ? <p role="status">{message}</p> : null}
      </div>
    </main>
  );
}
