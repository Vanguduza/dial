"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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

  if (busy) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error} — <Link href="/?next=/tech/jobs" className="underline">Sign in</Link>
      </p>
    );
  }
  if (jobs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No jobs yet.{" "}
        <Link href="/tech/services" className="text-primary underline">
          Book a tech
        </Link>{" "}
        or{" "}
        <Link href="/tech/emergency" className="text-primary underline">
          request emergency
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {jobs.map((j) => (
        <li key={j.id}>
          <Link href={`/tech/jobs/${j.id}`}>
            <Card className="transition hover:border-primary/40 hover:shadow-md">
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold">
                    {j.jobClassId}
                    {j.emergency ? " · emergency" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    USD {(Number(j.draftAmountUsdMinor) / 100).toFixed(2)} draft
                    {j.payableFromAi === false ? " · rate_card" : ""}
                  </p>
                </div>
                <Badge>{j.status}</Badge>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
