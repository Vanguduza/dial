/**
 * Admin delivery track stub — MapLibre SoR noted; live tiles Phase 0.
 * Job SoR remains @dial/delivery (D-44 / D-45).
 */
import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";

export default function AdminDeliveryTrackPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/home">Home</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Delivery live track
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          MapLibre + OSRM/VROOM stubs (D-44). Job SoR = <code>@dial/delivery</code> +{" "}
          <code>DeliveryDispatchWorkflow</code> — not Fleetbase, not Google/Mapbox.
        </p>
        <div
          role="img"
          aria-label="MapLibre map placeholder"
          style={{
            marginTop: dialTokens.space.lg,
            height: "min(50vh, 360px)",
            borderRadius: 12,
            background: `linear-gradient(135deg, ${dialTokens.color.brand.primary}33, ${dialTokens.color.brand.accent}44)`,
            display: "grid",
            placeItems: "center",
            fontSize: 14,
          }}
        >
          MapLibre canvas stub
        </div>
      </div>
    </main>
  );
}
