/**
 * PD43/PD44 — CPA §7.5 eighteen-item disclosure + review-before-pay gate.
 * Pay CTAs stay hidden until the shopper acknowledges the review step.
 */
"use client";

import { useState, type ReactNode } from "react";
import { dialTokens } from "@dial/design-tokens";

export function DisclosureReviewGate({
  disclosures,
  children,
  testId = "cpa-disclosure-review",
}: {
  disclosures: readonly string[];
  children: ReactNode;
  testId?: string;
}) {
  const [reviewed, setReviewed] = useState(false);

  return (
    <section data-testid={testId} style={{ marginTop: dialTokens.space.md }}>
      <h2 style={{ fontSize: "1.05rem", marginBottom: 8 }}>
        Review disclosures before pay
      </h2>
      <p style={{ fontSize: 13, opacity: 0.75, marginTop: 0 }}>
        CPA §7.5 electronic disclosure — correct the cart or withdraw before
        confirming. Payable amounts are never AI-written.
      </p>
      <ol
        data-testid="cpa-disclosure-list"
        style={{
          fontSize: 12,
          lineHeight: 1.45,
          maxHeight: 220,
          overflow: "auto",
          paddingLeft: 20,
          border: `1px solid ${dialTokens.color.brand.primary}33`,
          borderRadius: 8,
          background: "#fff",
        }}
      >
        {disclosures.map((d) => (
          <li key={d.slice(0, 24)} style={{ marginBottom: 4 }}>
            {d}
          </li>
        ))}
      </ol>
      <label
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          marginTop: 12,
          fontSize: 14,
        }}
      >
        <input
          type="checkbox"
          checked={reviewed}
          data-testid="cpa-review-ack"
          onChange={(e) => setReviewed(e.target.checked)}
        />
        <span>
          I have reviewed the transaction details and disclosures. I may correct
          mistakes or withdraw before paying.
        </span>
      </label>
      {reviewed ? (
        <div data-testid="cpa-pay-unlocked" style={{ marginTop: 12 }}>
          {children}
        </div>
      ) : (
        <p
          data-testid="cpa-pay-locked"
          style={{ fontSize: 13, opacity: 0.65, marginTop: 12 }}
        >
          Acknowledge the review step to unlock EcoCash | COD.
        </p>
      )}
    </section>
  );
}
