# Phase 12 eng hardening + dogfood checklist (not G12 / not S99)

**Status:** Eng prep checklist linking existing runbooks. **Eng never marks S99 / customer-open** — Appendix C + v4 §8.1 Gate 3 remain **human only**.

**Dependencies:** G1–G11 green before eng G12 exit. This doc is prep only. G3/G5/G6/G9/G10 still open — do not claim G12.

## Security / AppSec (D-47 / D-48)

- [x] Appendix A.1 IDOR on spare orders + grocery track/garage/returns/slot (`idor.routes.test.ts`) — object-level `assertResourceAccess`
- [x] Webhook verify-then-idempotency on Paynow (`verifyWebhook` + `claimProcessedEventDurable`)
- [ ] Semgrep CE (`semgrep-dial`) hard-fail green — CI job; re-run on this branch after push
- [ ] Checkov HIGH/CRITICAL hard-fail green — CI job
- [ ] Strix **staging only** when authorized — `docs/security/strix-runbook.md` (never prod)

## Resilience / ops

- [ ] Restore drill executed against local compose — `docs/security/restore-drill.md` (latest evidence may still be `docker_engine_unavailable`)
- [x] Degradation paths (§6.22) — `docs/ops/degradation.md` (Auth/Meili/PSP/WA/maps)
- [x] Incident runbooks — `docs/ops/incident-response.md`
- [x] Retention job + Resend/Brevo consent paths fail-closed or sandbox (`scripts/retention-job.mjs` + experience stubs)

## Dogfood cohort (sandbox or prod-like — not fixture)

- [x] Spare web EcoCash + COD (G2 eng-exception evidence)
- [ ] Tech book + checklist evidence on **device** (G6 HTTP green; PNG open)
- [x] Grocery **food** order → delivery POD spine (G10 web; `g10Claimed=false` maps residual)
- [ ] WA Flow pay on test MSISDN when ENH-021 filled (G9)
- [x] Desktop + mobile usable for in-repo web dogfood (§8.0.1) — G7/G10 PNGs

## §5.16 / store listings

- [x] Experience enhancers **honestly dormant/fail-closed** pending founder sign-off — `docs/ops/phase12-s516-dormancy.md` (not silent stub-as-done)
- [x] Public store listings **drafted** — `docs/ops/phase3-store-listing-drafts.md` — not claimed until G12-H

## Human gate (never eng auto)

| Gate | Owner |
| --- | --- |
| **G12-H / S99** | Founder/ops Appendix C bold + §8.1 Gate 3 |

## Related dogfood

- `docs/ops/phase1-sandbox-dogfood.md`
- `docs/ops/phase2-spare-sandbox-dogfood.md`
- `docs/ops/phase3-native-store-readiness.md`
- `docs/ops/phase5-delivery-temporal-dogfood.md`
- `docs/ops/phase10-grocery-food-e2e-prep.md`
- Evidence: `docs/ops/evidence/g12/g12-hardening-prep.json` (`g12Claimed=false`)
