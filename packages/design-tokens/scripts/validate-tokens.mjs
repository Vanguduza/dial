import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(root, "tokens", "tokens.json"), "utf8");
const tokens = JSON.parse(raw);

if (!tokens?.color?.brand?.primary) {
  console.error("design-tokens: missing color.brand.primary");
  process.exit(1);
}

console.log("design-tokens: OK");
