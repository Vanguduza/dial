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
  "@dial/worker-temporal",
];

const nextConfig: NextConfig = {
  transpilePackages: dialPackages,
  // Container image ships .next/standalone; tracing must span the pnpm workspace.
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
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
