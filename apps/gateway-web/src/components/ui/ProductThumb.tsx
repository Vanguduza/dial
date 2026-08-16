/**
 * Catalogue thumbnail. Suppliers do not ship photography yet, so we draw a
 * deterministic branded illustration from the offer id instead of leaving a
 * grey box — same id always renders the same tile.
 */
import { dialTokens } from "@dial/design-tokens";

export type ProductThumbKind = "part" | "grocery" | "service";

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const GLYPHS: Record<ProductThumbKind, string> = {
  // Cog: mechanical parts.
  part: "M50 34a16 16 0 1 0 0 32 16 16 0 0 0 0-32Zm0 8a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-4-24h8l1.6 8.3a26 26 0 0 1 6.2 2.6l7-4.7 5.6 5.6-4.7 7a26 26 0 0 1 2.6 6.2L80 46v8l-8.3 1.6a26 26 0 0 1-2.6 6.2l4.7 7-5.6 5.6-7-4.7a26 26 0 0 1-6.2 2.6L54 80h-8l-1.6-8.3a26 26 0 0 1-6.2-2.6l-7 4.7-5.6-5.6 4.7-7a26 26 0 0 1-2.6-6.2L20 54v-8l8.3-1.6a26 26 0 0 1 2.6-6.2l-4.7-7 5.6-5.6 7 4.7a26 26 0 0 1 6.2-2.6Z",
  // Basket: grocery.
  grocery: "M26 40h48l-5 34a6 6 0 0 1-6 5H37a6 6 0 0 1-6-5Zm12 0 6-18h12l6 18M42 52v18M58 52v18",
  // Wrench: services.
  service: "M66 22a16 16 0 0 0-15 21L26 68a6 6 0 0 0 8 8l25-25a16 16 0 0 0 21-15l-11 8-9-2-2-9Z",
};

export function ProductThumb({
  seed,
  kind = "part",
  label,
}: {
  seed: string;
  kind?: ProductThumbKind;
  label?: string;
}) {
  const h = hash(seed);
  const hue = h % 360;
  const tilt = (h % 12) - 6;
  const base = dialTokens.color.brand.primary;
  const accent = dialTokens.color.brand.accent;
  const gradientId = `thumb-${(h % 100000).toString(36)}`;

  return (
    <svg
      viewBox="0 0 100 75"
      role="img"
      aria-label={label ? `${label} illustration` : "Catalogue illustration"}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsl(${hue} 26% 94%)`} />
          <stop offset="100%" stopColor={`hsl(${(hue + 40) % 360} 22% 86%)`} />
        </linearGradient>
      </defs>
      <rect width="100" height="75" fill={`url(#${gradientId})`} />
      <circle cx="82" cy="12" r="18" fill={accent} opacity="0.16" />
      <g transform={`translate(0 -12) rotate(${tilt} 50 50) scale(0.78) translate(14 12)`}>
        <path
          d={GLYPHS[kind]}
          fill={kind === "part" ? base : "none"}
          stroke={base}
          strokeWidth={kind === "part" ? 0 : 5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.72"
        />
      </g>
    </svg>
  );
}
