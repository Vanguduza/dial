# S/PD historical inventory vs Completion Plan dogfood

**Purpose:** Avoid rework before Playwright/gateway dogfood. **Not SoR** — eng sequencing SoR remains [`DIAL_Full_ERP_Completion_Plan.md`](../../planning/DIAL_Full_ERP_Completion_Plan.md) + [`DIAL_Build_Workplan_STATE.md`](../../planning/DIAL_Build_Workplan_STATE.md).

**Date:** 2026-08-16  
**Policy:** S90 / PD138 green = **behaviour contracts** (often fixture). G0–G12 require **sandbox/live anti-stub evidence** (§0 anti-stub gate policy).

---

## How to read this note

| Column | Meaning |
| --- | --- |
| **Historical S/PD contract** | Stages that landed UI/API/adapters/tests — reuse, do not rebuild |
| **Completion run evidence** | What this Completion Plan pass already captured under `docs/ops/evidence/g*` |
| **Still worth running** | Anti-stub gap — sandbox dogfood not yet evidenced or only fixture/CI |
| **Skip / don't redo** | Covered or superseded by g* scripts + evidence; rerunning adds no gate value |

---

## Gate matrix (summary)

| Gate | Historical S/PD contract | Durable/sandbox evidence (this run) | Still worth running | Skip / don't redo |
| --- | --- | --- | --- | --- |
| **G0** | Phase 0 doc + STATE redirect | Plan landed | — | Re-writing gap matrix |
| **G1** | S20 T1, **PD1** Auth; S21 **PD2** Meili; migrations `0001`–`0003` | Stage log: GoTrue session, Meili `taskUid=29`, RLS CI ≥5; runbook `phase1-sandbox-dogfood.md` | Staging boot checklist if regressions suspected; no `g1/` evidence dir | Re-scaffolding Auth/Meili packages |
| **G2 eng-exception** | S10–S12, S22 **PD3** Spare, **PD4** PSP, S23 T5 money; PD43 CPA; PD97 idempotency | `g2/` PNGs (browse/cart/CTAs/COD done + **EcoCash web done**); spine + signed-in API; Meili live; B2B leak=0; `g8` matrix overlaps COD/EcoCash | Live portal EcoCash after founder keys; Paynow hosted live | Re-run `g2-spare-web-recon` if PNGs fresh; `g2-sandbox-spine-probe` + signed-in API scripts; PD37 harness-only pass; **EcoCash web done Playwright** (evidenced 2026-08-16) |
| **G2 live EcoCash** | PD4 sandbox adapters | — | Portal keys + live buy + webhook evidence | Pretend `eco_sb_*` re-probe |
| **G3** | **PD5** Android, **PD8** iOS, **PD20/21** mobile deepen, PD42 parity | `g3/native-client-checkout.json` loopback HTTP; web screenshot matrix links to `g2/` | Staging gateway (ENH-011); Play/TestFlight install; **device PNG matrix** | Loopback `g3-native-client-checkout`; contract tests (`pd20CustomerMobile.test.ts`) |
| **G4** | S28 **PD15** Factory; **PD6** supplier; PD38 heartbeat/SLA; PD66 pending_review | **G4 green:** REST→Meili `taskUid=65`; `g4/` admin PNGs + `rest-meili-publish.json`; confirm-SLA cycle | — | `phase4-sandbox-factory-dogfood.mjs` if REST rows unchanged; `g4-admin-factory-recon` |
| **G5** | S25 E3a, **PD7** delivery Android, PD36 multi-stop, PD51/58/59/63 courier UX | Temporal history ≥2; durable POD/COD; `g5/` admin MapLibre 9 PNGs; courier sandbox JSON | **ENH-013** maps Tier-2 (`g5-maps-tier2-probe`); **courier Android device POD** (G3 signing) | `g5-sandbox-delivery-dogfood`; `g5-admin-delivery-recon`; PD36 in-process-only reruns |
| **G6** | S24 **PD13** tech-web, **PD9** tech Android, PD25/30/31, PD114–136 checklist tranches | 42/42 seeds; `phase6PrepOps`; Kotlin path; `g6/` HTTP contract JSON | **Tech Android device PNG** (checklist→evidence→ITF263 on device) | `g6-technician-android-dogfood.mts` HTTP substitute; PD13/137 unit thin verticals |
| **G7** | **PD10** admin money/dispatch/CC; PD22–24, PD45–48, PD53–62, PD127; PD60 modules | Launch 9×3 viewports + CC Simulated + **27/27 extended desktop** + `checklistSignOff` all A–P walked in `g7/`; **`g7Claimed=true`** | — | Re-walking launch queues; extended PNG re-capture |
| **G8 sandbox** | **PD11** FDMS, PD49 escrow, PD39 ContiPay/PayPal, S23 webhooks | **G8 green:** `g8-sandbox-money-matrix.json`; webhook duplicate no-op; FDMS day; WHT 30% | Live Paynow / ZIMRA / escrow / EcoCash when keys land | Sandbox matrix re-run unless rails change |
| **G9** | **PD12** WA Flows, PD40 template admin, S10 Matrix B | Registry + fiscal `channel=wa`; `phase9PrepOps` 6/6; probe fail-closed JSON | **Live WABA** test MSISDN Flow search→pay (ENH-021) | `g9-sandbox-wa-flows-probe` without keys; PD12 fixture thin vertical |
| **10** | Historical **G1** grocery + **PD14** deepen + PD35/54/44 | Spine + **web Playwright green** (`g10/` browse→track desktop+mobile); liquor hidden; B2B=0 | Meili live grocery hits optional; G5 maps Tier-2 for full exit | `G10_SKIP_WEB`; G1 unit-only |
| **G11** | **PD17** Intelligence, PD47 CC actions, S29 T8 | **G11 green:** `g11/` JSON + `phase11PrepOps.test.ts` 4/4 + ai-capability-G11 audit | Live Langfuse/Promptfoo CLI keys | PD17 shadow fixture reruns; `phase11PrepOps` alone |
| **G12** | S30 T9, **PD33** staging recon, **PD37** local Playwright | `phase12-hardening-dogfood-checklist.md` | Closed cohort on **remote staging** (ENH-011); full stack Spare+Tech+Grocery+WA | PD37 harness mode; local-only PD33 |

---

## Focus areas (founder call-outs)

### Spare EcoCash|COD

| Layer | Historical | Completion evidence | Action |
| --- | --- | --- | --- |
| Contract | PD3, PD43, PD97, S10–S12, S23 | CTAs + COD + **EcoCash web** PNGs (`g2/`); spine + API `eco_sb_*` | **Skip:** EcoCash web done Playwright (evidenced 2026-08-16) |
| Fixture-only green | PD4 PSP sandbox tests | G2 eng-exception + G8 matrix | **Skip:** pretend EcoCash API reprobes |
| Live | — | `blocked_on_human` | **Wait:** portal keys |

### Meili

| Layer | Historical | Completion evidence | Action |
| --- | --- | --- | --- |
| Contract | PD2, PD15, S21, S28 | Bootstrap `taskUid=29`; Factory `32`/`65`; B2B leak=0 | **Skip:** bootstrap unless index wiped |
| Fixture green | In-memory Factory publish in CI | G4 REST→Meili green | **Skip:** memory-only publish |

### Factory

| Layer | Historical | Completion evidence | Action |
| --- | --- | --- | --- |
| Contract | PD15, PD38, PD66, S28 | G4 green + `g4/` + `g7/factory-*` | **Skip:** admin factory recon unless UI change |
| Fixture green | `runPhase4PrepFactoryCsvPublishThinVertical` | REST two-supplier dogfood | **Skip:** CSV fixture-only path |

### Temporal

| Layer | Historical | Completion evidence | Action |
| --- | --- | --- | --- |
| Contract | PD36, S25, PD7 | `g5-sandbox-delivery-dogfood` history ≥2 | **Skip:** temporal connect probe |
| Fixture green | In-process worker in CI | Real compose `127.0.0.1:7233` | **Skip:** in-process-only tests for G5 claim |

### Admin recon

| Script | Historical | Overlap | Recommendation |
| --- | --- | --- | --- |
| **PD37** `pd37LocalReconSpine.ts` | PD37 green (Spare+grocery+WA markers) | Subset of g2 + g7; can run harness without gateway | **Skip** for gate evidence; use g2/g7 |
| **g2-spare-web-recon.mts** | — | Deeper G2 customer path + signed-in COD | **Skip** unless regression |
| **g4-admin-factory-recon.mts** | PD15 admin | G4 factory + confirm-SLA | **Skip** (G4 green) |
| **g5-admin-delivery-recon.mts** | PD10 dispatch/track | G5 admin MapLibre | **Skip** unless dispatch UI changes |
| **g7-admin-ops-recon.mts** | PD10 + PD A–P screens | Supersedes PD37 for admin; launch queues done | **Run** extended pass only (see G7 row) |

**G7 agent overlap (`a2969860`):** Do not kill. 21/27 extended desktop PNGs exist. Use `G7_MISSING_EXTENDED_ONLY=1` for the **6 remaining** routes only — not a full 9-queue re-walk. Requires healthy gateway on :3000 + Playwright Chromium.

### WA Flows

| Layer | Historical | Completion evidence | Action |
| --- | --- | --- | --- |
| Contract | PD12, PD40, S10 | Buttons registry; fiscal outbox; `phase9PrepOps` | **Skip:** fixture Flow unit tests |
| Fixture green | `runPd12WaFlowsSandboxThinVertical` | Probe fail-closed without keys | **Run:** live WABA when ENH-021 unblocks |

### Grocery

| Layer | Historical | Completion evidence | Action |
| --- | --- | --- | --- |
| Contract | G1 (workplan), PD14, PD35, PD54 | `phase10PrepOps` + **g10/** web PNGs + spine JSON | Meili live optional; G5 maps for full G10 exit | G1/PD14 unit-only; PD37 harness |

### Tech checklists

| Layer | Historical | Completion evidence | Action |
| --- | --- | --- | --- |
| Contract | PD13, PD9, PD114–137 (≠42 until PD136 tranche) | **42/42** seeds + web book + HTTP Android path | **Run:** device PNG only |
| Fixture green | ~26 catalogIds at PD114 era | 42/42 in G6 prep | **Skip:** re-seeding checklist library |

---

## Fixture-green → sandbox still required

Stages marked green on **fixture / thin vertical / harness** that Completion Plan anti-stub still needs **sandbox or live** proof for:

| Historical green | Fixture evidence | Completion sandbox still needed |
| --- | --- | --- |
| PD1 Auth | GoTrue fixture CI | G1 — largely done (session + RLS); restage if auth regressions |
| PD2/PD15 Meili | `taskUid: "fixture"` path in CI | **Done** for Spare (G2/G4 live index) |
| PD4/PD39 PSP | fail-closed + stub refs | G8 sandbox **done**; live keys open |
| PD11 FDMS | Virtual Gateway sandbox thin vertical | G8 sandbox **done**; ENH-022 live |
| PD12 WA | Flow registry + fixture settle | G9 live WABA + test MSISDN |
| PD36 Temporal | `activityCreateMultiStopDispatch` unit | G5 Temporal **prep done**; G5 open maps + device POD |
| PD37 Playwright | harness OK without :3000 | g2/g7 live localhost PNGs — **not** harness re-run |
| PD10 admin | unit tests | G7 walkthrough — **green** (2026-08-16) |
| PD9/PD13/PD136 tech | partial checklist count | G6 checklist count **done**; device open |
| G1/PD14 grocery | thin vertical tests | **G10** full food E2E |
| PD33 staging recon | unit `pd33StagingDogfood` | **G12** remote staging cohort |

---

## Script inventory (`apps/gateway-web/scripts/` + `scripts/`)

| Script | Gate | Supersedes / overlaps |
| --- | --- | --- |
| `g2-spare-web-recon.mts` | G2 | PD37 Spare surface |
| `g2-signed-in-{cod,ecocash}-api.mts` | G2 | — |
| `g2-signed-in-ecocash-web.mts` | G2 | EcoCash web done-page (complements COD PNGs) |
| `g2-sandbox-spine-probe.mts` | G2 | PD4 money spine unit |
| `g2-b2b-leak-probe.mts` | G2/G4/G10 | PD2 B2B tests |
| `g2-paynow-hosted-probe.mts` | G8 live prep | PD112 |
| `g3-native-client-checkout.mts` | G3 | PD5/8 HTTP parity |
| `g4-admin-factory-recon.mts` | G4 | PD15 admin screenshots |
| `phase4-sandbox-factory-dogfood.mjs` | G4 | REST persist |
| `phase4-sandbox-rest-meili-publish.mjs` | G4 | Factory→Meili |
| `g5-sandbox-delivery-dogfood.mts` | G5 | PD36/PD7 sandbox |
| `g5-admin-delivery-recon.mts` | G5 | PD10 dispatch/track |
| `g5-maps-tier2-probe.mts` | G5 | ENH-013 |
| `g6-technician-android-dogfood.mts` | G6 | PD9 HTTP path |
| `g7-admin-ops-recon.mts` | G7 | **PD37 admin + PD10**; extended A–P |
| `g8-sandbox-money-matrix.mts` | G8 | PD4/11/49 matrix |
| `g9-sandbox-wa-flows-probe.mts` | G9 | PD12 live probe |
| `g10-sandbox-grocery-food-dogfood.mts` | G10 | food E2E spine + web Playwright |
| `g11-sandbox-intelligence-dogfood.mts` | G11 | PD17/PD47 sandbox evidence |
| `dev-with-root-env.mts` | all | loads monorepo `.env` |
| `dogfood-auth.mjs` | G1 | PD1 |
| `phase4-8-sandbox-dogfood.mjs` | G4/G8 prep | durable SQL probes |

**In-repo test spine (not Playwright):** `pd37LocalRecon.test.ts`, `runPd*` thin verticals across PD1–138 — keep in CI; **do not** treat as Completion gate exit evidence.

---

## Evidence dirs present

| Dir | Contents | Gate claim |
| --- | --- | --- |
| `g2/` | Spare web PNGs + NOTES | G2 eng-exception |
| `g3/` | Native HTTP JSON + NOTES | not G3 |
| `g4/` | Factory/confirm-SLA PNGs + Meili JSON | G4 green |
| `g5/` | Delivery admin PNGs + temporal/POD JSON | not G5 |
| `g6/` | Tech Android HTTP JSON | not G6 |
| `g7/` | Admin ops PNGs (launch + **27/27 extended desktop**) + JSON | **G7 green** |
| `g8/` | Money matrix JSON | G8 sandbox green |
| `g9/` | WA probe fail-closed JSON | not G9 live |
| `g10/` | Grocery food spine JSON + web PNGs (browse→track) | not G10 (`g10Claimed=false`) |
| `g11/` | Intelligence/CC sandbox JSON (`g11Claimed=true`) | G11 green |
| `g1/` | — | (no dedicated dir) |

---

## Recommended next dogfood order (no execution this turn)

1. ~~**G7:** one full desktop pass to validate `checklistSignOff` JSON (27/27 PNGs already captured).~~ — **done 2026-08-16** (`g7Claimed=true`).
2. ~~**G2 gap:** EcoCash web Playwright~~ — **done 2026-08-16**.
3. ~~**G10 web:** grocery food sandbox E2E Playwright~~ — **done 2026-08-16** (`g10Claimed=false`; G5 maps residual).
4. **G5:** maps Tier-2 when ENH-013 hosted; device POD after G3 signing.
5. **G3/G6:** device PNG matrix after staging URL + certs.
6. **G9 live:** after ENH-021.
7. **G12:** remote staging cohort last (ENH-011).

---

*Inventory note only. Update when evidence dirs or STATE boards change.*
