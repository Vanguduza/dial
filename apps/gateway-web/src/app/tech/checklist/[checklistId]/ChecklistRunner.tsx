"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";
import type { Checklist } from "../../../../lib/tech/stubs";

/** Interactive checklist runner — advances steps (§8.0.1 usable on narrow viewports). */
export function ChecklistRunner({ checklist }: { checklist: Checklist }) {
  const [step, setStep] = useState(0);
  const current = checklist.steps[step];
  const done = step >= checklist.steps.length;
  const progress = useMemo(
    () => `${Math.min(step + 1, checklist.steps.length)} / ${checklist.steps.length}`,
    [step, checklist.steps.length],
  );

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <Link href="/tech">Back</Link>
      <h1
        style={{
          fontFamily: `${dialTokens.font.display}, Georgia, serif`,
          color: dialTokens.color.brand.primary,
          fontSize: "clamp(1.5rem, 4vw, 2rem)",
        }}
      >
        {checklist.title}
      </h1>
      <p style={{ fontSize: 13, opacity: 0.65 }}>Step {progress}</p>
      {done ? (
        <p style={{ fontWeight: 600 }}>Checklist complete.</p>
      ) : (
        <>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.5 }}>{current}</p>
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            style={{
              marginTop: dialTokens.space.md,
              padding: `${dialTokens.space.sm} ${dialTokens.space.lg}`,
              borderRadius: 8,
              border: "none",
              background: dialTokens.color.brand.primary,
              color: "#fff",
              fontWeight: 600,
              width: "100%",
              maxWidth: 320,
              fontSize: 16,
            }}
          >
            Next
          </button>
        </>
      )}
    </div>
  );
}
