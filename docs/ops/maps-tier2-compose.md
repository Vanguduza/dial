# Maps Tier-2 compose stubs (ENH-013 prep — not G5)

**Intent:** Document Nominatim / OSRM / VROOM URL wiring for Pack §6 so ops hosting plugs in with **zero further coding**. Self-hosted images are **ops-owned**; this file does not ship production map tiles.

**SoR:** MapLibre clients + Nominatim/OSRM/VROOM — **never** Google/Mapbox as distance/ETA SoR (D-44).

## Env (names only)

| Variable | Role |
| --- | --- |
| `NOMINATIM_URL` | Geocode + reverse (`adapters/maps`) |
| `OSRM_URL` | Route / ETA |
| `VROOM_URL` | Multi-stop optimise (optional at call time) |
| `MAP_TILES_STYLE_URL` | MapLibre style JSON |
| `MAP_OFFLINE_PACK_BASE_URL` | Courier offline MBTiles + style paths |

Sandbox fail-closed without URLs outside fixture — see `pingMapsHealth`.

## Suggested local profile (ops fills images/hosts)

Not enabled by default in root `docker-compose.yml` (heavy). Example ops compose fragment:

```yaml
# ops-only example — do not treat as G5 evidence until health + ETA dogfood
services:
  nominatim:
    # image: mediagis/nominatim (or contracted equivalent)
    ports: ["8088:8080"]
  osrm:
    # image: osrm/osrm-backend after data extract
    ports: ["5000:5000"]
  vroom:
    # image: vroomvrp/vroom-docker
    ports: ["3000:3000"]
```

Then:

```text
NOMINATIM_URL=http://127.0.0.1:8088
OSRM_URL=http://127.0.0.1:5000
VROOM_URL=http://127.0.0.1:3000
```

## Local eng attempt (2026-08-16)

Nominatim/OSRM/VROOM are **not** in default `docker-compose.yml` (multi-GB extracts + long first boot). Eng probe `g5-maps-tier2-probe.mts` with sandbox mode + unset URLs → `healthOk: false` (fail-closed) — evidence `docs/ops/evidence/g5/g5-maps-tier2-probe.json`. **ENH-013 remains ops-owned** until ops stands Tier-2 hosts and sets Pack §6 URLs; plugging URLs requires zero further coding (`adapters/maps`).

## Explicit non-claims

- ENH-013 hosting remains human/ops
- Fixture geocode/route in CI ≠ Phase 5 maps quality exit
- No Google/Mapbox keys as SoR

## Related

- `adapters/maps/src/index.ts`
- `docs/ops/phase5-delivery-temporal-dogfood.md`
