"use client";

import Link from "next/link";
import { useState } from "react";
import { Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  RecommendedSpecialists,
  type SpecialistCardView,
  type SpecialistHintView,
} from "../_components/RecommendedSpecialists";

type Checklist = {
  id: string;
  title: string;
  catalogId?: string;
  steps: string[];
};

type AssessmentView = {
  summary?: string;
  likelyJobClass?: string;
  urgency?: string;
  specialistHint?: SpecialistHintView;
};

/**
 * Pack §9.3 diagnose — FixItNow orange chrome.
 * guidedIntake specialistHint is routing only; match is deterministic. Never AI-priced.
 */
export default function TechGuidePage() {
  const [symptom, setSymptom] = useState("");
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [assessment, setAssessment] = useState<AssessmentView | null>(null);
  const [hint, setHint] = useState<SpecialistHintView | null>(null);
  const [recommended, setRecommended] = useState<SpecialistCardView[]>([]);
  const [fallback, setFallback] = useState<SpecialistCardView[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function diagnose() {
    setBusy(true);
    setMessage(null);
    setChecklist(null);
    setAssessment(null);
    setHint(null);
    setRecommended([]);
    setFallback([]);
    try {
      const res = await fetch("/api/tech/technician", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "resolve_checklist_by_symptom",
          symptom,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        checklist?: Checklist;
        assessment?: AssessmentView;
        recommendedSpecialists?: SpecialistCardView[];
        fallbackTechnicians?: SpecialistCardView[];
        payableFromAi?: boolean;
      };
      if (res.status === 401) {
        setMessage("Sign in to diagnose");
        return;
      }
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setChecklist(data.checklist ?? null);
      setAssessment(data.assessment ?? null);
      setHint(data.assessment?.specialistHint ?? null);
      setRecommended(data.recommendedSpecialists ?? []);
      setFallback(data.fallbackTechnicians ?? []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background" data-testid="pd137-tech-guide">
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Stethoscope className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
            Diagnose
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Describe the symptom. We match a checklist and rank registered
            specialists — never a model price.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="fin-symptom">Symptom</Label>
              <Textarea
                id="fin-symptom"
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                rows={4}
                placeholder="e.g. Mercedes Benz powertrain warning"
              />
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={busy || !symptom.trim()}
              onClick={() => void diagnose()}
            >
              {busy ? "Diagnosing…" : "Resolve checklist"}
            </Button>
            {message ? (
              <p role="status" className="text-sm text-destructive">
                {message}
                {message.includes("Sign in") ? (
                  <>
                    {" "}
                    <Link href="/?next=/tech/guide" className="underline">
                      Sign in
                    </Link>
                  </>
                ) : null}
              </p>
            ) : null}
            {assessment?.summary ? (
              <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                <p>
                  <strong>Summary:</strong> {assessment.summary}
                </p>
                {assessment.likelyJobClass ? (
                  <p className="text-muted-foreground">
                    Likely class: {assessment.likelyJobClass}
                    {assessment.urgency ? ` · ${assessment.urgency}` : ""}
                  </p>
                ) : null}
              </div>
            ) : null}
            {checklist ? (
              <section data-testid="pd137-resolved-checklist" className="space-y-3">
                <h2 className="text-xl font-semibold">{checklist.title}</h2>
                {checklist.catalogId ? (
                  <p className="text-sm text-muted-foreground">{checklist.catalogId}</p>
                ) : null}
                <ol className="list-decimal space-y-1 pl-5 text-sm">
                  {checklist.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <Button asChild variant="outline">
                  <Link href={`/tech/checklist/${checklist.id}`}>Open runner</Link>
                </Button>
              </section>
            ) : null}
            {hint ? (
              <RecommendedSpecialists
                hint={hint}
                recommended={recommended}
                fallback={fallback}
              />
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
