/**
 * PD44 grocery checkout — EcoCash | COD after CPA §7.5 disclosure review.
 * Food only; no liquor. USD cart; ZiG only at pay (D-57).
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dialTokens } from "@dial/design-tokens";
import { EIGHTEEN_ITEM_DISCLOSURES } from "@dial/adapter-whatsapp";
import { DisclosureReviewGate } from "../../../components/DisclosureReviewGate";

export function GroceryCheckoutForm({ cartId }: { cartId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pay(choice: "ecocash" | "cod") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/grocery/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cartId, choice }),
      });
      const json = (await res.json()) as {
        error?: string;
        groceryOrderId?: string;
        trackHref?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "checkout failed");
        return;
      }
      const href =
        json.trackHref ??
        (json.groceryOrderId
          ? `/grocery/track?orderId=${encodeURIComponent(json.groceryOrderId)}`
          : "/grocery/track");
      router.push(href);
    } catch (e) {
      setError(e instanceof Error ? e.message : "checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DisclosureReviewGate
      disclosures={EIGHTEEN_ITEM_DISCLOSURES}
      testId="grocery-cpa-disclosure-review"
    >
      <div style={{ display: "grid", gap: dialTokens.space.sm, maxWidth: 320 }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => void pay("ecocash")}
          style={{
            padding: `${dialTokens.space.sm} ${dialTokens.space.lg}`,
            borderRadius: 8,
            border: "none",
            background: dialTokens.color.brand.primary,
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          EcoCash
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void pay("cod")}
          style={{
            padding: `${dialTokens.space.sm} ${dialTokens.space.lg}`,
            borderRadius: 8,
            border: `1px solid ${dialTokens.color.brand.primary}`,
            background: "#fff",
            color: dialTokens.color.brand.ink,
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          Cash on delivery
        </button>
        {error ? <p style={{ color: "#a11", fontSize: 14 }}>{error}</p> : null}
      </div>
    </DisclosureReviewGate>
  );
}
