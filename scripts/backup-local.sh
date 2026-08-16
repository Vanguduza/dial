#!/usr/bin/env bash
# pg_dump + Meili dump for the local production-like stack.
# Usage: bash scripts/backup-local.sh [outdir]
set -euo pipefail
out="${1:-backups/$(date -u +%Y%m%dT%H%M%SZ)}"
mkdir -p "$out"
if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL unset" >&2
  exit 1
fi
pg_dump --no-owner --format=custom "$DATABASE_URL" > "$out/postgres.dump"
if [ -n "${MEILI_HOST:-}" ] && [ -n "${MEILI_MASTER_KEY:-}" ]; then
  curl -fsS -X POST "$MEILI_HOST/dumps" -H "Authorization: Bearer $MEILI_MASTER_KEY" > "$out/meili-dump.json" || true
fi
echo "backup written to $out"
