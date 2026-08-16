# Phase 12 eng hardening + dogfood checklist (not G12 / not S99)

**Status:** Eng prep checklist linking existing runbooks. **Eng never marks S99 / customer-open** — Appendix C + v4 §8.1 Gate 3 remain **human only**.

**Dependencies:** G1–G11 green before eng G12 exit. This doc is prep only.

## Security / AppSec (D-47 / D-48)

- [ ] Appendix A.1 IDOR + webhook AC on real routes (`dial-rls-idor-audit` / Pack T9)
- [ ] Semgrep CE (`semgrep-dial`) hard-fail green
- [ ] Checkov HIGH/CRITICAL hard-fail green
- [ ] Strix **staging only** when authorized — `docs/security/strix-runbook.md` (never prod)

## Resilience / ops

- [ ] Restore drill — `docs/security/restore-drill.md` (or equiv)
- [ ] Degradation paths (§6.22) documented for Auth/Meili/PSP/WA/maps
- [ ] Incident runbooks current
- [ ] Retention job + Resend/Brevo consent paths fail-closed or sandbox

## Dogfood cohort (sandbox or prod-like — not fixture)

- [ ] Spare web EcoCash + COD (G2 evidence)
- [ ] Tech book + checklist evidence (G6)
- [ ] Grocery **food** order → delivery POD (G10; liquor absent)
- [ ] WA Flow pay on test MSISDN when ENH-021 filled (G9)
- [ ] Desktop + mobile usable (§8.0.1)

## §5.16 / store listings

- [ ] Experience enhancers live **or** founder dormancy sign-off (not silent stub-as-done)
- [ ] Public store listings prepared — not claimed until G12-H

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
