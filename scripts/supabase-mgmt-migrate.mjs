/**
 * Apply pending migrations via Supabase Management API (database/query)
 * or DATABASE_URL when available. Never prints secret values.
 */
import { readFileSync, existsSync } from "node:fs";
import { readFile as readFileCb, writeFile as writeFileCb } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "othvwjkqxamjboqoomtc";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const API = "https://api.supabase.com/v1";

const MIGRATIONS = [
  "supabase/migrations/0004_phase4_supplier_factory.sql",
  "supabase/migrations/0005_phase4_confirm_sla_coop.sql",
  "supabase/migrations/0006_phase8_wht_remittance.sql",
];

const VERIFY_TABLES = [
  "suppliers",
  "catalogue_ingest_batches",
  "supplier_confirm_orders",
  "supplier_coop_offers",
  "wht_remittance_batches",
];

function log(msg) {
  console.log(msg);
}

function stripBom(sql) {
  return sql.charCodeAt(0) === 0xfeff ? sql.slice(1) : sql;
}

async function mgmtFetch(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(120_000),
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  return { status: res.status, ok: res.ok, body };
}

async function trySetDatabaseUrlFromMgmt() {
  const endpoints = [
    `/projects/${PROJECT_REF}`,
    `/projects/${PROJECT_REF}/config/database`,
    `/projects/${PROJECT_REF}/config/database/postgres`,
  ];
  for (const ep of endpoints) {
    const { status, ok, body } = await mgmtFetch(ep);
    log(`mgmt_get path=${ep} status=${status}`);
    if (!ok || !body) continue;
    const host =
      body?.database?.host ||
      body?.db_host ||
      body?.host ||
      body?.connectionString ||
      body?.connection_string;
    const password =
      body?.database?.password ||
      body?.db_password ||
      body?.password ||
      body?.postgres_password;
    if (typeof host === "string" && host.includes("postgresql://")) {
      await writeDatabaseUrlToEnv(host);
      return "connection_string_from_api";
    }
    if (host && password && typeof host === "string" && typeof password === "string") {
      const url = `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(password)}@${host}:6543/postgres?sslmode=require`;
      await writeDatabaseUrlToEnv(url);
      return "built_from_host_password";
    }
  }
  return null;
}

async function writeDatabaseUrlToEnv(url) {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) {
    log("env_write=skipped_no_env_file");
    return;
  }
  const raw = await readFileCb(envPath, "utf8");
  const line = `DATABASE_URL=${url}`;
  const next = /^DATABASE_URL=/m.test(raw)
    ? raw.replace(/^DATABASE_URL=.*$/m, line)
    : `${raw.replace(/\s*$/, "")}\n${line}\n`;
  await writeFileCb(envPath, next, "utf8");
  log("env_write=DATABASE_URL_SET");
}

async function applyViaMgmtQuery(sql, label) {
  const { status, ok, body } = await mgmtFetch(
    `/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      body: JSON.stringify({ query: sql }),
    },
  );
  if (!ok) {
    const err =
      body?.message ||
      body?.error ||
      body?.hint ||
      (Array.isArray(body) ? "array_response" : "unknown");
    log(`apply_${label}=FAIL status=${status} error=${String(err).slice(0, 120)}`);
    return false;
  }
  log(`apply_${label}=OK status=${status}`);
  return true;
}

async function applyViaPg(dbUrl) {
  let pg;
  try {
    pg = await import("pg");
  } catch {
    log("pg_apply=FAIL reason=no_pg_package");
    return false;
  }
  const client = new pg.default.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    for (const rel of MIGRATIONS) {
      const path = join(root, rel);
      const sql = stripBom(readFileSync(path, "utf8"));
      await client.query(sql);
      log(`pg_applied=${rel.split("/").pop()}`);
    }
    log("pg_apply=OK");
    return true;
  } catch (e) {
    log(
      `pg_apply=FAIL message=${e instanceof Error ? e.message.slice(0, 120) : "unknown"}`,
    );
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

async function verifyTablesRest() {
  const url = (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  if (!url || !key) {
    log("verify_rest=skipped_no_url_or_key");
    return;
  }
  for (const table of VERIFY_TABLES) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(12_000),
      });
      log(`verify_${table}=HTTP_${res.status}`);
    } catch {
      log(`verify_${table}=ERROR`);
    }
  }
}

async function verifyTablesSql() {
  const q = `
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name = any(array[
        'suppliers','catalogue_ingest_batches','supplier_confirm_orders',
        'supplier_coop_offers','wht_remittance_batches'
      ])
    order by table_name;
  `;
  const { status, ok, body } = await mgmtFetch(
    `/projects/${PROJECT_REF}/database/query`,
    { method: "POST", body: JSON.stringify({ query: q }) },
  );
  if (!ok) {
    log(`verify_sql=FAIL status=${status}`);
    return;
  }
  const names = Array.isArray(body)
    ? body.map((r) => r.table_name).filter(Boolean)
    : [];
  log(`verify_sql=OK tables=${names.join(",") || "none"}`);
}

async function main() {
  log("supabase-mgmt-migrate start");
  log(`SUPABASE_ACCESS_TOKEN=${TOKEN ? "SET" : "MISSING"}`);
  log(`SUPABASE_PROJECT_REF=${PROJECT_REF}`);
  log(`DATABASE_URL=${process.env.DATABASE_URL?.trim() ? "SET" : "MISSING"}`);

  if (!TOKEN) {
    log("RESULT=blocked_no_token");
    process.exit(1);
  }

  let dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    const built = await trySetDatabaseUrlFromMgmt();
    if (built) {
      log(`DATABASE_URL_source=${built}`);
      // Re-read from .env without printing
      const envRaw = await readFileCb(join(root, ".env"), "utf8").catch(() => "");
      const m = envRaw.match(/^DATABASE_URL=(.+)$/m);
      dbUrl = m?.[1]?.trim();
      log(`DATABASE_URL=${dbUrl ? "SET" : "MISSING"}`);
    } else {
      log("DATABASE_URL_source=mgmt_get_no_password");
    }
  }

  let applied = false;
  if (dbUrl) {
    applied = await applyViaPg(dbUrl);
  }
  if (!applied) {
    log("fallback=mgmt_database_query");
    for (const rel of MIGRATIONS) {
      const path = join(root, rel);
      const label = rel.split("/").pop().replace(".sql", "");
      const sql = stripBom(readFileSync(path, "utf8"));
      const ok = await applyViaMgmtQuery(sql, label);
      if (!ok) {
        log("RESULT=apply_failed");
        process.exit(1);
      }
    }
    applied = true;
  }

  if (applied) {
    log("RESULT=applied_ok");
    await verifyTablesSql();
    await verifyTablesRest();
  } else {
    log("RESULT=apply_failed");
    process.exit(1);
  }
}

main().catch((e) => {
  log(`RESULT=fatal message=${e instanceof Error ? e.message.slice(0, 120) : "unknown"}`);
  process.exit(1);
});
