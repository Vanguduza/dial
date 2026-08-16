/**
 * Data retention job — deletes expired audit/media metadata by policy.
 * Fixture: no-op. Sandbox/live: SQL via DATABASE_URL. Never prints row PII.
 */
import pg from "pg";

export async function runRetentionPass(env: NodeJS.ProcessEnv = process.env): Promise<{
  mode: string;
  deletedAudit: number;
}> {
  const mode = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (mode === "fixture" || !env.DATABASE_URL?.trim()) {
    return { mode: mode === "fixture" ? "fixture" : "skipped", deletedAudit: 0 };
  }
  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query(
      `delete from public.audit_events
       where created_at < now() - interval '400 days'
       returning 1`,
    );
    return { mode, deletedAudit: res.rowCount ?? 0 };
  } finally {
    await client.end();
  }
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` || process.argv[1]?.endsWith("retention-job.mjs")) {
  const out = await runRetentionPass();
  console.log(JSON.stringify(out));
}
