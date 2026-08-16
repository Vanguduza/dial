/**
 * Apply supabase/migrations/*.sql in order against DATABASE_URL.
 *
 * Replaces the Supabase CLI for migration work (BUG-041: no supabase CLI binary
 * ships for win32-x64), and works against any Postgres — the local stack or a
 * hosted Supabase project — so the same command promotes schema anywhere.
 *
 *   node scripts/db-migrate.mjs [--dry-run] [--url postgres://...]
 *
 * Applied files are recorded in dial_migrations with a checksum, so an edited
 * migration is reported rather than silently re-run.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(repoRoot, "supabase", "migrations");
const dryRun = process.argv.includes("--dry-run");

function loadEnvLocal() {
  const path = join(repoRoot, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

function resolveUrl() {
  const flagIndex = process.argv.indexOf("--url");
  if (flagIndex !== -1 && process.argv[flagIndex + 1]) {
    return process.argv[flagIndex + 1];
  }
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  loadEnvLocal();
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  if (process.env.POSTGRES_PASSWORD?.trim()) {
    const port = process.env.POSTGRES_HOST_PORT ?? "5432";
    return `postgres://postgres:${process.env.POSTGRES_PASSWORD}@127.0.0.1:${port}/postgres`;
  }
  return "";
}

/** Files are written by various tools; a BOM makes Postgres reject the first statement. */
function readSql(path) {
  const raw = readFileSync(path, "utf8");
  return raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
}

async function main() {
  const url = resolveUrl();
  if (!url) {
    console.error(
      "DATABASE_URL unset — run `pnpm secrets:local` and start the stack, or pass --url",
    );
    process.exit(1);
  }

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    await client.query(`
      create table if not exists dial_migrations (
        filename text primary key,
        checksum text not null,
        applied_at timestamptz not null default now()
      )
    `);

    const { rows } = await client.query(
      "select filename, checksum from dial_migrations",
    );
    const applied = new Map(rows.map((r) => [r.filename, r.checksum]));

    let appliedCount = 0;
    for (const file of files) {
      const sql = readSql(join(migrationsDir, file));
      const checksum = createHash("sha256").update(sql).digest("hex");
      const previous = applied.get(file);

      if (previous && previous === checksum) continue;
      if (previous && previous !== checksum) {
        console.warn(
          `${file}: already applied but contents changed — add a new migration instead of editing history`,
        );
        continue;
      }
      if (dryRun) {
        console.log(`would apply ${file}`);
        appliedCount += 1;
        continue;
      }

      process.stdout.write(`applying ${file} ... `);
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(
          "insert into dial_migrations (filename, checksum) values ($1, $2)",
          [file, checksum],
        );
        await client.query("commit");
        console.log("ok");
        appliedCount += 1;
      } catch (error) {
        await client.query("rollback");
        console.log("failed");
        throw error;
      }
    }

    console.log(
      appliedCount === 0
        ? `up to date (${files.length} migrations)`
        : `${appliedCount}/${files.length} migrations ${dryRun ? "pending" : "applied"}`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
