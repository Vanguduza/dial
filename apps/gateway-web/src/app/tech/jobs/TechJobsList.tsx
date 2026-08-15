"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";

type JobRow = {
  id: string;
  status: string;
  emergency: boolean;
  draftAmountUsdMinor: string;
  jobClassId: string;
  payableFromAi?: boolean;
};

export function TechJobsList() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tech/services?view=jobs");
      const json = (await res.json()) as { error?: string; jobs?: JobRow[] };
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        setJobs([]);
        return;
      }
      setJobs(json.jobs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load failed");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (busy) return <p style={{ fontSize: 14 }}>Loading…</p>;
  if (error) {
    return (
      <p style={{ fontSize: 14, color: "#a11" }}>
        {error} — <Link href="/sign-in">Sign in</Link>
      </p>
    );
  }
  if (jobs.length === 0) {
    return (
      <p style={{ fontSize: 14 }}>
        No jobs yet. <Link href="/tech/book">Book a tech</Link> or{" "}
        <Link href="/tech/emergency">request emergency</Link>.
      </p>
    );
  }

  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        display: "grid",
        gap: dialTokens.space.md,
      }}
    >
      {jobs.map((j) => (
        <li
          key={j.id}
          style={{
            padding: dialTokens.space.md,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <Link
            href={`/tech/jobs/${j.id}`}
            style={{ textDecoration: "none", color: dialTokens.color.brand.ink }}
          >
            <strong>{j.id}</strong>
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              {j.status}
              {j.emergency ? " · emergency" : ""} · {j.jobClassId}
            </div>
            <div style={{ fontSize: 13 }}>
              Draft USD {(Number(j.draftAmountUsdMinor) / 100).toFixed(2)} (rate_card · not
              payable from AI)
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
