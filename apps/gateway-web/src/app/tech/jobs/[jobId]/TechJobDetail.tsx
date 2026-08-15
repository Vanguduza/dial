"use client";

import { useEffect, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

export function TechJobDetail({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<{
    id: string;
    status: string;
    emergency: boolean;
    draftAmountUsdMinor: string;
    jobClassId: string;
    slotId: string | null;
    payableFromAi: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(
        `/api/tech/services?view=job&jobId=${encodeURIComponent(jobId)}`,
      );
      const json = (await res.json()) as {
        error?: string;
        job?: typeof job;
      };
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      setJob(json.job ?? null);
    })();
  }, [jobId]);

  if (error) return <p style={{ color: "#a11", fontSize: 14 }}>{error}</p>;
  if (!job) return <p style={{ fontSize: 14 }}>Loading…</p>;

  return (
    <section style={{ marginTop: dialTokens.space.md }}>
      <p>
        <strong>{job.id}</strong>
      </p>
      <p style={{ fontSize: 14 }}>
        Status: <strong>{job.status}</strong>
        {job.emergency ? " · emergency (AI pricing bypassed)" : ""}
      </p>
      <p style={{ fontSize: 14 }}>Class: {job.jobClassId}</p>
      {job.slotId ? (
        <p style={{ fontSize: 14 }}>
          Cal.com slot: <code>{job.slotId}</code>
        </p>
      ) : null}
      <p style={{ fontSize: 14 }}>
        Draft USD {(Number(job.draftAmountUsdMinor) / 100).toFixed(2)} — rate_card only;
        payableFromAi={String(job.payableFromAi)}
      </p>
    </section>
  );
}
