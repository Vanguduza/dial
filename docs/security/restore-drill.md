# Restore drill (T9 stub)

**Purpose:** Pack §15 T9 — document how to restore from backup without production secrets in git.

## Scope (stub)

1. Snapshot Postgres (ledger, outbox, identity) + object store (POD media) on a schedule.
2. Restore into a **non-prod** project; never overwrite live SoR without ops runbook sign-off.
3. Replay Temporal/BullMQ from last committed outbox watermark — do not invent money events.
4. Verify: `amountMinor` ledgers reconcile; webhook idempotency store intact; Meili reindex from approved catalogue only.

## Evidence for Build

- Eng Build: this stub + CI typecheck/test green.
- Customer-open: ops must complete a timed restore drill against staging and attach results to Appendix C.

## Related

- `docs/security/strix-runbook.md` — staging-only Strix
- `DIAL_Security_Toolchain.md` (D-48)
