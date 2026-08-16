/**
 * Repair UTF-8 text that was written through a Windows-1252 round trip
 * (the "â€”" instead of "—" family of corruption) and strip stray BOMs.
 *
 *   node scripts/fix-text-encoding.mjs [--check] [paths...]
 *
 * Only runs of characters that decode back to valid UTF-8 are rewritten, so
 * correctly encoded text and genuine Latin-1 characters are left untouched.
 * `--check` exits non-zero when a tracked file still contains corruption,
 * which is what CI uses to keep documentation readable.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const CP1252_HIGH = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};

function toByte(codePoint) {
  if (codePoint < 0x100) return codePoint;
  return CP1252_HIGH[codePoint];
}

const decoder = new TextDecoder("utf-8", { fatal: true });

function repair(text) {
  let out = "";
  let run = [];

  const flush = () => {
    if (run.length === 0) return;
    const original = run.map((c) => String.fromCodePoint(c)).join("");
    if (run.length >= 2) {
      const bytes = Uint8Array.from(run.map(toByte));
      try {
        const decoded = decoder.decode(bytes);
        out += decoded;
        run = [];
        return;
      } catch {
        /* not a mojibake run — keep as written */
      }
    }
    out += original;
    run = [];
  };

  for (const char of text) {
    const code = char.codePointAt(0);
    if (code >= 0x80 && toByte(code) !== undefined) {
      run.push(code);
    } else {
      flush();
      out += char;
    }
  }
  flush();
  return out;
}

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const explicit = args.filter((a) => !a.startsWith("--"));
const files = explicit.length
  ? explicit
  : execSync("git ls-files", { encoding: "utf8" })
      .split(/\r?\n/)
      .filter((f) => /\.(md|ts|tsx|mts|mjs|js|json|yml|yaml|sql|kt|swift|example)$/.test(f));

const changed = [];
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const withoutBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const repaired = repair(withoutBom);
  if (repaired === text) continue;
  changed.push(file);
  if (!checkOnly) writeFileSync(file, repaired, "utf8");
}

if (changed.length === 0) {
  console.log(`clean (${files.length} files scanned)`);
  process.exit(0);
}

console.log(`${checkOnly ? "corrupted" : "repaired"}: ${changed.join(", ")}`);
process.exit(checkOnly ? 1 : 0);
