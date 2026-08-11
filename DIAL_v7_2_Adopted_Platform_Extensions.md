# DIAL v7-2 Adopted Platform Extensions (D-53) + Intelligence / Command Centre depth (D-54)

**Authority:** Absorbed into `DIAL_Consolidated_Plan_v4.md` as founder locks **D-53** (platform extensions) and **D-54** (Intelligence Factory continuous learning + Command Centre metric contracts — §§13–14 below).  
**Source evaluation:** `DIAL_v7-2_Adjustment_Expansion_Evaluation.md` (classified absorb only; A12/A13/A15 depth → **D-54**).  
**Non-authority:** `DIAL_Master_Development_and_Ecosystem_Architecture_v7-2.md` remains a proposal draft — **not** SoR; cannot amend v4.  
**Date:** 2026-08-11  
**Status:** Locked companion — implement under Agent Pack **T0–T9** (never Train 0–10 renumbering).

---

## 0. Scope of D-53

| # | Item | Disposition |
| --- | --- | --- |
| 1 | Catalogue Factory + search/no-result demand-gap | **Adopt** |
| 2 | JobClassDefinition + TradeDefinition + trade lifecycle | **Adopt** |
| 3 | Technician Value Score (weights, confidence, explainability, outcome windows) | **Adopt** |
| 4 | Commercial Simulation + what-breaks-first (offline, non-mutating) | **Adopt** |
| 5 | WHT/ITF263 technician economics UI (align D-50) | **Adopt** |
| 6 | Kernel MAY/MUST NOT + DialDomainModule contract | **Adopt with modification** |
| 7 | AI / Intelligence Factory | **Adopt with modification** |
| 8 | CERTIFIED–DORMANT readiness language | **Adopt with modification** |

**Hard constraints preserved:** D-37 single public launch; D-39 T0–T9; D-44/D-45 delivery SoR; D-49 agency + B2B hide informal; D-50 tech WHT; D-51 owned dual capacity; D-52 tracer/DoD; AI never writes payable amounts; MapLibre+OSRM/VROOM delivery maps.

---

## 1. Discarded (once — do not integrate)

| Discarded | Why |
| --- | --- |
| v7 as SoR / “amend v4” authority | Conflicts with `AGENTS.md` / dial-agent-authority |
| Train 0–10 replacing T0–T9 | Conflicts with **D-39** |
| Investor / partnership Demonstration Mode | Deferred (eval A18) — not critical path |
| SupplyNetPy / full Mesa ABM digital twin | Deferred (eval A22 / A21 ABM) — research maturity |
| Broad Tech OS fiscal invoicing for off-platform work | Deferred pending counsel (D-2); marketplace Job Reserve / FDMS remain SoR |
| Unleash as feature-flag SoR | **AGPL-3.0** — isolate or prefer Pack tables + PostHog / MIT OpenFeature stack |
| OR-Tools as delivery distance/routing SoR | Conflicts **D-44** / **D-45** — offline sim experiments only |
| Accidental supersession of D-49 / D-51 / D-41 / D-52 | Explicit reject of silent omission (eval A30) |

---

## 2. OSS picks (D-53) — verified 2026-08-11

| Feature | Repo | SPDX | Stars¹ | Tier | Copy vs call vs reject |
| --- | --- | --- | --- | --- | --- |
| Catalogue enrichment / PIM UX | [`unopim/unopim`](https://github.com/unopim/unopim) | MIT | ~10.8k | **Tier 2 pattern** | Study enrichment queues, attributes, channel publish; **reimplement** into `services/catalogue-factory` + admin. Postgres catalogue remains SoR. SandPIM stays ACES/PIES schema cross-check only (D-38). |
| Catalogue CSV intake (already D-46) | [`tableflowhq/csv-import`](https://github.com/tableflowhq/csv-import) | MIT | ~1.8k | Tier 1 pattern | Keep — feed Factory ingest. |
| Trade/occupation taxonomy seed | [`colaberry/WorldOfTaxonomy`](https://github.com/colaberry/WorldOfTaxonomy) | MIT | low | **Tier 2 data** | Optional seed/crosswalk (ESCO/ISCO/O\*NET). DIAL `TradeDefinition` is SoR; do not call remote taxonomy as runtime gate. OccO / O\*NET CC-BY = data reference only. |
| JobClass rules (non-money) | [`CacheControl/json-rules-engine`](https://github.com/CacheControl/json-rules-engine) | ISC | ~3.1k | Tier 1 lib | Matching modifiers, intake routing, notifications. **MUST NOT** author ledger / Job Reserve / payable amounts. |
| Score explainability (ops offline) | [`shap/shap`](https://github.com/shap/shap) | MIT | ~25.6k | Tier 2 offline | Batch explainability for score model audits — not customer-facing. |
| Ranking-native Shapley (research) | [`DataResponsibly/ShaRP`](https://github.com/DataResponsibly/ShaRP) | MIT | low | Research | Optional ranking attribution experiments. Prefer in-repo factor contributions for MVP explain UI. |
| Commercial DES | [SimPy upstream](https://gitlab.com/team-simpy/simpy) | MIT | — | **Tier 1 lib** | Prefer GitLab `team-simpy/simpy`. Reject `github.com/simpx/simpy` as primary pin (fork). |
| DES alternative (lighter OO) | [`salabim/salabim`](https://github.com/salabim/salabim) | MIT² | ~0.4k | Tier 2 optional | Alternate DES if SimPy ergonomics fail; same offline-only rule. |
| Sensitivity / what-breaks-first | [`SALib/SALib`](https://github.com/SALib/SALib) | MIT | ~1.0k | **Tier 1 lib** | Sobol/Morris on simulation outputs. |
| Mesa / SupplyNetPy | — | — | — | **Reject for D-53** | Full ABM + SupplyNetPy deferred. |
| OR-Tools / Pyomo | Google OR-Tools / Pyomo | Apache-2.0 / BSD | — | Offline only | Never delivery SoR. |
| Feature flags (vs Unleash) | Pack `feature_flags` + **PostHog** (locked §6.10); secondary [`thomaspoignant/go-feature-flag`](https://github.com/thomaspoignant/go-feature-flag) MIT + [`open-feature/flagd`](https://github.com/open-feature/flagd) Apache-2.0 | MIT / Apache-2.0 | ~2.0k / ~1.0k | Tier 2 optional | **Reject Unleash SoR** (AGPL-3.0). Certification status SoR = DIAL DB. |
| Plugin / domain module pattern | [`nestjs/nest`](https://github.com/nestjs/nest) dynamic modules | MIT | ~76k | Tier 2 pattern | Pattern for `DialDomainModule` registration — DIAL may stay Express/Hono; do not mandate Nest runtime. |
| Kernel templates (study only) | Nest microkernel modular templates | MIT (Nest) | — | Pattern | Copy *ideas*; money primitives stay DIAL packages. |
| WHT / take-home UI | In-repo + [`diegomura/react-pdf`](https://github.com/diegomura/react-pdf) (D-46) | MIT | ~16.7k | Tier 1 | No dedicated ZW ITF263 OSS found — build “Your DIAL Take-Home” on Pack tax tables; PDF for certificates. |
| Intelligence eval | Promptfoo + Langfuse (locked) | — | — | Tier 1 | Factory wraps existing stack; no Evalite/Braintrust SoR. |
| Grafana (ops viz) | grafana/grafana | AGPL-3.0 | — | Tier 2 **isolate** | Self-host only; never import into proprietary app (eval A23). |

¹ Approximate at research pass; re-check at pin.  
² Confirm LICENSE file at pin (PyPI lists MIT).

---

## 3. Adopt — Catalogue Factory + demand-gap

### 3.1 Purpose

First-class ops factory for ingest → normalise → match → human review → publish → Meili, with KPIs including **search no-result** and **missing-parts demand**. Deepens catalogue moat (v4 §3.2, C-6) without making AI publish facts.

### 3.2 Packages / services

| Path | Role |
| --- | --- |
| `services/catalogue-factory` | Worker + Temporal workflows; never customer-facing SoR |
| `packages/catalogue` | Existing Postgres SoR for masters/fitment/offers |
| `packages/search-indexer` | Meili outbox consumer (unchanged ownership) |
| `admin-web` → Catalogue Factory | Ops UI: queues, KPIs, review |

### 3.3 Data model

```text
catalogue_ingest_batches
  id, source, format (csv|xlsx|ocr|api|heartbeat),
  offer_source_default (MARKETPLACE|DIAL_OWNED),  -- D-51
  created_by, created_at, status

catalogue_ingest_rows
  id, batch_id, raw jsonb, normalised jsonb,
  match_status (matched|pending_review|unmatched|rejected),
  candidate_master_ids uuid[],
  confidence numeric, reject_reason,
  supplier_formality (formal|informal)  -- D-49

catalogue_review_queue
  id, row_id, assignee, sla_due_at, decision, decided_at

catalogue_publish_events
  id, master_product_id, offer_id, published_at, meili_doc_version

search_no_result_events          -- demand-gap
  id, session_role (b2c|b2b|guest_blocked),
  query_text_redacted, filters jsonb,
  chassis_code?, occurred_at, converted_to_sourcing_request_id?

demand_gap_aggregates            -- daily rollup
  day, query_bucket, chassis_code?, hit_count, sourcing_count

catalogue_ai_candidates          -- never auto-publish
  id, row_id, proposed jsonb, model_id, promptfoo_run_id,
  human_status (pending|approved|rejected)
```

**Rules:** B2B sessions never contribute informal-visible demand that would justify informal→B2B exposure. `DIAL_OWNED` rows use owned inventory path (D-51), not agency escrow.

### 3.4 APIs

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/internal/catalogue-factory/batches` | AuthZ: catalogue ops; fail-closed INTERNAL |
| GET | `/admin/catalogue-factory/queues` | Review queues |
| POST | `/admin/catalogue-factory/rows/:id/decide` | Approve/reject match |
| GET | `/admin/catalogue-factory/kpis` | Ingest lag, match rate, no-result top-N |
| POST | `/internal/search/no-result` | From search proxy when hits=0 |

### 3.5 Workflows (Temporal)

- `CatalogueIngestWorkflow` — parse → normalise → match → enqueue review / auto-publish above threshold  
- `CataloguePublishWorkflow` — write masters/offers → outbox → Meili  
- `DemandGapRollupWorkflow` — daily aggregates → Command Centre metric

BullMQ: Sharp images, OCR chunking, Meili reindex (existing).

### 3.6 UI surfaces

- Admin: Factory dashboard (throughput, pending review SLA, demand-gap table)  
- Supplier-web: upload status (existing CSV + heartbeat)  
- No customer UI for Factory internals

### 3.7 Acceptance

- [ ] Zero auto-publish of `catalogue_ai_candidates` without human approve  
- [ ] No-result events recorded; top demand gaps visible in admin KPI  
- [ ] B2B Meili filter still excludes informal (D-49) after Factory publish  
- [ ] Owned-stock publishes go through `dial_owned_inventory` (D-51)  
- [ ] Tracer DoD for Factory epic 100% before merge (D-52)  
- [ ] Catalogue AI learning/promote uses Intelligence Factory gates (D-54) — still no Meili without human approve

---

## 4. Adopt — JobClassDefinition + TradeDefinition + lifecycle

### 4.1 Purpose

Configuration-driven trades and job archetypes so adding a trade ≠ new payment engine. Aligns C-2 multi-trade with modularity.

### 4.2 Archetypes (JobClass)

`FIXED` | `DIAGNOSTIC` | `ESTIMATED` | `INSPECTION` | `EMERGENCY` | `INSTALLATION` | `FABRICATION` | `RECURRING` | `PROJECT`

Each `JobClassDefinition` (versioned) maps allowed state transitions onto existing job events (v4 §6.15) — **does not** fork Job Reserve.

### 4.3 Data model

```text
job_class_definitions
  id, code, version, archetype,
  schema jsonb,              -- intake fields, evidence requirements
  state_machine_ref,         -- pointer to allowed transitions
  pricing_hooks jsonb,       -- rate-card keys ONLY (no amounts)
  effective_from, retired_at

trade_definitions
  id, code, display_name, version,
  status (DRAFT|RECRUITING|CERTIFIED_INTERNAL|ACTIVE|PAUSED|RETIRED),
  job_class_ids uuid[],
  credential_gates jsonb,
  checklist_pack_ids uuid[],
  matching_profile_id,
  recruitment_mode boolean,  -- config OK before supply density
  customer_bookable boolean  -- false until D-37 surface selected

trade_lifecycle_events
  id, trade_id, from_status, to_status, actor_id, reason, at
```

**Lifecycle:** `DRAFT → RECRUITING → CERTIFIED_INTERNAL → ACTIVE ⇄ PAUSED → RETIRED`  
Retire = soft; historical jobs retain `trade_definition_version`.

### 4.4 APIs / workflows

- Admin CRUD for definitions (four-eyes to ACTIVE)  
- `TradeCertificationWorkflow` (Temporal) — gates credentials + checklist pack + score profile  
- Matching uses `TradeDefinition` + eligibility (deterministic) then Value Score rank (§5)

### 4.5 UI

- Admin: Trade / JobClass editor, lifecycle timeline  
- Tech onboarding: trade pick constrained by `RECRUITING|ACTIVE`  
- Customer bookable trades = `customer_bookable=true` only (D-37 selective surface)

### 4.6 Acceptance

- [ ] Adding a JobClass does not add a payment/ledger package  
- [ ] Emergency path remains deterministic (AI must not gate)  
- [ ] Non-bookable trades can exist in config (recruitment mode) without violating D-37  
- [ ] json-rules-engine (if used) cannot write money fields

---

## 5. Adopt — Technician Value Score

### 5.1 Purpose

Weighted, explainable ranking **separate from** deterministic eligibility. Complements Formbricks / quality loops. **Never** writes prices or Job Reserve amounts.

### 5.2 Score model

```text
score_profiles
  id, trade_id?, name, version,
  weights jsonb,             -- e.g. completion, comeback, punctuality, evidence_quality, review_dims
  min_samples,               -- confidence floor
  outcome_window_days,       -- default 90; comebacks reduce contribution inside window

technician_score_snapshots
  id, technician_id, profile_id, score numeric,
  confidence (low|medium|high),
  factor_contributions jsonb, -- explainability payload
  sample_n, computed_at

technician_score_events      -- append-only
  id, technician_id, event_type, job_id?,
  delta, weight_applied, outcome_window_id,
  actor (system|ops|dispute), at
```

**Ranking flow:** eligibility filter → score rank → optional managers_choice boost. Disputes: human review; reverse via compensating score event (append-only).

### 5.3 Explainability

- MVP: show top factor contributions from `factor_contributions` in admin + tech “why this rank”  
- Offline audit: SHAP / ShaRP on frozen datasets — **not** live money path  
- Customer sees quality signals per product policy — not raw model internals

### 5.4 APIs / UI

| Surface | Content |
| --- | --- |
| Admin | Profile weights, confidence bands, dispute adjustments |
| Tech app | “Your Value Score” + factor breakdown + outcome window note |
| Matching service | Read snapshot only |

### 5.5 Outcome weighting (locked constraints)

- Score events **and** Intelligence Factory training labels (D-54) weight by outcome quality + outcome window — not by raw volume alone.  
- Comebacks / warranty / dispute inside `outcome_window_days` **reduce** positive contribution (negative or dampened delta).  
- Human dispute adjustments are append-only compensating events — never silent rewrite of history.  
- Dataset refresh for matching/rank assist may *read* score outcomes; it **must not** auto-change `weights jsonb` without ops four-eyes (profile version bump).

### 5.6 Acceptance

- [ ] Ineligible tech never offered solely due to high score  
- [ ] Score path has zero writes to `price_quotes` / ledger / Job Reserve  
- [ ] Comeback inside outcome window reduces contribution as configured  
- [ ] Append-only events; snapshots recomputed via Temporal `ScoreRecomputeWorkflow`  
- [ ] Profile weight changes require version bump + human approve (no silent auto-retune)

---

## 6. Adopt — Commercial Simulation + what-breaks-first

### 6.1 Purpose

Offline planning lab: supply/demand/ops → projected money outcomes; volume vs margin; branch readiness; **what-breaks-first** via sensitivity. **Non-mutating** toward production ledger / Job Reserve / FDMS.

### 6.2 Placement

| Path | Role |
| --- | --- |
| `services/commercial-simulation` | Python (SimPy + SALib) or worker sidecar |
| `simulation_runs` / `simulation_scenarios` tables | Metadata + inputs/outputs in Postgres |
| Admin Command Centre | “Simulated” view toggle (Actual vs Simulated) |

Schedule **after** money spine + catalogue density exist (calibrate on anonymised aggregates). Overlay on Pack trains — **not** a new T-number replacing T0–T9.

### 6.3 Scenario schema (must include locks)

```json
{
  "demand": {},
  "supply": {},
  "ops": {},
  "commercial": {
    "offerSourceMix": { "MARKETPLACE": 0.8, "DIAL_OWNED": 0.2 },
    "b2bInformalVisible": false,
    "techWhtRate": 0.30,
    "itf263Share": 0.4
  },
  "payments": { "codShare": 0.2, "escrowShare": 0.8 }
}
```

Wrong advice if D-49/D-51/D-50 omitted (eval A28).

### 6.4 Engine rules

- MAY read anonymised aggregates / rate-card versions / historical volumes  
- MUST NOT post journals, create reserves, call PSP capture, or publish Meili  
- OR-Tools only for offline packing experiments — delivery SoR unchanged  
- Output: bottleneck ranked list (“what breaks first”), confidence, recommended **internal** readiness actions mapped to §8.1

### 6.5 Acceptance

- [ ] Integration test proves simulation DB role cannot INSERT into `journal_entries` / `job_reserves`  
- [ ] SALib Morris/Sobol report stored on run  
- [ ] UI labels Simulated vs Actual; Simulated never drives auto-payout

---

## 7. Adopt — WHT / ITF263 technician economics UI (D-50)

### 7.1 Purpose

Productise “Your DIAL Take-Home”: dual path **ITF263 clearance** vs **30% withhold + remit + certificate**. Aligns §7.2 / Pack `itf263_records` + `withholding_balances`. Formalisation assist ≠ tax avoidance.

### 7.2 Surfaces

| App | Screen |
| --- | --- |
| `technician-android` / tech-web | Economics home: gross share, fees, WHT or clearance, net estimate (`amountMinor`) |
| | ITF263 status + expiry + re-verify CTA |
| | Withholding balance YTD + certificate download (react-pdf) |
| Admin | Compliance Centre: clearance queue, remittance run, exception four-eyes |
| Payout Temporal | Existing WHT decision path — UI only clarifies |

### 7.3 API

- `GET /tech/me/economics` → breakdown DTO (all integer minor units)  
- `GET /tech/me/itf263` / `POST` upload metadata (file via media service)  
- `GET /tech/me/withholding/certificates/:id.pdf`  
- Admin remittance endpoints already money-spine — AuthZ + four-eyes

### 7.4 Acceptance

- [ ] UI never implies WHT “goes away” after escrow (D-50)  
- [ ] Net display uses `amountMinor`; no float  
- [ ] Missing/invalid ITF263 + threshold → withhold path shown before accept job where policy requires  
- [ ] Counsel D-3 still Phase 0 — UI copy reviewed against opinion when available

---

## 8. Adopt with modification — Kernel + DialDomainModule

### 8.1 Modification (hard)

v7 Kernel “money primitives” **must not** become a second ledger/pricing SoR. Money remains:

- `packages/ledger`, Job Reserve, pricing engine, `@dial/promotions`, FDMS adapters  
- Outbox + Temporal for money/fiscal  

Kernel **MAY** hold: identity, orgs, permissions, audit, evidence pointers, config/feature flags, domain module registry, event envelope types.

Kernel **MUST NOT:** mutate payable amounts, hold PSP secrets in client bundles, authorize without object-level checks (D-47), or replace MapLibre delivery SoR.

### 8.2 DialDomainModule contract

```ts
interface DialDomainModule {
  name: string
  version: string
  capabilities: string[]           // e.g. 'jobs.intake', 'catalogue.publish'
  eventsEmitted: string[]
  eventsConsumed: string[]
  workflows: string[]              // Temporal workflow type names
  metrics: MetricContract[]        // Command Centre — D-54 §14
  // Forbidden: direct journal write APIs from non-money modules
}
```

Registration at boot; capability ACL enforced centrally. Pattern reference: NestJS dynamic modules (MIT) — runtime stack per Pack.

### 8.3 Feature flags (modification vs Unleash)

1. **Primary:** Postgres `feature_flags` / trade `customer_bookable` + PostHog for internal rollouts  
2. **Optional MIT/Apache:** GO Feature Flag + OpenFeature / flagd  
3. **Reject as SoR:** Unleash AGPL server (isolate like Grafana if ever used)  
4. **Certification SoR:** DIAL DB status fields — flags never override §8.1 / Appendix C

### 8.4 Acceptance

- [ ] Semgrep/CI or arch test: non-ledger packages cannot import journal posting without allowlist  
- [ ] Module registry documented in Pack monorepo map

---

## 9. Adopt with modification — Intelligence Factory (summary)

> **Depth lock:** continuous learning loop, checklist wrap, outcome-quality hierarchy, dataset/eval contracts → **D-54 §13**. This section keeps the hard modifications and placement.

### 9.1 Modification (hard)

- **AI never writes payable amounts** (C-1, non-negotiables)  
- Rename v7 `pricing-intelligence` → **`commercial-forecast`** or **`pricing-draft-assist`** — drafts/forecasts only; human + pricing engine own payable amounts  
- Eval/promote must not mutate ledger, catalogue facts, or Meili without Factory human gates  
- Privacy **D-32**; Zod structured outputs; Promptfoo before promote; Langfuse traces  
- Checklist / troubleshooting content **never auto-publishes** (Blueprint §6.2 + D-54)

### 9.2 Layout

| Path | Role |
| --- | --- |
| `packages/ai` | Existing composition SoR |
| `services/intelligence-factory` | Dataset registry, shadow runs, promote workflow |
| `packages/checklists` | SoR for checklist content; Factory wraps learning — does not fork SoR |
| `packages/ai/capabilities/*` | Per-capability modules (intake, ops draft quote, checklist draft, **commercial-forecast**) |

### 9.3 Loop (one-liner)

`train/eval → shadow → Promptfoo gates → human promote → monitor outcomes → outcome-weighted dataset refresh` — full contracts in **§13**.

Customer-visible AI prices still blocked until §5.9.

### 9.4 Acceptance

- [ ] No capability named or documented as writing `priceMinor` to customers/ledger  
- [ ] `dial-ai-capability-review` clean on Factory packages  
- [ ] Shadow traffic cannot call payout / reserve release activities  
- [ ] Checklist revisions never skip human approve (D-54)

---

## 10. Adopt with modification — CERTIFIED–DORMANT → §8.1

### 10.1 Modification (hard)

CERTIFIED / READY / DORMANT are **internal branch readiness** labels for trades, owned-stock programs, or ops capabilities. They **do not** create a public multi-phase MVP ladder (**D-37**).

| Internal label | Maps to |
| --- | --- |
| Architecture certified | Eng AC + Threat Dragon / Semgrep green for that module |
| Ops certified | Runbooks + queue SLAs |
| Intelligence certified | Promptfoo gates for that capability |
| Financial certified | Ledger paths + WHT/FDMS stubs tested (still Appendix C for launch) |
| Security certified | D-47/D-48 checks for surface |
| Branch CERTIFIED–DORMANT | Ready internally but **not** customer-bookable / not in open launch surface |
| ACTIVE | Included in single polished customer launch when Gate 3 opens |

Customer-open still requires **one** Gate 3 release when Appendix C + §8.1 Gates 0–3 are green — including D-41 WA, D-51 owned stock, etc. Dormant ≠ dumping MVP-locked items.

### 10.2 Acceptance

- [ ] Product docs never advertise “Phase 1 public / Phase 2 public” for core MVP  
- [ ] `customer_bookable` false trades can be CERTIFIED_INTERNAL  
- [ ] PostHog flags staff→dogfood only (Gate 2); not a public flag salad

---

## 11. Train overlay (does **not** renumber T0–T9)

| Theme | Earliest Pack train | Notes |
| --- | --- | --- |
| Kernel module contract | T0–T1 | Registry + AuthZ |
| Catalogue Factory | T2+ | After catalogue migrations |
| JobClass / TradeDefinition | T6 | With jobs |
| Value Score | T6 | After assignments |
| WHT economics UI | T5 | With money spine |
| Intelligence Factory | T7 | Wraps packages/ai |
| Commercial Simulation | Post–T5, prefer post-dogfood | Offline service |
| CERTIFIED–DORMANT fields | T2/T6 | Internal only |

---

## 12. Related eval items not expanded as separate D-53 bullets

Absorbed lightly where needed under D-53: Grafana AGPL isolation (OSS table); Temporal for Factory/Score/Sim (§3–6); Part III never-second-SoR doctrine + D-49/D-51 addenda. Investor demo / SupplyNetPy / Train 0–10 remain discarded/deferred per §1.

**Promoted to D-54 (searchable depth lock):** Intelligence Factory continuous learning + checklist wrap + outcome-weighted dataset refresh (eval A12/A13); Command Centre metric contracts + severity→action + Actual vs Simulated (eval A15). Catalogue Factory + Value Score remain **D-53** (complete in §§3 / 5); D-54 does not reopen them.

---

# Part II — D-54 Intelligence Factory + Command Centre metric contracts

**D-log ID:** **D-54**  
**Disposition:** **Adopt with modification** (eval A12, A13, A15)  
**Does not reopen:** C-1 AI-never-writes-money; D-32 privacy; D-37 single launch; D-49/D-50/D-51; D-52 tracer/DoD; D-53 discards (v7 SoR, Train 0–10, Unleash/OR-Tools SoR, investor demo).

| # | Item | Disposition |
| --- | --- | --- |
| 1 | Troubleshooting intelligence continuous learning (Factory wrap of checklists) | **Adopt w/ mod** — human gate + Promptfoo; never silent production mutate |
| 2 | Outcome-weighted intelligence (datasets + Value Score windows) | **Adopt w/ mod** — weights outcomes, never payable amounts |
| 3 | Command Centre metric contracts + Data→Metrics→Alert→Decision→Action | **Adopt w/ mod** — ops cockpit; not second money/BI SoR |
| 4 | Actual vs Simulated Command Centre views | **Adopt** (ties Commercial Sim §6) — Simulated never auto-pays |

---

## 13. D-54 — Intelligence Factory continuous learning (adopt w/ mods)

### 13.1 Purpose

Permit continuous improvement of troubleshooting / intake / ranking **assist** capabilities without uncontrolled silent production changes. Factory **wraps** `packages/ai` + `packages/checklists` — it does not become a second checklist or money SoR.

### 13.2 Hard modifications (locked)

1. **AI never writes payable amounts** — no capability may write `priceMinor` / Job Reserve / ledger; `commercial-forecast` / `pricing-draft-assist` = draft/forecast only.  
2. **No silent production mutate** — promote path requires Promptfoo gate + **human promote**; rollback = prior dataset/capability version.  
3. **Checklist content** follows Blueprint §6.2: outcome confidence may auto-recompute; **content revisions** = AI draft → schema-lint → human approve → versioned publish with `supersedes`; never auto-publish; danger flags never algorithmically relaxed.  
4. **Catalogue AI candidates** still require Catalogue Factory human approve (D-53 §3) before Meili.  
5. **D-32** privacy on all training/eval exports; Zod structured outputs on capabilities.  
6. **Eval SoR** = Promptfoo + Langfuse + human `AiInvocation` corrections — not Evalite/Braintrust as SoR.  
7. Shadow/canary traffic **MUST NOT** call payout, reserve release, FDMS submit, or Meili publish activities.

### 13.3 Continuous learning loop (locked)

```text
PRODUCTION EVENT
  → DATA CAPTURE (redacted / D-32)
  → QUALITY FILTER
  → LABEL + OUTCOME (outcome-quality hierarchy)
  → DATASET VERSION (immutable snapshot)
  → TRAIN / TUNE (offline)
  → EVALUATE vs frozen baseline + regression + holdout
  → SHADOW (no side-effect money/fiscal/search publish)
  → Promptfoo CI gate
  → HUMAN PROMOTE
  → MONITOR live outcomes
  → OUTCOME-WEIGHTED DATASET REFRESH (new version — never in-place mutate)
```

### 13.4 Outcome-quality hierarchy (troubleshooting labels)

| Level | Evidence | Relative weight (guidance) |
| --- | --- | --- |
| 1 | Customer symptom | Low |
| 2 | Technician observation | Low–medium |
| 3 | Diagnostic test | Medium |
| 4 | Physical evidence | Medium–high |
| 5 | Repair performed | High |
| 6 | Immediate successful outcome | High |
| 7 | Long-term success (no comeback in outcome window) | Highest |
| — | Comeback / warranty / dispute in window | Negative or dampened |

Same spirit as Value Score outcome windows (D-53 §5.5): volume ≠ quality.

### 13.5 Dataset / eval registry (Pack tables)

```text
intelligence_datasets
  id, domain, version, parent_version?,
  record_count, quality_summary jsonb, created_at, created_by

intelligence_shadow_runs
  id, capability_id, dataset_version, model_id,
  metrics jsonb, started_at, finished_at, status

intelligence_promotions
  id, capability_id, from_version, to_version,
  promptfoo_run_id, approved_by, approved_at, rollback_of?

checklist_step_outcomes          -- Blueprint §6.2
  step_id, checklist_version, job_id, payload jsonb, recorded_at
```

### 13.6 Checklist wrap (explicit)

| Concern | Owner |
| --- | --- |
| Checklist schema + approved versions | `packages/checklists` (SoR) |
| Outcome logging + confidence recompute | checklists + Factory worker |
| Draft revision proposals | `packages/ai` capability + Factory |
| Publish gate | Human ops + Promptfoo replay of frozen job outcomes |
| Estimation ranges fed by confidence | `packages/pricing` inputs only — **Quote** still rate-card engine |

### 13.7 Acceptance (Pack ACs — T7+)

- [ ] Loop implemented; no path from shadow → ledger/Job Reserve/FDMS/Meili publish  
- [ ] Checklist revision always creates new version with `supersedes`; history immutable  
- [ ] Outcome-weighted refresh creates **new** `intelligence_datasets.version` (no in-place label rewrite without audit row)  
- [ ] `dial-ai-capability-review` green on Factory + checklist-draft capabilities  
- [ ] Tracer DoD for Factory/checklist-learning epic 100% (D-52)  
- [ ] iFixit / CC BY-NC-SA content never in training sets (Blueprint §3.7)

---

## 14. D-54 — Command Centre metric contracts (adopt w/ mods)

### 14.1 Purpose

Deepen the existing queue-first Command Centre (v4 §6.17) into an ops control loop: **Data → Metrics → Alert → Decision → Action**, without replacing Prometheus/Metabase or inventing a second money SoR.

### 14.2 Modification (hard)

1. **Money SoR unchanged** — dashboards **read** ledger/reserves/payouts; never post journals or release reserves from a chart click without the existing money Temporal workflows + AuthZ/four-eyes.  
2. **Separation:** Prometheus = infra/red metrics; Metabase = exploratory BI; **Command Centre** = operational queues + contracted KPIs + actionable alerts. Do not merge into one god-dashboard that bypasses module AuthZ.  
3. **Simulated view** may show Commercial Simulation outputs (D-53 §6) beside Actual — labels mandatory; **Simulated never drives auto-payout / auto-pause of money rails**.  
4. **Investor Demonstration Mode** remains **deferred** (eval A18) — not in D-54 scope.  
5. Grafana stay **AGPL-isolated** (D-53 OSS table) if used for infra viz.

### 14.3 MetricContract (DialDomainModule)

```ts
interface MetricContract {
  id: string
  name: string
  domainModule: string           // DialDomainModule.name
  dimensions: string[]           // e.g. branchId, tradeCode, offerSource
  source: string                 // table / outbox event / rollup job
  calculation: string            // human-readable formula; one definition per id
  frequency: 'realtime' | 'hourly' | 'daily'
  ownerRole: string
  thresholds: {
    info?: number
    warning?: number
    high?: number
    critical?: number
  }
  recommendedActions?: string[]  // action catalog keys — permissioned
  actualOnly?: boolean           // true = hide from Simulated toggle
}
```

Every Command Centre KPI **must** register a `MetricContract` (via domain module registry). Duplicate ad-hoc KPI definitions in random admin pages are rejected in review.

### 14.4 Alert → action

```ts
interface OperationalAlert {
  id: string
  metricId: string
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL'
  entityType: string
  entityId: string
  branchId?: string
  probableCauses: string[]
  recommendedActionKeys: string[]
  ownerRole: string
  detectedAt: Date
  viewMode: 'ACTUAL' | 'SIMULATED'
}
```

Allowed action examples (all AuthZ + audit): pause supplier, pause trade (`customer_bookable=false`), requeue work, require four-eyes, trigger reconciliation workflow, open catalogue review, open tech recruitment — **not** “set customer price” or “release Job Reserve” without money-path workflows.

### 14.5 Actual vs Simulated

| Mode | Data | May auto-act on money? |
| --- | --- | --- |
| **Actual** | Production rollups / queues | Only via existing permissioned ops actions |
| **Simulated** | `simulation_runs` outputs | **Never** |

UI: persistent banner when Simulated; export/share must watermark “SIMULATED”.

### 14.6 Seed metric domains (non-exhaustive)

Catalogue Factory demand-gap; ingest SLA; Job Reserve aging; delivery FIFO depth; tech WHT remittance exceptions; Value Score dispute backlog; Intelligence Factory promote lag; B2B informal-leak probes (must stay zero — D-49).

### 14.7 Acceptance

- [ ] Each admin KPI tile cites `metricId` with one registered `MetricContract`  
- [ ] Actual vs Simulated toggle; Simulated watermark; no Simulated→payout path (integration test)  
- [ ] Alert actions go through AuthZ + `audit_events`  
- [ ] Money tiles are read-only unless invoking existing money Temporal/API with four-eyes where required  
- [ ] Tracer DoD for Command Centre metric-contract epic 100% (D-52)

---

## 15. D-54 train overlay (does **not** renumber T0–T9)

| Theme | Earliest Pack train | Notes |
| --- | --- | --- |
| Checklist outcome loop | T6–T7 | After jobs + checklists seed |
| Intelligence Factory registry/promote | T7 | Extends D-53 Factory stubs |
| Command Centre MetricContract registry | T8–T9 | After queues exist; Sim toggle with Commercial Sim |

---

*End of companion — locked via **D-53** (Part I §§0–12) and **D-54** (Part II §§13–15).*
