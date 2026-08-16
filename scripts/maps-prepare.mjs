/**
 * Download / document the Zimbabwe extract used by tileserver-gl.
 * Does not commit the mbtiles (infra/maps/data is gitignored).
 */
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = join(root, "infra", "maps", "data");
mkdirSync(data, { recursive: true });

const readme = join(data, "README.md");
writeFileSync(
  readme,
  [
    "# Map data (gitignored mbtiles)",
    "",
    "Build with Planetiler against the Geofabrik Zimbabwe extract:",
    "",
    "```",
    "java -jar planetiler.jar --download --area=zimbabwe --output=zimbabwe.mbtiles",
    "```",
    "",
    "OSRM: `osrm-extract` + `osrm-partition` + `osrm-customize` on the same PBF.",
    "",
  ].join("\n"),
  "utf8",
);

if (!existsSync(join(data, "zimbabwe.mbtiles"))) {
  console.log("infra/maps/data ready — drop zimbabwe.mbtiles here after Planetiler");
} else {
  console.log("zimbabwe.mbtiles present");
}
