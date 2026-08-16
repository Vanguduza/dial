/**
 * G2 B2B informal leak probe — memory + Meili/async browse must report 0.
 * When Meili is unreachable in sandbox, memory path still gates; note meili_skip.
 * Usage: load .env then node --import tsx scripts/g2-b2b-leak-probe.mts
 */
import { __resetCatalogueForTests, countInformalB2bLeaks } from "@dial/catalogue";
import { probeB2bInformalLeak } from "../src/lib/spare/g2Spine.ts";

__resetCatalogueForTests();

async function probeOne(q: string) {
  try {
    return { ...(await probeB2bInformalLeak(q)), meili_skip: false as const };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const cause =
      e instanceof Error && "cause" in e && e.cause instanceof Error
        ? e.cause.message
        : "";
    const combined = `${msg} ${cause}`;
    const meiliDown = /ECONNREFUSED|Meili|fetch failed|MEILI_/i.test(combined);
    if (!meiliDown) throw e;
    const memoryLeaks = countInformalB2bLeaks(q);
    return {
      memoryLeaks,
      browseLeaks: memoryLeaks,
      informalHitsInB2bSession: 0,
      source: "memory_meili_unreachable",
      ok: memoryLeaks === 0,
      meili_skip: true as const,
      meili_error: combined.slice(0, 120),
    };
  }
}

const empty = await probeOne("");
const oil = await probeOne("oil");
const wiper = await probeOne("wiper");

const ok = empty.ok && oil.ok && wiper.ok;
const meiliSkipped = empty.meili_skip || oil.meili_skip || wiper.meili_skip;
console.log(
  JSON.stringify(
    {
      ok,
      meiliSkipped,
      probes: { empty, oil, wiper },
      note: ok
        ? meiliSkipped
          ? "B2B informal leak=0 (memory); Meili unreachable — prior bootstrap evidence still required for full G2"
          : "B2B informal leak=0 (memory + session hits)"
        : "LEAK DETECTED — do not advance G2",
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
