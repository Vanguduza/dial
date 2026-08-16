import type { CSSProperties, ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { cssVariables } from "@dial/design-tokens";
import "./globals.css";

export const metadata: Metadata = {
  title: "DIAL",
  description: "Find it. Buy it. Get it done.",
};

/** Blueprint §8.0.1 — mobile-usable viewport. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const body = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

// Token values stay the SoR for brand; next/font supplies the actual faces.
const vars = {
  ...cssVariables(),
  ["--dial-font-display"]: display.style.fontFamily,
  ["--dial-font-body"]: body.style.fontFamily,
} as CSSProperties;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={vars}>{children}</body>
    </html>
  );
}
