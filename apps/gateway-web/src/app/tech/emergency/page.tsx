/**
 * Pack §9.3 emergency — deterministic path; AI pricing bypassed (D-32).
 * Never gates on Gemini / guidedIntake.
 */
import Link from "next/link";
import { Siren } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { draftTechQuote } from "../../../lib/tech/stubs";
import { EmergencyBookForm } from "./EmergencyBookForm";

export default function TechEmergencyPage() {
  const quote = draftTechQuote({ jobClass: "roadside_emergency", emergency: true });
  const draftUsd = (Number(quote.draftAmountUsdMinor) / 100).toFixed(2);
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Siren className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
            Emergency
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            One-tap dispatch. Rate-card call-out draft only — we do not wait on
            diagnose or Gemini.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-xl px-4 py-12">
        <Card>
          <CardContent className="space-y-6 p-6">
            <div
              className="rounded-xl border border-primary/30 bg-primary/5 p-4"
              data-testid="emergency-rate-card-draft"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Call-out draft</p>
                  <p className="text-2xl font-bold text-primary">USD {draftUsd}</p>
                  <p className="text-xs text-muted-foreground">
                    Draft — confirmed on site. Source {quote.source}. AI pricing
                    bypassed.
                  </p>
                </div>
                <Badge variant="secondary">draft</Badge>
              </div>
            </div>
            <EmergencyBookForm />
            <Button asChild variant="outline" className="w-full">
              <Link href="/tech/checklist/emergency_roadside">
                Open emergency checklist
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
