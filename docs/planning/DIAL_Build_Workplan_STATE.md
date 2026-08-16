# DIAL Build Workplan — STATE

Machine- and human-readable pointer for Dev Manager / Prime auto-advance.

**Eng SoR (2026-08-16+):** [`DIAL_Full_ERP_Completion_Plan.md`](./DIAL_Full_ERP_Completion_Plan.md) — finite Phases 0–12 with 100% exit gates. **Completion SoR = Full ERP plan**; **anti-stub gate policy** mandatory.  
**Autonomy (founder standing):** Auto-continue eng-safe work — **never** idle asking “continue?” (`.cursor/rules/dial-autonomous-completion.mdc` + runbook §0/§7). Secret-blocked exits stay **honestly open**. Key-drop-in: zero coding after secrets (`dial-key-drop-in.mdc`).  
**G2 EcoCash founder exception:** Pretend/API-doc EcoCash unblocks **eng sequencing** — STATE label `G2: eng-exception (pretend/sandbox EcoCash)`. Live/production EcoCash remains `blocked_on_human`. Ops: [`docs/ops/ecocash-pretend-sandbox.md`](../ops/ecocash-pretend-sandbox.md).  
**Historical:** S00–S90 + PD1–PD138 — **PD invent remains paused**.  
**Dogfood inventory (avoid rework):** [`docs/ops/evidence/s-pd-vs-completion-dogfood.md`](../ops/evidence/s-pd-vs-completion-dogfood.md) — S/PD contracts vs g2–g9 evidence; skip matrix before Playwright.  
**S99 / customer-open:** Appendix C + v4 §8.1 only — **human**; never eng auto-next.

| Field | Value |
| --- | --- |
| `current_stage` | **Completion Phase 12 prep** — hardening / AppSec / ops (not G12); **G11 green**; **G8 green**; **G7 green** |
| `current_branch` | `build/t4-tech-ui` |
| `prior_stage` | **Completion Phase 11** — **G11 green** (2026-08-16) |
| `next_stage` | G12 remains open (ENH-011 staging cohort); G5/G3/G6/G9/G10/G2-live remain `blocked_on_human` or open |
| `blocked_on_human` | See **paused on human secrets** board below (G3 signing certs; G6 device PNG; real EcoCash for production-intent; Meta/ZIMRA/escrow; ENH-013 maps; ENH-011 staging; optional `DATABASE_URL` for local psql) |
| `pause_mode` | **Phase 12 eng prep + ENH-609 Tech FixItNow UI copy** — public `/tech` copied, dashboards still open; Spare still AppShell; secret gates honestly open |

**Hosted preview (ENH-610):** Vercel project `dial` (fixture mode, no live keys). First deploy required fixing a **blocking** production-build defect (BUG-048) and a CSP defect that hid map tiles off localhost (BUG-049). Smoke: 33 routes answer, 0 server errors, auth-gated routes correctly 307/401. Preview sits behind Vercel deployment protection; the project's Root Directory is still unset (repo root carries `next` + `vercel.json` as the workaround).

**Credential lock (founder, 2026-08-16):** live payment / WhatsApp / tax credentials are injected **only after** everything is tested and confirmed production-ready — `.cursor/rules/dial-credentials-after-testing.mdc`.

**Donor UX (ENH-609 / D-38):** **In progress — Tech public UI copied, not full parity.** SoR = [`DIAL_Donor_Parity_Roadmap.md`](./DIAL_Donor_Parity_Roadmap.md). Founder: copy FixItNow UI, not redesign. `/tech` landing + services + technicians use copied FixItNow chrome; book → `POST /api/tech/services`. Dashboards / pay / reviews still open. Shared DIAL `AppShell` as cross-branch identity is **out**. Next: **P0** Spare AppShell rollback. Does **not** claim G3 or G12. Preview stays fixture (ENH-610).

**Eng parallel (key-drop-in):** Adapter shapes + webhook settle bridges hardened so Pack §6 secrets plug in with **zero further coding**. G2 eng-exception ≠ live EcoCash green.

**Phase 4 / G4 (green 2026-08-16):** REST two-supplier Factory dogfood → `publishRestApprovedFactoryOffersViaIndexer` → Meili search by offerId (`publishTaskUid=65`, `searchHits=1`, `meiliSkipped=false`); confirm-SLA cycle green (`phase4PrepOps.test.ts`); co-op live offer + SLA escalation in REST dogfood; admin catalogue + confirm-SLA T+S+A recon (`docs/ops/evidence/g4/`). **G3 still open** (signing/ENH-011) — parallel, not skipped.

**Phase 5 prep (not G5):** Temporal compose **up** (`dial-temporal-1` stable); `dial` namespace registered; `DeliveryDispatchWorkflow` history via `g5-sandbox-delivery-dogfood.mts` (`path=temporal`, `historyLength≥2`); durable `delivery_jobs` POD; courier offer→accept→POD→COD + timeout→reassign; **admin MapLibre T+S+A recon retracted** (BUG-046 stub CSS) — re-run `g5-admin-delivery-recon.mts` against DialMap before re-claiming. **G5 open:** ENH-013 mbtiles/Planetiler + courier Android device POD PNG.

**Phase 6 prep (not G6):** Pack checklist library **42/42 catalogId seeds** + gateway `phase6PrepOps.test.ts` (web rate_card book + emergency never AI-blocked + D-56 intake audit citation); `DialTechnicianClientTest.kt` full checklist→evidence→ITF263→Take-Home; `g6-technician-android-dogfood.mts` HTTP contract green (`docs/ops/evidence/g6/`). **G6 open:** tech Android **device** PNG (G3 signing).

**Phase 7 / G7 (green 2026-08-16):** Launch 9×3 viewports + CC Simulated watermark/payout blocked + **27/27 extended A–P desktop**; `checklistSignOff` all modules A–P walked; Module K dormancy signed; `g7Claimed=true` in `docs/ops/evidence/g7/g7-admin-ops-recon.json`.

**Phase 11 / G11 (green 2026-08-16):** Promptfoo fail→no promote + pass+human→promote (`runG11IntelligenceCommandCentreSandboxEvidence` + `phase11PrepOps.test.ts` 4/4); Actual KPI `open_delivery_track` recommended action executes with payout refused; Simulated payout forbidden (G7 recon + G11); `dial-ai-capability-review` `docs/agent-audits/ai-capability-G11-2026-08-16.md`; evidence `docs/ops/evidence/g11/g11-sandbox-intelligence-dogfood.json` (`g11Claimed=true`).

## Eng-safe prep log (Phases 3–12 — G2 eng-exception + G4/G7/G8/G11 green)

| Phase | Landed this session | Gate claim |
| --- | --- | --- |
| **2** | Pretend EcoCash Pack §6 → `eco_sb_*`; spine + signed-in EcoCash\|COD API; escrow sandbox inline `escrow_sb_*`; founder exception in rules + Completion Plan | **G2 eng-exception** (not live EcoCash) |
| **3** | Staging fail-closed (`DIAL_GATEWAY_URL_CONFIGURED`); iOS `resolveForInternalTrack`; native-shaped checkout probe; privacy/data-safety draft; screenshot matrix web cells + CTA contracts | **not G3** |
| **4** | REST Factory queue → Meili (`publishRestApprovedFactoryOffersViaIndexer`, `taskUid=65`); confirm-SLA + two-supplier dogfood; B2B leak=0 live; admin T+S+A recon `docs/ops/evidence/g4/` | **G4 green** |
| **5** | Temporal stable; workflow history; durable POD; admin T+S+A recon `docs/ops/evidence/g5/`; maps probe fail-closed | **not G5** |
| **6** | 42 seeds + web book/emergency + D-56 intake audit; Kotlin G6 path test; `g6-technician-android-dogfood.mts` T+S green | **not G6** (device PNG) |
| **7** | CC Simulated + launch 30 PNGs; **27/27 extended A–P desktop**; `checklistSignOff` validated (all A–P walked); `finalizeSignOffFromExistingPngs` merge | **G7 green** (`g7Claimed=true`) |
| **8** | Sandbox money matrix (`g8-sandbox-money-matrix.mts`); Paynow/EcoCash webhook duplicate no-op; FDMS day open→submit→close; WHT 30% remittance; `phase8PrepOps.test.ts` 5/5 | **G8 green** (sandbox; live keys blocked_on_human) |
| **9** | G9 sandbox probe + fiscal channel=wa settlement; `phase9PrepOps.test.ts` 6/6; FLOW pay EcoCash+COD fixture evidence | **not G9** (ENH-021 + test MSISDN) |
| **10** | Spine order→POD + liquor hidden + B2B=0; **web Playwright green** (browse→track desktop+mobile, 14 PNGs in `g10/`); checkout client import fix | **not G10** (`g10Claimed=false`; G5 ENH-013 maps may block full exit) |
| **11** | `executeRecommendedAction` + Promptfoo fail gate; `g11-sandbox-intelligence-dogfood.mts`; `phase11PrepOps.test.ts` 4/4; ai-capability-G11 audit | **G11 green** (`g11Claimed=true`) |
| **12** | Spare-orders IDOR (BUG-047); `phase12PrepOps`; `g12-hardening-prep.json` `g12Claimed=false`; §5.16 dormancy register; DialMap recon requires GL canvas | **not G12** |

**Remaining eng-safe backlog:** Re-run `g5-admin-delivery-recon.mts` vs DialMap when gateway :3000 is up; local restore drill when Docker engine is up; Semgrep/Checkov on CI after push. **Open gates (human/device/secrets):** G3 signing; G5 ENH-013 maps + device POD; G6 device PNG; G9 live ENH-021; G10 full (`g10Claimed=false`); G2 live EcoCash; G12 staging cohort (ENH-011).

## G6 evidence board (anti-stub) — open

| Item | Status | Evidence |
| --- | --- | --- |
| 42/42 checklist catalogIds loadable | **green** | `phase6PrepOps.test.ts` + `@dial/jobs` seeds |
| Customer web book rate_card + emergency | **green** | `phase6PrepOps.test.ts` |
| Intake capability review (D-56) | **green** | `ai-capability-G6-intake-2026-08-16.md` |
| Tech Android checklist+evidence (HTTP/unit) | **green** | `DialTechnicianClientTest.kt` + `g6-technician-android-dogfood.json` |
| ITF263 upload/verify + Take-Home WHT | **green** | dogfood JSON + Kotlin test |
| Tech Android device PNG | **open** | G3 signing — HTTP substitute only |
| **G6** | **open** | Device Android evidence required for T+P+S+**A** |

## G7 evidence board (anti-stub) — green

| Item | Status | Evidence |
| --- | --- | --- |
| Launch-critical queues walked (orders/money/FDMS/dispatch/Factory/disputes/legal/CC) | **green** | `g7-admin-ops-recon.mts` 9×3 viewports (30 PNGs) |
| Module K HR/Payroll-ZW dormant | **signed** | `/admin/hr` DORMANT banner |
| Helper-text audit | **green** | recon `helperViolations=[]` |
| Command Centre Simulated watermark | **green** | `command-centre-simulated-*.png` + `ccSimulatedWatermark=true` |
| Command Centre Simulated payout blocked | **green** | Attempt payout → `never auto-pay` status |
| Full A–P ops walkthrough | **green** | **27/27** extended desktop PNGs; `checklistSignOff` all modules walked |
| **G7** | **green** | `g7Claimed=true`; `docs/ops/evidence/g7/g7-admin-ops-recon.json` |

## G11 evidence board (anti-stub) — green

| Item | Status | Evidence |
| --- | --- | --- |
| Promptfoo fail → promote blocked | **green** | `g11-sandbox-intelligence-dogfood.json` + `phase11PrepOps.test.ts` |
| Promptfoo pass + human → promote | **green** | `runG11IntelligenceCommandCentreSandboxEvidence` |
| Actual KPI recommended action cannot pay | **green** | `executeRecommendedAction` → `open_delivery_track` payout refused |
| Simulated payout forbidden | **green** | G7 recon + G11 script + `phase11PrepOps.test.ts` |
| Auto-publish blocked | **green** | intelligence API + G11 sandbox |
| `dial-ai-capability-review` current | **green** | `docs/agent-audits/ai-capability-G11-2026-08-16.md` |
| Live Langfuse/Promptfoo CLI keys | **open** | `blocked_on_human` — sandbox smoke only |
| **G11** | **green** | `g11Claimed=true`; `docs/ops/evidence/g11/` |

## G10 evidence board (anti-stub) — open

| Item | Status | Evidence |
| --- | --- | --- |
| Food spine order→POD + liquor hidden | **green** | `g10-sandbox-grocery-food-dogfood.json` `pod_captured` |
| B2B informal leak = 0 | **green** | spine `b2bLeaks=0` |
| Web browse→cart→slot→checkout→track | **green** | `g10/` 14 PNGs (desktop+mobile); script `ok=true` |
| Meili live grocery hits | **optional** | memory spine exercised |
| G5 maps Tier-2 / multi-stop | **open** | ENH-013 may block full G10 exit |
| **G10** | **open** | `g10Claimed=false` until Completion Plan G10 DoD 100% |

## G9 evidence board (anti-stub) — open

| Item | Status | Evidence |
| --- | --- | --- |
| FLOW_SPARE/GROCERY registry + EcoCash\|COD buttons | **green** | `flowRegistry.ts` + `CHECKOUT_PAY_BUTTONS` |
| WA pay → fiscal outbox channel=wa | **green** | `settleWaCheckoutFiscal` + `phase9PrepOps.test.ts` |
| Cloud API sandbox outbound (flow+buttons+template) | **open** | Requires `WHATSAPP_*` in `.env` |
| No Baileys / unofficial WA in tree | **green** | `assertNoUnofficialWhatsAppDeps` |
| Test MSISDN Flow search→pay EcoCash+COD on WABA | **open** | ENH-021 — no invented template IDs |
| **G9 sandbox prep** | **eng green** | `g9-sandbox-wa-flows-probe.mts` fail-closed without keys |
| **G9 live** | **open** | `blocked_on_human` ENH-021 |

## G5 evidence board (anti-stub) — open

| Item | Status | Evidence |
| --- | --- | --- |
| Temporal `DeliveryDispatchWorkflow` history | **green** | `g5-sandbox-delivery-dogfood.mts` `path=temporal`, `historyLength≥2` |
| Courier sandbox offer→accept→POD→COD | **green** | `g5-sandbox-delivery-dogfood.json` durable `pod_captured` |
| Timeout→reassign | **green** | `g5-sandbox-delivery-dogfood.json` |
| Admin MapLibre T+S+A | **retracted** | BUG-046 stub CSS; recon now requires `.maplibregl-canvas` — re-run before re-claim |
| ENH-013 Nominatim/OSRM/VROOM | **open** | `g5-maps-tier2-probe.json` fail-closed |
| Courier Android device POD PNG | **open** | G3 signing — unit tests only |
| **G5** | **open** | Maps SoR + device POD remain |

## G4 evidence board (anti-stub) — green

| Item | Status | Evidence |
| --- | --- | --- |
| Two-supplier REST persist | green | `scripts/phase4-sandbox-factory-dogfood.mjs` |
| Approve → Meili searchable (REST rows) | green | `phase4-sandbox-rest-meili-publish.mjs` `publishTaskUid=65`, `searchHits=1` |
| Confirm-SLA cycle | green | `phase4PrepOps.test.ts` |
| Co-op live offer | green | REST dogfood `supplier_coop_offers` |
| B2B informal leak = 0 | green | `g2-b2b-leak-probe.mts` `meiliSkipped=false` |
| Admin catalogue T+S+A | green | `docs/ops/evidence/g4/*.png` + `rest-meili-publish.json` |
| **G4** | **green** | Phase 4 exit gate DoD 100% sandbox evidence |

## Paused on human secrets (not “waiting for continue”)

| Unblocker | Unlocks | Pack / env names (no values) |
| --- | --- | --- |
| **Play upload keystore / Apple distribution cert** | G3 internal TestFlight / Play internal | `DIAL_ANDROID_UPLOAD_KEYSTORE`, `DIAL_APPLE_DISTRIBUTION_CERT` |
| **ENH-011 remote staging URL** | Native builds talking to non-loopback staging gateway (G3 anti-stub) | `DIAL_GATEWAY_BASE_URL` |
| **EcoCash portal keys (live/production-intent)** | Live EcoCash evidence (beyond eng-exception) | `ECOCASH_API_KEY`, `ECOCASH_MERCHANT_CODE`, `ECOCASH_WEBHOOK_SECRET` (+ optional `ECOCASH_SANDBOX_HTTP=1`) |
| **Postgres `DATABASE_URL`** (optional — local psql only) | Local `psql` / `apply-phase4-migrations.mjs` without Management PAT | `DATABASE_URL` — EMPTY locally; sandbox DDL applied via Management `database/query` API (`scripts/supabase-mgmt-migrate.mjs`) |
| ~~**Meili host up (Docker Desktop)**~~ | ~~Re-run Meili leak probe with live index~~ | **eng-green 2026-08-16** — bootstrap `taskUid=29`; Factory publish `taskUid=32`; B2B leak=0 live (`meiliSkipped=false`) |
| ~~**`INTERNAL_API_SECRET`**~~ | ~~Admin confirm-SLA / bonds / worker side-effects in sandbox~~ | **eng-generated sandbox value in `.env`** — confirm-SLA cycle green; worker/Temporal sandbox side-effects unblocked for dogfood |
| **ENH-020 escrow partner** | G8 live escrow / customer-open money path | partner contract + `PSP_ESCROW_*` (pretend inline ≠ live partner) |
| **ENH-021 Meta templates** | G9 live WA Flows | WABA + approved template IDs (+ `WA_FLOW_*`) |
| **ENH-022 ZIMRA** | G8 FDMS live submit / customer-open fiscal | device / activation credentials |
| **PAYNOW_INTEGRATION_*** | G8 live Paynow hosted checkout | Pack §6 Paynow portal keys |
| **S99 / Appendix C** | Customer-open | founder/ops only — never eng auto |
| Liquor counsel | Liquor Build | out of MVP |
| Take-rate live bps | Ops publish ladder | ops-set integer bps |
| ENH-013 maps Tier-2 | G5 maps quality | Nominatim/OSRM/VROOM hosting |

**Resume rule:** When any row above is filled in `.env` / vault, Dev Manager continues that gate’s evidence automatically — do not wait for a “continue” message. **G2 EcoCash founder exception** already unblocks sequencing with pretend keys — do not pause the whole build on EcoCash.

## Stage log (recent)

| Stage | Date | Note |
| --- | --- | --- |
| **Phase 0** | 2026-08-16 | Gap matrix + Full ERP Completion Plan landed |
| **Phase 1 / G1** | 2026-08-16 | Auth GoTrue+gateway cookie→`/api/auth/me`; Meili real `taskUid`; RLS CI ≥5; migrations `0001`–`0003` on sandbox project; worker fail-closed; runbook |
| **Phase 2 / G2 eng-exception** | 2026-08-16 | Founder exception: pretend EcoCash → `eco_sb_*`; COD+EcoCash spine + signed-in API; durable JR/ledger/fiscal; B2B leak=0 (memory; Meili prior `taskUid=24`); **not live EcoCash** |
| **Key-drop-in** | 2026-08-16 | ContiPay/PayPal/EcoCash/Paynow settle bridge; escrow JR inline sandbox; FDMS HMAC; Factory→indexer prep; WA mark-read; maps reverse; Temporal/Redis ops doc |
| **Phase 4 prep** | 2026-08-16 | Durable supplier_costs/stock/heartbeats (`0004`); Factory CSV→approve→Meili indexer; take-rate bps durable; heartbeat escalate fail-closed — **not G4** |
| **Autonomy + P4/P6 prep** | 2026-08-16 | `dial-autonomous-completion.mdc`; confirm-SLA board + `0005` co-op; two-supplier thin vertical; checklist 42 seeds; migrations **not** on sandbox (404) |
| **Eng-safe P3–P12 prep** | 2026-08-16 | Native gateway flavors; Temporal/maps/offline packs; admin K/G/P dormant registry; WHT `0006`; WA_FLOW_*; grocery/CC/hardening docs — **no gates green** |
| **Phase 7 admin shells** | 2026-08-16 | `/admin/hr` `/admin/pricing` `/admin/analytics` dormant status shells + contract test — **not G7** |
| **Phase 3 deepen** | 2026-08-16 | Fail-closed staging URL; internal-track loopback reject; native HTTP EcoCash\|COD probe; privacy draft; screenshot matrix — **not G3** |
| **Phase 4/5 fixture CI** | 2026-08-16 | Gateway `phase4PrepOps.test.ts` (confirm-SLA + two-supplier B2B=0); `phase5PrepOps.test.ts` (maps health + offline packs + dispatch fail-closed) — **not G4/G5** |
| **Phase 6–11 fixture CI** | 2026-08-16 | Gateway `phase6PrepOps` … `phase11PrepOps` + `phase9PrepOps`: checklist 42, WHT remittance, WA Flow contracts, grocery food spine, CC/Factory no auto-pay — **no gates green** |
| **Sandbox SQL 0004–0006** | 2026-08-16 | Management `database/query` applied Phase 4/8 migrations; REST HTTP 200; `phase4-8-sandbox-dogfood.mjs` durable persist OK — **not G4/G8** |
| **Phase 4 sandbox Factory REST** | 2026-08-16 | `phase4-sandbox-factory-dogfood.mjs` two-supplier upload/approve shapes + B2B=0; `INTERNAL_API_SECRET` generated; confirm-SLA cycle via fixture CI; Meili down — **not G4** |
| **Phase 4 / G4** | 2026-08-16 | REST Factory → Meili `taskUid=65`; admin T+S+A recon; **G4 green** |
| **Phase 5 prep** | 2026-08-16 | Temporal + workflow history + durable POD; admin MapLibre T+S+A recon green; ENH-013 maps + device POD still open — **not G5** |
| **Phase 6–7 deepen** | 2026-08-16 | G6: Kotlin full path + HTTP dogfood + D-56 intake audit; G7: launch-queue admin recon 27 PNGs — **not G6/G7** |
| **Phase 7 CC Simulated + Phase 8 / G8** | 2026-08-16 | G7 recon: 30 PNGs, Simulated watermark + payout blocked; G8 sandbox matrix + webhook duplicate + FDMS day + WHT — **G8 green**; G7 still open (full A–P) |
| **Phase 9 WA prep + G7 A–P script** | 2026-08-16 | G9: WA Flow pay EcoCash+COD + fiscal channel=wa (`phase9PrepOps` 6/6, `g9-sandbox-wa-flows-probe.mts`); G7: extended A–P recon script (+27 desktop routes) — **not G7/G9 live** |
| **G2 EcoCash web done + G10 spine prep** | 2026-08-16 | G2: `g2-signed-in-ecocash-web.mts` desktop+mobile done-page (`spare-ecocash-*`); G10: spine order→POD JSON (`g10/`) — web PNGs open — **not G10** |
| **G7 extended + G10 web dogfood** | 2026-08-16 | G7: 6 missing extended desktop PNGs (integrations…wa-flows); G10: web browse→track desktop+mobile green after grocery checkout client import fix — **`g10Claimed=false`** (G5 maps residual) |
| **Phase 7 / G7** | 2026-08-16 | Extended A–P checklist JSON validated (`finalizeSignOffFromExistingPngs`); all modules A–P walked; **`g7Claimed=true`** — **G7 green** |
| **Phase 11 / G11** | 2026-08-16 | Promptfoo fail→no promote; Actual KPI action cannot pay; Simulated forbidden; ai-capability-G11 audit; **`g11Claimed=true`** — **G11 green** |
| **Phase 12 prep** | 2026-08-16 | Spare-orders IDOR (BUG-047); `phase12PrepOps` + `g12-hardening-prep.json`; §5.16 dormancy; G5 recon GL wait — **not G12** |

## G8 evidence board (anti-stub) — green

| Item | Status | Evidence |
| --- | --- | --- |
| Sandbox COD + EcoCash-pretend (`eco_sb_*`) | **green** | `g8-sandbox-money-matrix.json` rails.cod + rails.ecocash |
| Paynow webhook → ledger (fixture rail) | **green** | `phase8PrepOps.test.ts` + matrix `paynow_fx_*` |
| EcoCash webhook duplicate no-op | **green** | `phase8PrepOps.test.ts` |
| Paynow webhook duplicate no-op | **green** | `phase8PrepOps.test.ts` |
| FDMS day open→submit→close | **green** | `runPd11FdmsSandboxThinVertical` + matrix fdms |
| WHT 30% tech payout remittance | **green** | WHT API draft→submit→ack + matrix wht |
| Live Paynow / ZIMRA / EcoCash / escrow | **open** | `blocked_on_human` — Appendix §5 |
| **G8 sandbox** | **green** | Matrix + tests + evidence JSON; not live-ready |

## G2 evidence board (anti-stub) — eng-exception

| Item | Status | Evidence |
| --- | --- | --- |
| Durable OfferSnapshot + order rows | **sandbox COD + EcoCash-pretend accepted** | Spine + signed-in API both rails |
| Meili-backed browse | **eng green (live index)** | bootstrap `taskUid=29`; Factory publish `taskUid=32`; leak probe `meiliSkipped=false` |
| Checkout Idempotency-Key | green | `/api/spare/checkout` + spine |
| EcoCash + COD + PSP truth | **COD + EcoCash-pretend green** (`eco_sb_*`) | Spine + signed-in API; Paynow shapes ready; live EcoCash open |
| Job Reserve + ledger + FiscalReceiptQueued | eng + sandbox | COD + EcoCash journals + 2 fiscal; `escrow_sb_*` JR authorize |
| B2B informal leak = 0 | green (live Meili + memory) | spine + `g2-b2b-leak-probe.mts` `meiliSkipped=false` |
| Desktop + mobile web | **COD + EcoCash web done green** | Playwright COD→done + EcoCash→done (`spare-ecocash-*` PNGs); EcoCash API `eco_sb_*` |
| Daily ZiG → EcoCash | eng green | ops rate or `DIAL_G2_ALLOW_FX_SEED=1` |
| **G2 eng-exception (sequencing)** | **green** | Pretend EcoCash + COD + durable + leak=0 |
| **G2 live/production EcoCash** | **open** | Founder portal keys + live buy evidence |

## G3 evidence board (anti-stub) — open

| Item | Status | Evidence |
| --- | --- | --- |
| Contract tests (Windows, no SDK) | eng | `pd20CustomerMobile.test.ts` Phase3-prep |
| Native HTTP EcoCash\|COD (same headers as apps) | eng (loopback) | `scripts/g3-native-client-checkout.mts` + `docs/ops/evidence/g3/` |
| Staging / non-loopback gateway URL | **open** | ENH-011 / `DIAL_GATEWAY_BASE_URL` |
| Device screenshot matrix Android + iOS | **open** | web cells from G2; native PNG pending |
| Play internal / TestFlight install + checkout | **open** | signing certs / keystore |

## Next eng-safe candidates (≠ S99)

| Candidate | Note |
| --- | --- |
| **Phase 12 remaining** | Remote staging cohort (ENH-011); Semgrep/Checkov CI; restore drill when Docker up; DialMap Playwright re-run |
| **Phase 3 / G3 remaining** | Device screenshots + signed internal builds against staging — human signing / ENH-011 |
| **Live EcoCash** | After founder portal keys — refresh evidence; still not required to sequence Phase 3+ |
| **S99** | Customer-open — founder/ops Appendix C — **not eng next** |

## Founder proceed

Eng follows **DIAL_Full_ERP_Completion_Plan.md** until G12; no PD invent; no idle-as-S99; no liquor Build. G2 EcoCash founder exception encoded — do not pause whole build on EcoCash. Work left **uncommitted** this session unless a finite live gate newly greens.
