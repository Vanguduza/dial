"use client";

import { useEffect, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type JobRow = {
  id: string;
  status: string;
  emergency: boolean;
  draftAmountUsdMinor: string;
  jobClassId: string;
  slotId: string | null;
  payableFromAi: boolean;
  intakeSummary?: string;
};

type TimelineEvent = { at: string; event: string };
type EvidenceRow = { evidenceId: string; kind: string; createdAt: string };

export function TechJobDetail({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<JobRow | null>(null);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(
        `/api/tech/services?view=job&jobId=${encodeURIComponent(jobId)}`,
      );
      const json = (await res.json()) as {
        error?: string;
        job?: JobRow;
        statusLabel?: string;
        timeline?: TimelineEvent[];
        evidence?: EvidenceRow[];
      };
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      setJob(json.job ?? null);
      setStatusLabel(json.statusLabel ?? null);
      setTimeline(json.timeline ?? []);
      setEvidence(json.evidence ?? []);
    })();
  }, [jobId]);

  if (error) return <p style={{ color: "#a11", fontSize: 14 }}>{error}</p>;
  if (!job) return <p style={{ fontSize: 14 }}>Loading…</p>;

  return (
    <section style={{ display: "grid", gap: dialTokens.space.sm, marginTop: dialTokens.space.md }}>
      <p>
        <strong>{job.id}</strong>
      </p>
      <p style={{ fontSize: 14 }}>
        Status: <strong>{statusLabel ?? job.status}</strong>
        {job.emergency ? " · emergency (AI pricing bypassed)" : ""}
      </p>
      <p style={{ fontSize: 14 }}>Class: {job.jobClassId}</p>
      {job.intakeSummary ? (
        <p style={{ fontSize: 14 }}>Intake: {job.intakeSummary}</p>
      ) : null}
      {job.slotId ? (
        <p style={{ fontSize: 14 }}>
          Cal.com slot: <code>{job.slotId}</code>
        </p>
      ) : null}
      <p style={{ fontSize: 14 }}>
        Draft USD {(Number(job.draftAmountUsdMinor) / 100).toFixed(2)} — rate_card only;
        payableFromAi={String(job.payableFromAi)}
      </p>
      {timeline.length > 0 ? (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600 }}>Timeline</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {timeline.map((t) => (
              <li key={`${t.at}-${t.event}`}>
                {t.event} · {new Date(t.at).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {evidence.length > 0 ? (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600 }}>Evidence ({evidence.length})</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {evidence.map((e) => (
              <li key={e.evidenceId}>
                {e.kind} · {e.evidenceId}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
