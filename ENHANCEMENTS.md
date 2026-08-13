# Enhancements

Planned and accepted **engineering / process** enhancements for DIAL. This is a living backlog — not a second product SoR and **not** a place to reopen locks (C-5, D-38…D-61).

**Maintenance:** update in the same PR that accepts, starts, or completes an item (Blueprint §8.0.2). Dev Manager keeps the queue honest.

**Status values:** `proposed` · `accepted` · `in_progress` · `done` · `deferred` · `rejected`

---

## Accepted / in flight

| ID | Enhancement | Status | Notes |
| --- | --- | --- | --- |
| ENH-001 | **Ticket hygiene → first thin vertical** (E2a preferred or E1a) with DoD + owner before parallel trains | `done` | E2a = [#1](https://github.com/Vanguduza/dial/issues/1); S10 green → auto S11 |
| ENH-006 | **Autonomous Dev Manager loop** — prefer/lock defaults; no founder wait; escalate only true OPENs; **stage auto-advance on green** through S90 | `done` | Runbook + workplan STATE — S90 eng complete 2026-08-13; S99 still human |
| ENH-030 | **API key-drop-in adapters** — Pack/Stitch HTTP shapes + fixture/sandbox/live mode; per-vendor webhooks | `done` | S91 — `docs/integrations/README.md` |
| ENH-031 | **Local compose + Temporal worker host** — Redis/Meili/Temporal; in-process DeliveryDispatchWorkflow | `done` | S92 — `docker-compose.yml` + `@dial/worker-temporal` |
| ENH-032 | **Supabase Auth + search-indexer** — GoTrue client scaffold; Meili outbox consumer | `done` | S93 — fixture CI; sandbox needs Redis/Meili/Supabase env |
| ENH-033 | **BullMQ + Temporal client** — queue host + DeliveryDispatch start path | `done` | S94 — `@dial/queues` + `@temporalio/client` |
| ENH-034 | **FDMS outbox drain + Supabase session bridge** | `done` | S95 — tax drain + sign-in password path |
| ENH-035 | **Promptfoo CI smoke + FDMS day workers** | `done` | S96 — `eval:smoke`; open/close day via Gateway |
| ENH-036 | **FDMS day BullMQ + admin API** | `done` | S97 — `QUEUE_FDMS_DAY` + `/api/admin/fdms/day` |
| ENH-037 | **Queue worker host + health expand** | `done` | S98 — `@dial/worker-queues`; health queues/fiscalDay |
| ENH-038 | **LiteLLM ping + Meili bootstrap** | `done` | S100 — health litellm + `pnpm bootstrap:search` |
| ENH-039 | **Temporal SDK worker + shared webhook idempotency** | `done` | S101 — `@temporalio/worker` path + `claimProcessedEvent` |
| ENH-040 | **WA/PSP shared idempotency + durable processed_events** | `done` | S102 — admit→shared; Supabase REST claim path |
| ENH-041 | **Maps distance fixture bridge + shared webhook smoke** | `done` | S103 — delivery→adapter-maps; gateway smoke |
| ENH-042 | **ContiPay/EcoCash fixtures + COD USD settle evidence** | `done` | S104 — adapter-psp tests |
| ENH-043 | **Paynow redirect + escrow hold/release stubs** | `done` | S105 — ConfirmPayment fixture + instructRelease |
| ENH-044 | **Meta WA template registry + Cloud send** | `done` | S106 — `WA_TEMPLATE_*` env override + fixture send |
| ENH-045 | **FDMS submitReceipt shape + day queue drain** | `done` | S107 — agency classes + queue→process |
| ENH-046 | **PayPal Orders fixture + escrow capture webhook** | `done` | S108 — checkoutnow + escrow.capture→paid |
| ENH-047 | **VROOM plan + maps ETA on delivery jobs** | `done` | S109 — planDeliveryWithVroom + createDeliveryJobWithMaps |
| ENH-048 | **B2B informal leak=0 + search health** | `done` | S110 — countInformalB2bLeaks + integrations.search |
| ENH-049 | **Chatwoot handoff id contract + support ticket** | `done` | S111 — erpTicketId/inbox/contact + FLOW_SUPPORT_TICKET |
| ENH-050 | **Consent audit + referral promo_credit only** | `done` | S112 — listConsentAudit + assertReferralRewardNonCash |
| ENH-051 | **Returns claim ERP stub refund_or_replace** | `done` | S113 — ReturnClaim + resolveReturnClaim (no AI money) |
| ENH-052 | **Money outbox drain → fiscal side-effects** | `done` | S114 — drainMoneyOutbox links FiscalReceiptQueued |
| ENH-002 | **Responsive web UX DoD** on all Next.js tickets (desktop + mobile, shared design-tokens, cross-viewport QA) | `accepted` | Blueprint §8.0.1; wire into ticket templates as web apps land |
| ENH-003 | **Living root docs** auto-maintained in every meaningful PR | `accepted` | `README` / `CHANGELOG` / `ENHANCEMENTS` / `BUGS` — §8.0.2 |
| ENH-004 | **Production AI multi-step** via `packages/ai` capabilities + LiteLLM→Gemini + Temporal/BullMQ (no prod agent host/adapter) | `accepted` | **D-61** — capability pipeline only; grill + `dial-ai-capability-review` before scaffold; no peer AI kernel |
| ENH-005 | **Development Prime** mandatory Build **harness** (`prime-agent`, MIT) — install before workspace bootstrap; hosts Dev Manager | `in_progress` | **D-61** — injected: `.prime/agent/` Auto + `/dev-manager` sync + workplan idle ban; Windows `scripts/start-dial-dev-manager-prime.ps1`; Cursor bridge Auto; **Windows handshake patch** `scripts/patch-prime-agent-windows-handshake.mjs` (WMIC start-id; #748/#1077); **reject** prod Prime adapter / alternate frameworks |

---

## Proposed (Plan residuals — process / Build quality)

| ID | Enhancement | Status | Notes |
| --- | --- | --- | --- |
| ENH-010 | **Machine-strict DoD / PR gates** — CI or bot checks that tracer matrix evidence cells and feature DoD are not blank on merge of epic PRs | `proposed` | Complements D-52 human + `dial-tracer-slice`; does not replace human sign-off |
| ENH-011 | **Playwright / `dial-webapp-recon` viewport matrix** (desktop + mobile) in CI or staging smoke | `proposed` | Blocked on staging URL; patterns only until then |
| ENH-012 | **KMP `packages/mobile-shared`** for non-UI shared logic (Blueprint I-1) | `proposed` | Does **not** reopen C-5; no CMP customer UI |
| ENH-013 | Self-hosted **Nominatim / OSRM / VROOM** Tier-2 siblings (Blueprint I-2 / D-44) | `proposed` | After maps/delivery spine scaffolds |

---

## Phase 0 commercial / ops tracks (parallel — not eng substitutes)

Track here so Build does not forget them; they **block customer-open**, not T0 scaffolding. Detail: Pack §4, Appendix C / Blueprint §8.1.

| ID | Track | Status | Notes |
| --- | --- | --- | --- |
| ENH-020 | PSP escrow partner contract (Paynow-first ask per D-60 / C-4) | `proposed` | Ops / legal |
| ENH-021 | Meta WABA + approved template IDs | `proposed` | Ops launch gate (D-60) |
| ENH-022 | ZIMRA virtual FDMS / Gateway credentials | `proposed` | D-59 in-house Gateway default |
| ENH-023 | POTRAZ / cross-border AI transfer authorisation where required | `proposed` | Parallel to live photo→foreign model |

---

## Done

| ID | Enhancement | Completed | Notes |
| --- | --- | --- | --- |
| ENH-000 | T0 monorepo foundation (pnpm/turbo/CI, gateway shell, design-tokens, shared money types, promotions package wire-up) | 2026-08-11 | See `CHANGELOG.md` |

---

## Rejected (do not revive without new D-log)

| ID | Idea | Why rejected |
| --- | --- | --- |
| — | Expo/RN customer shell | C-5 |
| — | Marketplace-wide principal / DIAL-owned stock | D-49 / D-58 |
| — | Baileys / unofficial WhatsApp | D-40 |
| — | Google/Mapbox as map/distance SoR | D-44 |
| — | AI writing payable amounts | v4 §4.1 / non-negotiables |
| — | Peer `dial-ai-kernel` / Kernel self-host / S24 local-first inference / Prime as prod or parallel Factory SoR / prod agent adapter or alternate prod agent framework | D-61 |

When rejecting a new proposal, add a row here with the lock ID cited.
