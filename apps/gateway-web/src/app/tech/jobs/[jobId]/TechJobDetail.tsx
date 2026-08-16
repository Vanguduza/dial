"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AssignedTechnician = {
  technicianId: string;
  displayName: string;
  tradeName: string | null;
};

type JobRow = {
  id: string;
  status: string;
  emergency: boolean;
  draftAmountUsdMinor: string;
  jobClassId: string;
  slotId: string | null;
  payableFromAi: boolean;
  intakeSummary?: string;
  technicianId: string | null;
  assignedTechnician?: AssignedTechnician | null;
  checklistHref?: string;
  labelledDraft?: boolean;
};

type TimelineEvent = { at: string; event: string };
type EvidenceRow = { evidenceId: string; kind: string; createdAt: string };
type PayPreview = {
  rails: string[];
  amountUsdMinor: string;
  displayCurrency: string;
  zigMinor: string | null;
  ready: boolean;
  note?: string;
};

function formatUsd(minor: string) {
  return (Number(minor) / 100).toFixed(2);
}

export function TechJobDetail({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<JobRow | null>(null);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [pay, setPay] = useState<PayPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [paying, setPaying] = useState<"ecocash" | "cod" | null>(null);
  const [payMessage, setPayMessage] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch(
      `/api/tech/services?view=job&jobId=${encodeURIComponent(jobId)}`,
    );
    const json = (await res.json()) as {
      error?: string;
      job?: JobRow;
      statusLabel?: string;
      timeline?: TimelineEvent[];
      evidence?: EvidenceRow[];
      pay?: PayPreview;
      assignedTechnician?: AssignedTechnician | null;
      checklistHref?: string;
    };
    if (!res.ok) {
      setError(json.error ?? `HTTP ${res.status}`);
      return;
    }
    const next = json.job ?? null;
    if (next && !next.assignedTechnician && json.assignedTechnician) {
      next.assignedTechnician = json.assignedTechnician;
    }
    if (next && !next.checklistHref && json.checklistHref) {
      next.checklistHref = json.checklistHref;
    }
    setJob(next);
    setStatusLabel(json.statusLabel ?? null);
    setTimeline(json.timeline ?? []);
    setEvidence(json.evidence ?? []);
    setPay(json.pay ?? null);
  }

  useEffect(() => {
    void refresh();
  }, [jobId]);

  async function bookFromIntake() {
    setBooking(true);
    setError(null);
    try {
      const slotsRes = await fetch("/api/tech/services?view=slots");
      const slotsJson = (await slotsRes.json()) as {
        slots?: { slotId: string }[];
      };
      const slotId = slotsJson.slots?.[0]?.slotId;
      const res = await fetch("/api/tech/services", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "book_intake",
          jobId,
          ...(slotId ? { slotId } : {}),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      await refresh();
    } finally {
      setBooking(false);
    }
  }

  async function payJob(choice: "ecocash" | "cod") {
    setPaying(choice);
    setPayMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/tech/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Idempotency-Key": `tech-job-${jobId}-${choice}-${Date.now()}`,
        },
        body: JSON.stringify({ action: "pay", jobId, choice }),
      });
      const json = (await res.json()) as {
        error?: string;
        failClosed?: boolean;
        ok?: boolean;
        jobReserve?: { status: string };
        intent?: { status: string };
      };
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      setPayMessage(
        json.jobReserve
          ? `Job Reserve ${json.jobReserve.status}`
          : "Payment started",
      );
      await refresh();
    } finally {
      setPaying(null);
    }
  }

  if (error && !job) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (!job) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const assigned = job.assignedTechnician;
  const railsReady = pay?.ready !== false;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{statusLabel ?? job.status}</Badge>
            {job.emergency ? <Badge variant="destructive">Emergency</Badge> : null}
            <Badge variant="secondary">draft</Badge>
          </div>
          <p className="font-mono text-sm text-muted-foreground">{job.id}</p>
          <p className="text-sm">Class: {job.jobClassId}</p>
          {assigned ? (
            <p className="text-sm" data-testid="job-assigned-technician">
              Assigned: <strong>{assigned.displayName}</strong>
              {assigned.tradeName ? ` · ${assigned.tradeName}` : ""}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Specialist / technician: awaiting assign
            </p>
          )}
          {job.intakeSummary ? (
            <p className="text-sm text-muted-foreground">Intake: {job.intakeSummary}</p>
          ) : null}
          {job.slotId ? (
            <p className="text-sm text-muted-foreground">
              Slot: <code>{job.slotId}</code>
            </p>
          ) : null}
          <p className="text-2xl font-bold text-primary">
            USD {formatUsd(job.draftAmountUsdMinor)}
          </p>
          <p className="text-xs text-muted-foreground">
            Rate-card draft — confirmed on site. Payable amounts never come from AI.
          </p>
          {job.status === "intake" ? (
            <Button
              type="button"
              data-testid="pd111-book-intake"
              disabled={booking}
              onClick={() => void bookFromIntake()}
            >
              {booking ? "Booking…" : "Book from intake"}
            </Button>
          ) : null}
          {job.checklistHref ? (
            <Button asChild variant="outline">
              <Link href={job.checklistHref}>Open checklist</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">Pay on this job</h2>
          <p className="text-sm text-muted-foreground">
            EcoCash or cash on delivery. Browse stays USD
            {pay?.zigMinor
              ? ` · payable ZiG ${(Number(pay.zigMinor) / 100).toFixed(2)}`
              : " · ZiG at pay when the ops daily rate is set"}
            . IMTT is not a customer line.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              data-testid="pay-ecocash"
              disabled={Boolean(paying)}
              onClick={() => void payJob("ecocash")}
            >
              {paying === "ecocash" ? "Holding…" : "EcoCash"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              data-testid="pay-cod"
              disabled={Boolean(paying)}
              onClick={() => void payJob("cod")}
            >
              {paying === "cod" ? "Holding…" : "Cash on delivery (COD)"}
            </Button>
          </div>
          {!railsReady ? (
            <p className="text-sm text-muted-foreground" data-testid="pay-fail-closed">
              {pay?.note ?? "Pay rails fail-closed until the Daily ZiG rate is set."}
            </p>
          ) : null}
          {payMessage ? <p className="text-sm text-primary">{payMessage}</p> : null}
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {timeline.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-lg font-semibold">Timeline</h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {timeline.map((t) => (
                <li key={`${t.at}-${t.event}`}>
                  {t.event} · {new Date(t.at).toLocaleString()}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {evidence.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-lg font-semibold">
              Evidence ({evidence.length})
            </h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {evidence.map((e) => (
                <li key={e.evidenceId}>
                  {e.kind} · {e.evidenceId}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
