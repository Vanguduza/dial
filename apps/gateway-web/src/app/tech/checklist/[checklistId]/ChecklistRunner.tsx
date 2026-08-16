"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Checklist } from "../../../../lib/tech/stubs";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

/** Interactive checklist runner — FixItNow orange chrome. */
export function ChecklistRunner({ checklist }: { checklist: Checklist }) {
  const [step, setStep] = useState(0);
  const current = checklist.steps[step];
  const done = step >= checklist.steps.length;
  const progress = useMemo(
    () => `${Math.min(step + 1, checklist.steps.length)} / ${checklist.steps.length}`,
    [step, checklist.steps.length],
  );
  const percent =
    checklist.steps.length === 0
      ? 100
      : Math.round((Math.min(step, checklist.steps.length) / checklist.steps.length) * 100);

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-muted/30">
        <div className="container mx-auto max-w-xl px-4 py-10">
          <p className="text-sm text-muted-foreground">
            <Link href="/tech" className="hover:text-primary">
              Home
            </Link>
            <span aria-hidden="true"> · </span>
            <Link href="/tech/guide" className="hover:text-primary">
              Diagnose
            </Link>
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">{checklist.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Step {progress}</p>
        </div>
      </section>
      <section className="container mx-auto max-w-xl px-4 py-10">
        <Card>
          <CardContent className="space-y-4 p-6">
            <Progress value={percent} />
            {done ? (
              <p className="font-semibold">Checklist complete.</p>
            ) : (
              <>
                <p className="text-lg">{current}</p>
                <Button className="w-full" onClick={() => setStep((s) => s + 1)}>
                  Next
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
