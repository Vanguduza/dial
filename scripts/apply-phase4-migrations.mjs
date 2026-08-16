/**
 * Apply Phase 4/8 prep SQL migrations when DATABASE_URL is set.
 * Never prints secret values — status codes / SET|MISSING only.
 * Does not claim G4/G8. Usage: node --env-file=.env scripts/apply-phase4-migrations.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function present(name) {
  const v = process.env[name];
  return Boolean(v && String(v).trim());
}

function statusLine(name) {
  return `${name}=${present(name) ? "SET" : "MISSING"}`;
}

const files = [
  "supabase/migrations/0004_phase4_supplier_factory.sql",
  "supabase/migrations/0005_phase4_confirm_sla_coop.sql",
  "supabase/migrations/0006_phase8_wht_remittance.sql",
];

console.log("phase4-8-migration-probe");
console.log(statusLine("DATABASE_URL"));
console.log(statusLine("SUPABASE_URL"));
console.log(statusLine("NEXT_PUBLIC_SUPABASE_URL"));
console.log(statusLine("SUPABASE_SERVICE_ROLE_KEY"));
console.log(statusLine("SUPABASE_ACCESS_TOKEN"));

const dbUrl = process.env.DATABASE_URL?.trim();
if (!dbUrl) {
  console.log(
    "RESULT=blocked_no_DATABASE_URL — REST cannot run DDL; founder: set DATABASE_URL or apply SQL in Supabase SQL editor",
  );
  // Optional REST table probe (no secret print)
  const url = (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    "";
  if (url && key) {
    for (const table of [
      "suppliers",
      "supplier_confirm_orders",
      "supplier_coop_offers",
      "wht_remittance_batches",
    ]) {
      try {
        const res = await fetch(
          `${url}/rest/v1/${table}?select=*&limit=0`,
          {
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
            },
            signal: AbortSignal.timeout(12_000),
          },
        );
        console.log(`rest_probe_${table}=HTTP_${res.status}`);
      } catch {
        console.log(`rest_probe_${table}=ERROR`);
      }
    }
  } else {
    console.log("rest_probe=skipped_no_url_or_key");
  }
  // Hard exit — avoid Windows libuv UV_HANDLE_CLOSING abort after undici keep-alive.
  process.exit(0);
}

let pg;
try {
  pg = await import("pg");
} catch {
  console.log("RESULT=blocked_no_pg_package — pnpm add -Dw pg OR apply SQL in dashboard");
  process.exit(1);
}

const client = new pg.default.Client({ connectionString: dbUrl });
try {
  await client.connect();
  for (const rel of files) {
    const path = join(root, rel);
    if (!existsSync(path)) {
      console.log(`skip_missing=${rel}`);
      continue;
    }
    const sql = readFileSync(path, "utf8");
    await client.query(sql);
    console.log(`applied=${rel}`);
  }
  console.log("RESULT=applied_ok");
} catch (e) {
  console.log(
    `RESULT=apply_error message=${e instanceof Error ? e.message.slice(0, 160) : "unknown"}`,
  );
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
