import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { NextConfig } from "next";

const monorepoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

const dialPackages = [
  "@dial/adapter-fdms",
  "@dial/adapter-maps",
  "@dial/adapter-psp",
  "@dial/adapter-whatsapp",
  "@dial/ai",
  "@dial/catalogue",
  "@dial/delivery",
  "@dial/design-tokens",
  "@dial/identity",
  "@dial/jobs",
  "@dial/ledger",
  "@dial/payments",
  "@dial/promotions",
  "@dial/queues",
  "@dial/shared",
  "@dial/suppliers",
  "@dial/tax",
];

// Vercel produces its own server output; standalone is only for the container image.
const standalone = process.env.DIAL_BUILD_STANDALONE === "1";

const nextConfig: NextConfig = {
  transpilePackages: dialPackages,
  ...(standalone ? { output: "standalone" as const } : {}),
  outputFileTracingRoot: monorepoRoot,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  webpack: (config) => {
    // Workspace packages use TS ESM `.js` import specifiers → resolve to `.ts`.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
