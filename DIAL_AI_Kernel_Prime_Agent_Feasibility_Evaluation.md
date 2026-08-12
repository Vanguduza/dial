# DIAL AI Kernel + Prime Agent — Feasibility Evaluation

**Documents evaluated:** `DIAL_AI_KERNEL___PRIME_AGENT.md` ("the Kernel doc") against `DIAL_Complete_Plan_and_Development_Pack.md` (62 inlined sources, compiled 2026-08-11 — "the Pack")
**Authority baseline:** `DIAL_Consolidated_Plan_v4.md` (D-1…D-61) + `DIAL_Development_Agent_Pack.md` + `DIAL_v7_2_Adopted_Platform_Extensions.md` (D-53/D-54) + `DIAL_AI_Kernel_Prime_Agent_Adopted.md` (**D-61**) + `AGENTS.md` / `.cursor/rules/dial-non-negotiables.mdc`
**Date:** 2026-08-12
**Status:** **Adopted with modification as D-61** — classifier archive; absorb SoR is companion `DIAL_AI_Kernel_Prime_Agent_Adopted.md` (locked into `DIAL_Consolidated_Plan_v4.md`). Mirrors the method of `DIAL_v7-2_Adjustment_Expansion_Evaluation.md`.

---

## 0. Overall verdict

**Mixed, with a real gap and a real conflict.**

The Kernel doc is a well-reasoned *governance philosophy* for AI in an ERP — SOR supremacy, capability-over-credentials, read-heavy/write-light, evidence-before-learning, reversible learning, AI-failure-must-not-break-core. None of that is new to DIAL: it is independently, and more concretely, already encoded in the Pack's "seven rules" (v4 §5.1), the D-53/D-54 Intelligence Factory locks, and the RLS/role model. Where the two documents state the same principle, DIAL's version is the more specific and more enforceable one, so the Kernel doc adds confirmation, not new policy.

Where it stops being just philosophy and becomes a **concrete deployment proposal** — Samsung S24 + Termux + Prime Agent as a local-first private execution node, with a new top-level "Dial AI Kernel" package — it conflicts with locked, founder-tagged decisions (`[FOUNDER]`, v4 §5.3) that already ruled out self-hosted reasoning models and owned/dedicated inference hardware, and it duplicates infrastructure that already exists (`packages/ai`, `services/intelligence-factory`, Langfuse, Promptfoo) under a colliding name (`packages/kernel` already means something else entirely).

**Feasible, but only after re-scoping** (superseded in part by founder clarification — see **§7**): treat **Dev Manager** as Build managerial authority and **Prime Agent** as the **mandatory development harness** hosting that role (before workspace), and treat production multi-step/learning as the **existing** `packages/ai` capability pipeline + LiteLLM→Gemini + Temporal/BullMQ + Factory — **not** a production agent-framework host or swappable adapter. The S24/local-inference piece, as written, does not clear the bar and is **rejected**.

---

## 1. Method

1. Full read of both documents (Kernel doc: 2,169 lines / 43 sections, in full. Pack: 18,704 lines / 62 sources — targeted read of all AI/Kernel/Intelligence/agent-governance sections, D-log non-negotiables, RLS matrix, table inventory, env catalog).
2. Cross-check against the Pack's own locked AI architecture (v4 §5.1–§5.16), D-53/D-54 (Intelligence Factory + Kernel MAY/MUST-NOT), D-55 (external agent/skill utilization precedent), D-56 (grill-locks + AI capability review gates).
3. Keyword sweep of the Pack for Kernel-doc-specific terms (`Prime Agent`, `S24`, `Termux`, `RLM`, `AI Gateway`, `pgvector`) to establish what is genuinely new versus already covered.
4. Light web verification on the one load-bearing external claim — that "Prime Agent" is a real, specific piece of software — tagged Verified/Opinion in §5 below, in the same style the Pack itself uses for OSS claims.

---

## 2. What the Kernel doc actually proposes (summary)

Four layers: (1) System of Record — Postgres/Supabase, unchanged from DIAL's existing SoR; (2) **Dial AI Kernel** — a new control plane for agent orchestration, security/tool-access, context, memory, evaluation, continuous improvement; (3) **Prime Agent Runtime** — an external open-source agent execution engine (RLM + persistent IPython + subagents + skills + "continual harness"), deployed on a **Samsung Galaxy S24 running Termux** as the initial private execution node; (4) **Development AI** — a separate, more-privileged deployment of the same tool used to help build DIAL itself.

Core principles asserted: SOR supremacy, Prime-is-never-SOR, capability-over-credentials (agents get typed tools, not DB creds), private-by-default / no personal-data export, a four-tier "local-first" model-provider hierarchy (S24 local model → private model server → internal cluster → external provider last), read-heavy/write-light, human approval gates, evidence-based reversible learning, dev/prod as separate trust domains, and a `DialAgentRuntime` abstraction so DIAL isn't hard-coupled to Prime Agent internals. Nine-phase rollout from "Development Prime" through "Controlled Automation."

---

## 3. Where it already matches locked DIAL architecture (no new decision needed)

| Kernel doc principle | Already locked as | Pack citation |
| --- | --- | --- |
| AI never becomes the SOR / never alters authoritative records | **Rule 1: AI never writes money** — writes only to `AiInvocation` / `JobAssessment` | v4 §5.1 |
| Capability-over-credentials; agents get tools, not DB creds | `DialDomainModule.capabilities[]`; RLS role matrix has no agent/service-bypass role; `ai_invocations` insertable only via `service_role` | D-53 §8.2; Pack §12 RLS matrix |
| Private-by-default / no personal-data export | **Rule 6**: name/phone/address/ID omitted entirely from outbound payloads; Presidio for free text | v4 §5.7 / D-32 |
| Structured output only, confidence + abstain path | **Rules 3–4**: Zod-validated JSON or fallback-to-human; explicit abstain | v4 §5.1 |
| Recommendations before automation / human approval gates | D-54 hard mod: no auto-publish without Promptfoo + human promote | D-54 §13.2 |
| Evidence-based, versioned, reversible learning | `intelligence_datasets` versioning, outcome-quality 7-level hierarchy, shadow→canary→promote, rollback | D-54 §13.3–13.5 |
| AI failure must not break core ERP | Every AI path has a manual/deterministic equivalent; AI sits behind a gateway, not inline in transactions | v4 §5.2, cost table |
| Dev vs. prod as separate trust domains | `dial-grill-locks` (plan-phase) / `dial-ai-capability-review` (merge gate) already gate any `packages/ai` change; scaffolding-now vs. launch-blocked split (§4) | Agent Pack §2.2, §4 |

This table is the good news: nothing above requires a new founder decision. It's already how DIAL works. The Kernel doc is useful here mainly as clean prose for onboarding — it doesn't change any behavior.

---

## 4. Conflicts, gaps, and resolutions

### 4.1 — Local-first / S24 inference vs. the locked four-tier hosting model

**Proposes (§13, §14):** a "local-first" hierarchy — Tier 1 = local model on the S24, Tier 2 = private model server, Tier 3 = internal cluster, Tier 4 = external provider only as last resort, "for explicitly permitted, non-personal, appropriately sanitised information."

**Conflicts with:** v4 §5.3, `[FOUNDER]`-tagged: *"What this rules out, explicitly: running a large vision-language model or a large LLM on DIAL's own machines; any 'self-hosted Llama/Qwen for reasoning' plan; a dedicated vector database; a GPU instance held for availability."* The locked model is the *inverse* priority order — deterministic code first, small model second, big (external, rented) model last — justified by DIAL's actual launch volume (hundreds of transactions/month, not thousands), where fixed inference cost is "the wrong shape entirely." The AI stack — LiteLLM → **Gemini** as sole reasoning brain, Claude only as an outage fallback, never a parallel brain — is in the "do not re-debate" tooling defaults table (Agent Pack §5).

**Why this matters beyond naming:** it isn't just that DIAL picked a different vendor. A phone cannot plausibly clear the accuracy bar for the exact capability the Pack already flagged as the hardest to self-host at any acceptable quality — messy real-world vision-language understanding (photos of parts, damage, VINs) — which is central to DIAL's actual AI capabilities (`guidedIntake`, `clientAssessment`). If a CPU box can't do this well enough, a phone's NPU is a harder constraint, not an easier one.

**Resolution:** Reframe the S24 node as an **orchestration host, not an inference host**. It runs Prime Agent's harness/reasoning-loop logic and calls out to the *existing* LiteLLM→Gemini gateway for actual model calls — i.e., it becomes a client of Tier 3 in the Pack's own four-tier model (§5.3), not a competing Tier 1. Reserve genuine on-device inference, if wanted at all, for Tier-0-style narrow jobs already permitted in-process (embeddings, hashing, rule-based redaction) — not open-ended reasoning.

**One nuance worth the founder's own call, not an engineering default:** the Pack's tiering optimizes for *cost shape at low volume*. If the S24 idea was motivated by something else — data sovereignty / minimizing exposure to Zimbabwe's digital-services withholding tax and foreign-exchange caps on non-resident software suppliers (v4 §1, researched 2026-08-11) rather than cost — that's a legitimate, separate strategic question. It doesn't change the technical verdict above (the phone still can't do the reasoning work at quality), but it's worth naming explicitly rather than assuming the S24 proposal was simply an oversight.

---

### 4.2 — "Dial AI Kernel" name and scope collide with the existing `packages/kernel`

**Proposes (§4, §33):** a new top-level "Dial AI Kernel" as the control plane for agent orchestration/security/memory/evaluation, with a repo layout including `packages/dial-ai-kernel`, `dial-agent-sdk`, `dial-agent-runtime`, `dial-tools`, `dial-memory`, `dial-learning`, `dial-evaluation`.

**Conflicts with:** the Pack already has a `packages/kernel` — deliberately minimal, explicitly **not** AI (identity, tenancy, money primitives, state machines, audit, evidence, consent). Its own doctrine warns against exactly the failure mode a second "kernel" invites: *"A common failure in platform architecture is turning the kernel into a 'god module' containing every feature used by every business."* (v7-2 Part II §2.1, adopted D-53 §8). Separately, the Pack already has `packages/ai` (composition SoR), `packages/intelligence` (feature-engineering/embeddings/eval), and `services/intelligence-factory` (dataset/eval pipeline) — so "Dial AI Kernel" would be a *third* AI-adjacent namespace on top of two that already exist.

**Resolution:** Don't create a peer "kernel." Position the orchestration layer *inside or beside* `packages/ai` (e.g. `packages/ai/orchestrator` or `packages/agent-runtime`), and explicitly map its responsibilities against `packages/kernel`'s MAY/MUST-NOT list (D-53 §8.1) so there's no reader confusion about which "kernel" governs what. Rename before any scaffolding — this is a five-minute fix that prevents a permanent documentation headache.

---

### 4.3 — Continuous-learning/evaluation machinery is proposed from scratch but already exists

**Proposes (§19–§24):** a custom "Continuous Learning Architecture" (Observation → Hypothesis → Recommendation → Evidence Validation → Confidence → Candidate Knowledge → Approved Knowledge) and an "Agent Evaluation Engine" tracking accuracy / false-positive / hallucination rate / ACTIVE-LIMITED-UNDER_REVIEW-DISABLED states.

**Overlaps with:** `services/intelligence-factory`'s already-locked loop (production event → data capture → quality filter → label/outcome → dataset version → train/tune → evaluate vs. baseline → shadow → canary → promote → monitor → outcome-weighted refresh) and its 7-level outcome-quality hierarchy — conceptually identical, more specific, and already wired to **Promptfoo** (CI eval gate, MIT) and **Langfuse** (self-hosted tracing/eval/prompt-versioning/dataset-annotation, MIT core) as the locked eval SoR (D-54 §13.2: *"Eval SoR = Promptfoo + Langfuse + human `AiInvocation` corrections — not Evalite/Braintrust as SoR."*).

**This is the closest thing to genuinely good news in this evaluation** — the two philosophies are not just compatible, they're the same idea, independently arrived at. The risk isn't disagreement, it's *duplication*: building a second, bespoke evaluation/versioning system alongside a self-hosted one that already does this.

**Resolution:** Don't build a parallel engine. Extend the existing `intelligence_datasets` / `intelligence_shadow_runs` / `intelligence_promotions` schema and Langfuse traces with agent-specific fields (subagent call graphs, tool-call efficiency, per-agent ACTIVE/LIMITED/DISABLED status as a thin view over existing promotion records) rather than standing up new infrastructure.

---

### 4.4 — Durable execution: Prime's own lifecycle machinery vs. Temporal/BullMQ

**Proposes (§5, §31):** Prime Agent's "continual harness" — background sessions, heartbeats, schedules, persistent goals — as the mechanism for long-running agent work, with an "AI Job Queue" sketched between a Supabase Edge Function and the Kernel.

**Gap:** Temporal (locked, used for money/fiscal/project-milestone/delivery-dispatch workflows) and BullMQ (Redis-backed queues) already are DIAL's durable-execution substrate, and neither is mentioned once in the Kernel doc. Standing up a second durable-execution mechanism inside Prime Agent, parallel to Temporal, is exactly the kind of infrastructure duplication the Pack's monorepo doctrine warns against elsewhere (D-53 §12 — "never a second source of truth").

**Resolution:** This is a naming gap, not a design conflict — the Kernel doc's own "AI Job Queue" sketch should literally *be* a Temporal workflow or BullMQ job, not a bespoke queue inside Prime's harness. Prime Agent's heartbeats/background-sessions are fine to use for *within-agent* bookkeeping, but the job lifecycle DIAL cares about (retries, timeouts, audit) should stay in the tools already trusted for that.

---

### 4.5 — Prime Agent's maturity does not yet clear DIAL's own bar for production dependencies

**Verified (web, 2026-08-12):** "Prime Agent" is real, specific software — [`PrimeIntellect-ai/prime-agent`](https://github.com/PrimeIntellect-ai/prime-agent), from Prime Intellect, **MIT licensed**. It matches the Kernel doc's technical description closely and accurately, including the doc's own caveat that it is *"not a security sandbox"* — model-generated Python and project commands run with the host's OS-level user permissions. It was released roughly a week before this evaluation (~Aug 6, 2026) and is pre-1.0 (v0.7.x), shipping releases very rapidly.

**Why this matters:** the Pack applies a consistent maturity bar to every OSS dependency it adopts — verified license *and* verified maturity, with young or "research-led" projects explicitly deferred even when MIT-licensed and reputable (e.g. SupplyNetPy: *"Verified existence; Defer adoption"* specifically for research-led maturity, despite an arXiv paper and a real GitHub repo backing it). A one-week-old, pre-1.0, fast-iterating framework — however good the underlying idea — reads the same way by that standard, and more so for a *production* ERP intelligence dependency than a research tool.

**Resolution (historical classifier text):** Phase 1 Development Prime on a developer's machine, no production data path, was the only low-risk path; production Prime failed the maturity bar. **Founder clarification (§7) supersedes the adapter-hedge:** do **not** build a production `PrimeAgentRuntimeAdapter` or shop for Agentis / edge-agents / SupaClaw / “any runtime.” Development Prime is **mandatory** as the Build **harness** hosting Dev Manager; production multi-step/learning uses the locked stack only.

---

### 4.6 — The specialized agent roster reads as generic, not DIAL-specific

**Proposes (§15):** Diagnostic, Production Intelligence, Maintenance Intelligence, Inventory Intelligence, Commercial Intelligence, Financial Intelligence, Procurement Intelligence, Workforce/Technician Intelligence, and ERP Improvement agents — framed in general manufacturing/ERP language (production downtime, maintenance intervals, procurement lead time, cash-flow analysis).

**Gap:** none of DIAL's actual, already-named AI capabilities — `guidedIntake`, `clientAssessment`, `opsDraftQuote`, checklist-draft, `commercial-forecast` (deliberately renamed from "pricing-intelligence" specifically to avoid implying it writes prices — D-53 §9.1), Catalogue Factory AI candidates, Technician Value Score — line up cleanly with this roster. Several proposed agents ("Financial Intelligence Agent" doing cash-flow analysis, "Procurement Intelligence Agent" doing supplier risk) don't map to anything currently scoped for DIAL at all. This reads like it was drafted at a platform-agnostic level rather than against DIAL's locked capability list.

**Resolution — genuinely worth keeping:** the **ERP Improvement Agent** concept (watching for inefficient workflows, repetitive actions, recurring errors, generating improvement proposals rather than auto-implementing them) has no direct equivalent in the Pack today. It's a legitimate, additive idea — it could feed the Command Centre's alert → recommended-action framework (D-54 §14) as a new metric-contract source rather than becoming a standalone agent. Everything else in the roster should be remapped one-for-one onto DIAL's actual `packages/ai/capabilities/*` naming and scope before being treated as a build target, and anything with no current DIAL use case should be dropped rather than carried as speculative scaffolding.

---

## 5. External verification summary

| Claim in Kernel doc | Result | Label |
| --- | --- | --- |
| "Prime Agent" is a real, existing agent framework with RLM + continual harness + subagents | `PrimeIntellect-ai/prime-agent`, MIT, matches description closely | **Verified** |
| Prime Agent's kernel/worker is "not a security sandbox"; runs with user OS permissions | Confirmed by the project's own docs, verbatim | **Verified** |
| Prime Agent is mature/stable enough to be a production dependency | Pre-1.0 (v0.7.x), ~1 week old at time of writing, rapid release cadence | **Opinion** — fails the Pack's own maturity bar for production (cf. SupplyNetPy deferral) |
| A phone-hosted local model can serve as DIAL's "Tier 1" reasoning brain | Consistent with general mobile-inference constraints and with the Pack's own finding that even a CPU server box can't self-host vision-language work at acceptable quality | **Opinion**, but strongly supported by the Pack's existing (verified-in-context) §5.3 analysis |

---

## 6. Recommended next actions

### Adopt now (costs nothing, changes no architecture)
- Keep the Kernel doc's principles as reference prose for engineer onboarding: SOR supremacy, capability-over-credentials, read-heavy/write-light, AI-failure-must-not-break-core. They restate what's already locked; no D-log entry needed.
- Keep the Agent Sandboxing YAML shape (§17) as a reference pattern for how `DialDomainModule.capabilities[]` grants might eventually be expressed per-agent.

### Adopt with modification (locked as D-61 — see companion + §7)
- **Production multi-step** — typed capabilities inside `packages/ai` + LiteLLM→Gemini + Temporal/BullMQ durable sequences; **no** production agent-framework host.
- **ERP Improvement** — remap onto Command Centre MetricContract/alert → recommended-action (D-54 §14); **no agent host**.
- **Continuous learning / troubleshooting proposals** — `AiInvocation` + Langfuse + Promptfoo + `services/intelligence-factory`; **no agent host**.

### Adopt — Development Prime (definite; §7)
- **Mandatory** development **harness** hosting **DIAL Dev Manager** (Blueprint §8.0 = managerial authority throughout Build) — install + configure **before** Dial workspace/monorepo bootstrap; no prod data path; Cursor/`AGENTS.md` remain instruction SoR; Prime is **not** a competing project manager.

### Reject (definite — not deferred)
- **Production Prime** / self-hosted Prime node / `PrimeAgentRuntimeAdapter` / swappable prod agent runtime.
- **Alternate prod agent frameworks** (Agentis, edge-agents, SupaClaw, “any adapter”) — same maturity-bar fail; not a workaround.
- **Samsung S24 / Termux** as production or inference node.
- **"Local-first" as the default/preferred inference tier** — inverts §5.3.
- Peer `dial-ai-kernel` / parallel memory-eval packages; Prime harness as Temporal/BullMQ replacement.
- Any framing where Prime Agent's own harness/memory becomes a second system of record for agent quality — Langfuse + Promptfoo + `intelligence-factory` already hold that role.
- Wholesale specialized agent roster (§15) beyond remaps onto existing capabilities — remap or drop.

### Immediate process step
D-61 is **already locked** in the companion — do not re-grill the absorb. Before scaffolding `packages/ai` multi-step Temporal/BullMQ wiring, still run **`dial-grill-locks`** (D-56) on the concrete design tree. Ruflo swarm remains rejected (**D-55**); same reasoning bars alternate prod agent frameworks.

---

## 7. Founder clarification overlay (definite — supersedes adapter/optional language above)

Encode in companion `DIAL_AI_Kernel_Prime_Agent_Adopted.md`. Where this section conflicts with earlier “optional Phase 1,” “defer production Prime,” or “DialAgentRuntime / any adapter hedge” wording in §§0–6, **this section wins**.

| # | Question | Definite answer |
| --- | --- | --- |
| Q1 | Development manager vs harness | **Dev Manager** (Blueprint §8.0) = managerial authority / Build orchestrator throughout. **Prime Agent** = mandatory session/runtime **harness** hosting that role — install + configure **before** Dial ecosystem workspace/monorepo bootstrap; then open repo; Dev Manager runs **inside** that session. Not optional. Prime is not a competing project manager. |
| Q2 | Multi-step tool-using | **Dev** = Prime harness hosts Dev Manager / engineers / subagents. **Prod** = `packages/ai` capabilities + LiteLLM→Gemini + **Temporal/BullMQ**. No production agent-framework host. |
| Q3 | Continuous learning | **No agent host** as production driver — same *outcomes* via `AiInvocation` + human corrections, Langfuse, Promptfoo, `services/intelligence-factory` on Supabase/Postgres + existing workers (outcomes ≠ requiring Prime inside the ERP). |
| Q4 | Troubleshooting proposals | **No agent host** as production driver — propose via capability/`AiInvocation`; publish = Factory + human (**D-54**). |
| Q5 | ERP Improvement | **No agent host** as production driver — MetricContract → recommended-action (**D-54**); never auto-implement / never money writes. |

**Explicit rejects:** no self-hosted Prime/node; no production `PrimeAgentRuntimeAdapter`; no shopping for a second OSS prod agent runtime; workaround for multi-step/learning without self-host = **existing DIAL AI + Factory + Temporal**, not another product.

*End of evaluation. Founder lock: **D-61** — see `DIAL_AI_Kernel_Prime_Agent_Adopted.md` (Dev Manager = Build manager; Prime = mandatory harness; prod capability pipeline only; S24/local-inference **rejected**; §5.3 affirmed).*
