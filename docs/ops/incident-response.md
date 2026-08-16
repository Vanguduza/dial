# Incident response

1. **Detect** — `/api/health/live` failing, `/api/metrics` down, or an ops alert from `operational_alerts`.
2. **Contain** — fail closed: unset the vendor group or set `DIAL_INTEGRATION_MODE=sandbox` only on a non-prod host. Never disable webhook signature checks.
3. **Diagnose** — structured stdout (`logJson`) with `requestId`. Do not print `.env`.
4. **Recover** — restore from `scripts/backup-local.sh` per `docs/security/restore-drill.md` if the data plane is the fault.
5. **Review** — write the incident into `BUGS.md` in the same change that ships the fix.

Money paths: do not replay PSP webhooks without the idempotency store (`processed_events`). Simulated Command Centre never pays (D-54).
