"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Siren } from "lucide-react";

import { Button } from "@/components/ui/button";

/** PD13 emergency book — AI pricing bypassed; never waits on guidedIntake. */
export function EmergencyBookForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestEmergency() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tech/services", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "emergency_book" }),
      });
      const json = (await res.json()) as {
        error?: string;
        job?: { id: string };
        aiPricingBypassed?: boolean;
        guidedIntakeGated?: boolean;
      };
      if (res.status === 401) {
        router.push("/?next=/tech/emergency");
        return;
      }
      if (!res.ok) {
        setError(json.error ?? "emergency book failed");
        return;
      }
      router.push(json.job?.id ? `/tech/jobs/${json.job.id}` : "/tech/jobs");
    } catch (e) {
      setError(e instanceof Error ? e.message : "emergency book failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="destructive"
        className="w-full"
        size="lg"
        disabled={busy}
        data-testid="emergency-dispatch"
        onClick={() => void requestEmergency()}
      >
        <Siren className="mr-2 h-4 w-4" />
        {busy ? "Requesting…" : "Request emergency dispatch"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
