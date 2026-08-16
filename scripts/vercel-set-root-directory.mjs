/**
 * Point the linked Vercel project at apps/gateway-web while keeping the pnpm
 * workspace as the install root. Uses the Vercel CLI's own session; the token
 * is never printed.
 *
 *   node scripts/vercel-set-root-directory.mjs [rootDirectory]
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const rootDirectory = process.argv[2] ?? "apps/gateway-web";

const authPath = join(
  process.env.APPDATA ?? "",
  "com.vercel.cli",
  "Data",
  "auth.json",
);
const { token } = JSON.parse(readFileSync(authPath, "utf8"));
if (!token) throw new Error("no vercel cli session — run `vercel login`");

const { projectId, orgId } = JSON.parse(
  readFileSync(join(process.cwd(), ".vercel", "project.json"), "utf8"),
);

const res = await fetch(
  `https://api.vercel.com/v9/projects/${projectId}?teamId=${orgId}`,
  {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ rootDirectory }),
  },
);

if (!res.ok) {
  throw new Error(`vercel api ${res.status}: ${await res.text()}`);
}

const project = await res.json();
console.log(
  JSON.stringify(
    {
      name: project.name,
      rootDirectory: project.rootDirectory,
      framework: project.framework,
      installCommand: project.installCommand,
      buildCommand: project.buildCommand,
    },
    null,
    2,
  ),
);
