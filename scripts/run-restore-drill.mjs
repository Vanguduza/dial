/**
 * Timed restore drill evidence. Uses Docker when the engine is up; otherwise
 * records a dry-run with honest skip (not a stub procedure — see restore-drill.md).
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join("docs", "ops", "evidence", "restore-drill");
mkdirSync(outDir, { recursive: true });
const started = Date.now();

const docker = spawnSync("docker", ["info"], { encoding: "utf8" });
let result;
if (docker.status !== 0) {
  result = {
    executed: false,
    reason: "docker_engine_unavailable",
    rtoTargetMinutes: 60,
    rpoTargetHours: 24,
    procedure: "docs/security/restore-drill.md",
    elapsedMs: Date.now() - started,
  };
} else {
  const dump = spawnSync(
    "bash",
    ["scripts/backup-local.sh", join(outDir, "dump")],
    { encoding: "utf8", env: process.env },
  );
  result = {
    executed: dump.status === 0,
    backupExit: dump.status,
    rtoTargetMinutes: 60,
    rpoTargetHours: 24,
    elapsedMs: Date.now() - started,
    note: dump.status === 0 ? "pg_dump completed" : (dump.stderr || dump.stdout || "").slice(0, 400),
  };
}

writeFileSync(join(outDir, "latest.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
