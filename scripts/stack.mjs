/**
 * Boot or stop the DIAL production-like stack (docker-compose.prod.yml).
 *
 *   node scripts/stack.mjs up [--maps] [--no-build]
 *   node scripts/stack.mjs down [--volumes]
 *   node scripts/stack.mjs logs [service]
 *
 * Cross-platform on purpose: Windows, macOS and Linux run the same path, so a
 * host swap later changes nothing but where the images are deployed.
 * Idempotent — credentials already in .env.local are preserved.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const command = args[0] ?? "up";
const flags = new Set(args.filter((a) => a.startsWith("--")));

function run(bin, argv, options = {}) {
  const result = spawnSync(bin, argv, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`${bin} ${argv.join(" ")} exited with ${result.status}`);
  }
}

function capture(bin, argv) {
  const result = spawnSync(bin, argv, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  return result.stdout ?? "";
}

function composeArgs() {
  const files = ["-f", "docker-compose.prod.yml"];
  if (flags.has("--maps")) files.push("-f", "docker-compose.maps.yml");
  return ["compose", ...files, "--env-file", ".env.local"];
}

async function waitForHealthy(service, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  process.stdout.write(`waiting for ${service} `);
  for (;;) {
    const out = capture("docker", [...composeArgs(), "ps", "--format", "json", service]);
    if (/"Health"\s*:\s*"healthy"/.test(out)) {
      console.log("ok");
      return;
    }
    if (Date.now() > deadline) {
      console.log("timeout");
      throw new Error(`${service} did not become healthy`);
    }
    process.stdout.write(".");
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

async function up() {
  if (!existsSync(join(repoRoot, ".env.local"))) {
    console.log("no .env.local — generating local stack credentials");
    run(process.execPath, ["scripts/gen-local-secrets.mjs"]);
  }

  const upArgs = [...composeArgs(), "up", "-d"];
  if (!flags.has("--no-build")) upArgs.push("--build");
  run("docker", upArgs);

  await waitForHealthy("postgres", 180_000);

  console.log("applying migrations");
  run(process.execPath, ["scripts/db-migrate.mjs"]);

  console.log(
    [
      "",
      "Stack is up:",
      "  gateway      http://localhost:3000",
      "  liveness     http://localhost:3000/api/health/live",
      "  supabase api http://localhost:8000",
      "  meilisearch  http://localhost:7700",
      "  temporal ui  http://localhost:8080",
      flags.has("--maps") ? "  map tiles    http://localhost:8081" : "",
      "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

function down() {
  const argv = [...composeArgs(), "down"];
  if (flags.has("--volumes")) argv.push("--volumes");
  run("docker", argv);
}

function logs() {
  const service = args.find((a) => !a.startsWith("--") && a !== command);
  run("docker", [
    ...composeArgs(),
    "logs",
    "--tail",
    "200",
    ...(service ? [service] : []),
  ]);
}

const commands = { up, down, logs };
const handler = commands[command];
if (!handler) {
  console.error(`unknown command: ${command} (expected up | down | logs)`);
  process.exit(1);
}

Promise.resolve(handler()).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
