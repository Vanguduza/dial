"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dialTokens } from "@dial/design-tokens";

export function GrocerySlotForm({
  cartId,
  slots,
  selected,
}: {
  cartId: string;
  slots: Array<{ slotId: string; windowLabel: string; coldChainNotes: string }>;
  selected: string;
}) {
  const router = useRouter();
  const [slotId, setSlotId] = useState(selected || slots[0]?.slotId || "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = slots.find((s) => s.slotId === slotId);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/grocery/slot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cartId, slotId }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "slot failed");
        return;
      }
      router.push("/grocery/checkout");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "slot failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label style={{ display: "block", fontSize: 14 }}>
        Window
        <select
          value={slotId}
          onChange={(e) => setSlotId(e.target.value)}
          style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
        >
          {slots.map((s) => (
            <option key={s.slotId} value={s.slotId}>
              {s.windowLabel}
            </option>
          ))}
        </select>
      </label>
      {current ? (
        <p style={{ fontSize: 13, opacity: 0.75 }}>{current.coldChainNotes}</p>
      ) : null}
      <p style={{ fontSize: 12, opacity: 0.55 }}>liquorAllowed: false</p>
      <button
        type="button"
        disabled={busy || !slotId}
        onClick={() => void save()}
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
        }}
      >
        {busy ? "Saving…" : "Continue to checkout"}
      </button>
      {error ? <p style={{ color: "#a11", fontSize: 14 }}>{error}</p> : null}
    </div>
  );
}
