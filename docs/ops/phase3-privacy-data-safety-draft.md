# Phase 3 — Privacy & data-safety draft (internal track; not G3)

**Status:** Ops/legal draft outline for Play Console + App Store Connect.  
**Not G3** — legal text and published URLs are founder/ops; eng provides field inventory only.

**Locks:** D-47 (session cookie AuthN; no body `userId`/role); D-57 (USD browse; payment metadata at checkout).

## Vault / ops names (no secrets in git)

| Artifact | Vault name (example) | In-repo |
| --- | --- | --- |
| Privacy policy URL (staging) | `DIAL_PRIVACY_POLICY_URL` | placeholder only |
| Privacy policy URL (production) | ops publishes before public listing | never invent |
| Data-safety / App Privacy answers | ops spreadsheet in vault | field list below |
| Crash / analytics sink | `DIAL_CRASH_REPORTING_DSN` (when chosen) | wire when keys present |

## Data collected (inventory for forms)

| Category | Collected | Purpose | Shared with |
| --- | --- | --- | --- |
| Account email | yes | AuthN (GoTrue + gateway session cookie) | DIAL gateway only |
| Order / cart metadata | yes | Spare checkout, returns, garage | DIAL ERP; PSP rails at pay (EcoCash\|COD) |
| Payment choice + intent refs | yes | Job Reserve / ledger settle | PSP adapters (sandbox/live per env) |
| Vehicle garage (label, chassis hint) | optional | Reminder consent (Pack §9.2) | DIAL ERP only |
| Promo / referral codes | optional | Draft discount validation (D-42; no cash-out) | DIAL ERP only |
| Location | no (MVP Spare path) | — | — |
| Contacts / photos | no | — | — |

## Security practices (draft bullets for ops)

- HTTPS to gateway in staging/production builds (`DIAL_GATEWAY_BASE_URL` / flavors).
- Session SoR = `dial_session` HttpOnly cookie — never client-trusted `userId`/role in API bodies (D-47).
- No `NEXT_PUBLIC_` / client bundle on service_role, PSP, or WA tokens.
- Crash reporting: ops chooses sink; keys plug in with zero further coding when present.

## Play / App Store checklist (ops)

- [ ] Privacy policy URL live and linked from store listing draft (`docs/ops/phase3-store-listing-drafts.md`)
- [ ] Data-safety form matches inventory above (adjust if ops adds analytics)
- [ ] Account deletion path documented (gateway account routes when ops enables)
- [ ] Children / age rating aligned with Spare + grocery (no liquor Build)

## Related

- `docs/ops/phase3-native-store-readiness.md`
- `docs/ops/phase3-store-listing-drafts.md`
- `docs/ops/evidence/g3/NOTES.md`
