import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { dialTokens } from "@dial/design-tokens";

export const metadata: Metadata = {
  title: "DIAL",
  description: "Find it. Buy it. Get it done.",
};

const vars = {
  ["--dial-color-brand-primary"]: dialTokens.color.brand.primary,
  ["--dial-color-brand-accent"]: dialTokens.color.brand.accent,
  ["--dial-color-brand-surface"]: dialTokens.color.brand.surface,
  ["--dial-color-brand-ink"]: dialTokens.color.brand.ink,
} as CSSProperties;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, ...vars }}>{children}</body>
    </html>
  );
}
