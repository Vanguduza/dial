/**
 * Promptfoo fixture provider — guidedIntake JSON only (no LLM, no money).
 */
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const indexTs = join(dirname(fileURLToPath(import.meta.url)), "../../src/index.ts");

function customerTextFrom(prompt, context) {
  const fromVars = context?.vars?.customerText;
  if (fromVars) return String(fromVars);
  const raw = String(prompt ?? "");
  const m = raw.match(/Customer text:\s*(.+?)(?:\n|$)/i);
  return (m?.[1] ?? "Car won't start").trim();
}

/** Promptfoo provider entry */
export async function callApi(prompt, context) {
  const { guidedIntake } = await import(pathToFileURL(indexTs).href);
  const assessment = guidedIntake({
    customerText: customerTextFrom(prompt, context),
  });
  return { output: JSON.stringify(assessment) };
}
