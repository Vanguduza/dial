# Self-hosted maps (ENH-013 locally)

Planetiler produces a Zimbabwe extract; tileserver-gl serves it; Nominatim, OSRM
and VROOM sit beside the production-like stack.

```powershell
# 1. Build tiles (once; ~130 MB, gitignored)
pnpm maps:prepare

# 2. Boot with the maps overlay
pnpm stack:up --maps
```

`maps:prepare` downloads the Geofabrik Zimbabwe PBF (when network is available)
and runs Planetiler into `infra/maps/data/zimbabwe.mbtiles`. Until that file
exists, DialMap uses OpenFreeMap Liberty and a raster fallback so the GL map is
never a blank canvas.

Env (Pack §6 names):

- `MAP_TILES_STYLE_URL`
- `NOMINATIM_URL`
- `OSRM_URL`
- `VROOM_URL`

Health: `GET /api/health/integrations` maps probe (ops-only outside fixture).
