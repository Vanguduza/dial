# DIAL AI Kernel + Prime Agent — Adopted (D-61)

**Authority:** Absorbed into `DIAL_Consolidated_Plan_v4.md` as founder lock **D-61**.  
**Source evaluation:** `DIAL_AI_Kernel_Prime_Agent_Feasibility_Evaluation.md` (classified absorb only; method mirrors `DIAL_v7-2_Adjustment_Expansion_Evaluation.md`).  
**Founder clarification (definite):** **Dev Manager** (Blueprint §8.0) is the **managerial authority / Build orchestrator** throughout Plan→Build→Done; **Development Prime** is the **mandatory** session/runtime **harness** that hosts that role (install before workspace). Production multi-step / learning = **capability pipeline + Temporal/BullMQ + Factory** — **no** production agent host / adapter.  
**Non-authority:** `DIAL AI KERNEL + PRIME AGENT.md` remains a **proposal archive** — **not** SoR; cannot amend v4 §5.3 or invent a peer AI control plane.  
**Date:** 2026-08-12  
**Status:** Locked companion — implement under Agent Pack **T0–T9** + **D-56** grill / `dial-ai-capability-review` gates (never a second monorepo instruction SoR).

---

## 0. Scope of D-61

| # | Item | Disposition |
| --- | --- | --- |
| 1 | Control-plane checklist (orchestration, tool ACL, context, memory retention, eval gates, continuous improvement) | **Adopt with modification** — named responsibilities **inside `packages/ai`**, not a peer kernel. Production “orchestration” = capability composition + workers — **not** an agent-framework host |
| 2 | Tool / capability bus + capability-over-credentials | **Adopt with modification** — align `DialDomainModule.capabilities[]` + typed tools; agents never get DB creds |
| 3 | Production `DialAgentRuntime` / swappable adapter / `PrimeAgentRuntimeAdapter` | **Reject** — **no production adapter**; production path is capability-only (§5.15). Optional **dev-only** `DialAgentRuntime` docs how Dev Prime attaches — not a prod pluggable SoR |
| 4 | ERP Improvement concept → MetricContract / alert → recommended-action | **Adopt with modification** — D-54 §14 proposals only; never auto-implement / never money writes; **no agent host required** |
| 5 | Agent sandboxing YAML (§17 Kernel doc) | **Adopt with modification** — **reference pattern** for per-agent grants; not a new SoR |
| 6 | Kernel principles prose (SOR supremacy, read-heavy/write-light, …) | **Adopt** — onboarding prose only; behaviour stays v4 §5.1 / D-54 |
| 7 | Phase 1 Development Prime (`prime-agent` on developer machines) | **Adopt — mandatory** long-running **development harness** that **hosts** DIAL Dev Manager (Blueprint §8.0 = managerial authority throughout Build); install + configure **before** Dial ecosystem workspace / monorepo bootstrap; **no production data path**; not CI SoR; Cursor/`AGENTS.md` remain instruction SoR; Prime is **not** a competing project manager |
| 8 | Multi-step tool-using orchestration | **Split (definite):** **Dev** = Prime harness hosts Dev Manager / engineers / subagents building DIAL. **Prod** = `packages/ai` typed capabilities + LiteLLM→Gemini + **Temporal/BullMQ** durable sequences — **no** production agent-framework host |
| 9 | Continuous learning | **Adopt with modification** — `AiInvocation` + human corrections → Langfuse + Promptfoo + `services/intelligence-factory`; **no agent host**; no parallel eval/memory SoR |
| 10 | Troubleshooting improvement candidates (checklist/intake/skill) | **Adopt with modification** — proposals via capability/`AiInvocation` paths; publish = Factory + human promote (**D-54**); **no agent host** |
| 11 | Self-hosted / local-first inference hierarchy; S24/Termux as inference or prod node; owned GPU / self-hosted Llama-as-brain | **Reject** — §5.3 stays locked |
| 12 | Peer `packages/dial-ai-kernel`, `dial-memory`, `dial-learning`, `dial-evaluation`, `dial-security` as control planes | **Reject** |
| 13 | Prime continual harness as durable **job** lifecycle | **Reject** — Temporal/BullMQ remain job SoR |
| 14 | Wholesale generic agent roster (Financial / Procurement / …) | **Reject as block** — remap 1:1 to `packages/ai/capabilities/*` or drop |
| 15 | Production Prime / self-hosted Prime node / alternate prod agent framework | **Reject** — not deferred. No Agentis / edge-agents / SupaClaw / “any adapter” shopping. Workaround for multi-step/learning without self-host = **existing DIAL AI + Factory + Temporal**, not another product |
| 16 | Ruflo-style swarm as Cursor SoR | **Reject** — already **D-55** |
| 17 | AI writes money; auto-publish; Simulated Command Centre pays | **Reject** — existing locks stand |

**Hard constraints preserved:** v4 §5.1 seven rules; §5.3 hosting / Gemini sole brain via LiteLLM; D-32 privacy; D-47/D-55 Cursor hygiene; D-52 tracer/DoD; D-53 Kernel MAY/MUST-NOT (money = DIAL packages); D-54 Factory + MetricContract; D-56 grill + AI capability merge gate; AI never writes payable amounts.

---

## 1. Discarded (once — do not integrate)

| Discarded | Why |
| --- | --- |
| Peer `packages/dial-ai-kernel` / second “AI kernel” SoR | Collides with `packages/kernel` (non-AI) and duplicates `packages/ai` + Factory |
| `dial-memory` / `dial-learning` / `dial-evaluation` / `dial-security` as peer control planes | Eval/memory SoR = Langfuse + Promptfoo + `services/intelligence-factory` (**D-54**) |
| Local-first inference hierarchy; S24/Termux as production or inference node | Conflicts **§5.3** `[FOUNDER]` — no owned/dedicated inference hardware; Gemini sole reasoning brain |
| Self-hosted Llama/Qwen (or phone NPU) as product brain | Same — Claude gateway fallback only |
| Prime continual harness as ERP job lifecycle | Conflicts Temporal/BullMQ durable-execution SoR |
| Generic Financial/Procurement/… agent roster as scaffold targets | Not mapped to locked `capabilities/*`; speculative scaffolding banned (**D-52**) |
| **Production** `PrimeAgentRuntimeAdapter` / swappable prod agent runtime | Founder definite — production = capability pipeline only; no agent host |
| Shopping for a second OSS prod agent framework (Agentis, edge-agents, SupaClaw, etc.) | Same maturity-bar fail; **not adopted**; not a workaround for wanting multi-step/learning |
| Self-hosted Prime / node as ERP dependency | Rejected — use locked stack |
| Ruflo-style swarm / second Cursor instruction SoR | **D-55** already rejected |
| Auto-implement ERP Improvement; AI money writes; Simulated pays | **D-54** / §5.1 |

---

## 2. Method citation

Absorb decisions follow `DIAL_AI_Kernel_Prime_Agent_Feasibility_Evaluation.md` §1, plus **founder clarification** locking **Dev Manager** as Build managerial authority, **Development Prime** as the mandatory harness that hosts it, and rejecting production adapters / alternate frameworks:

1. Full read of Kernel proposal vs Pack AI / Kernel / Intelligence / agent-governance sections and D-log non-negotiables.  
2. Cross-check against v4 §5.1–§5.16, D-53/D-54, D-55, D-56.  
3. Keyword sweep for genuinely new vs already covered terms.  
4. Light web verification of Prime Agent (`PrimeIntellect-ai/prime-agent`, MIT) — maturity tagged Opinion for **production** (fails Pack bar); **development harness** use is founder-mandatory and separate from that bar.

**Founder lock:** beneficial Kernel ideas + Dev Manager as Build manager + Development Prime as harness; production multi-step/learning on the **locked stack only**. **Do not re-grill** this absorb — encode and implement under existing gates.

---

## 3. Adopt — control plane inside `packages/ai`

### 3.1 Named responsibilities (not a peer package)

| Responsibility | Home | Notes |
| --- | --- | --- |
| Production multi-step tool/RPC sequences | `packages/ai` composition (§5.15) + Temporal/BullMQ workers | Durable sequences — **not** an agent-framework host |
| Security / tool ACL | Policy layer + capability grants | Capability-over-credentials; no agent DB roles |
| Context packing | Existing §5.15 Context pack | Postgres + embeddings; omit-identity (**D-32**) |
| Memory retention rules | Policy + Factory dataset rules | No `dial-memory` package SoR |
| Eval gates | Promptfoo CI + Langfuse + human | **D-54** |
| Continuous improvement | `services/intelligence-factory` | Shadow→Promptfoo→human promote |

### 3.2 Tool / capability bus

- Typed tools only; **no raw SQL** from model paths.  
- Scope tools to `DialDomainModule.capabilities[]` / `packages/ai/capabilities/*`.  
- Never receive `SUPABASE_SERVICE_ROLE_KEY`, PSP keys, or WA tokens in model/tool grants.

### 3.3 Agent sandboxing YAML

Kernel doc §17 YAML shape is a **reference pattern** for expressing per-capability grants. SoR for grants remains module registry + capability allowlist — not a new sandbox config SoR.

### 3.4 Principles prose

SOR supremacy, Prime-is-never-SOR (for ERP data), read-heavy/write-light, evidence-before-learning, AI-failure-must-not-break-core — OK for onboarding. **Behaviour** remains v4 §5.1 / D-54.

---

## 4. Production AI path — capability pipeline only (no adapter)

### 4.1 Definite production path

| Layer | Lock |
| --- | --- |
| Composition | `packages/ai` §5.15 — typed capabilities, Zod, privacy (**D-32**) |
| Models | **Only** LiteLLM aliases → Gemini (Claude = gateway outage fallback) |
| Durable multi-step | **Temporal** and/or **BullMQ** workflows/jobs invoking capabilities / typed RPC — retries, timeouts, audit stay here |
| Learning / eval | Langfuse + Promptfoo + `services/intelligence-factory` + human `AiInvocation` corrections |
| Command Centre | MetricContract → alert → recommended-action (**D-54**) |
| Data / workers | Supabase/Postgres + existing Edge/Temporal workers — **already the locked stack** |

**No production agent-framework host.** No `PrimeAgentRuntimeAdapter` in prod. No shopping for Agentis / edge-agents / SupaClaw / “any runtime.”

### 4.2 Target layout (docs lock — scaffold later under D-56)

```text
packages/ai/
  composition          # existing §5.15 — production SoR for AI wiring
  capabilities/*       # existing typed public capabilities
  # optional later: thin sync routers that enqueue Temporal/BullMQ — not an agent host
  # optional DEV-ONLY (not prod SoR):
  #   runtime/DialAgentRuntime.ts  # documents how Development Prime attaches locally
```

### 4.3 Dev-only interface (optional documentation — not prod SoR)

If engineers want a typed boundary for **local** Development Prime attach points, a **dev-only** `DialAgentRuntime` sketch may live under docs or a clearly non-prod path. It must **not** become a swappable production requirement, CI default, or excuse to adopt a second OSS agent product.

```ts
// Conceptual DEV-ONLY — how Development Prime may attach locally
// NOT a production pluggable SoR; NOT required for learning / multi-step ERP work
export interface DialAgentRuntime {
  run(input: {
    capabilityOrGoal: string
    toolGrantIds: string[]
    correlationId: string
    // never: dbCreds, serviceRole, payable amounts, prod secrets
  }): Promise<{
    status: 'ok' | 'abstain' | 'needs_human'
    notes?: string
  }>
}
```

---

## 5. Adopt — Phase 1 Development Prime (**mandatory** harness for Dev Manager)

| Aspect | Lock |
| --- | --- |
| What | **Prime Agent** = mandatory long-running **development runtime/harness** (RLM, subagents, detachable sessions) — Prime Intellect MIT [`prime-agent`](https://github.com/PrimeIntellect-ai/prime-agent) on developer machines. **DIAL Dev Manager** (Blueprint §8.0) = **managerial authority / orchestrator role** for the entire Build process |
| When | Install + configure Prime **before** Dial ecosystem workspace / monorepo bootstrap (before T0 thrash; before “paste Dev Manager into empty Cursor without Prime”) |
| Bootstrap order | (a) install/configure Prime as **harness** → (b) open DIAL repo → (c) Dev Manager prompt runs **inside** that session (Prime hosts/attaches the Dev Manager role) |
| Authority | **Dev Manager** owns managerial duties throughout Plan→Build→Done (ticket hygiene, D-52 DoD, responsive web, living docs, train sequencing). Cursor / `AGENTS.md` / Pack / dial-* skills remain **instruction SoR**. Prime does **not** replace Dev Manager duties or Pack authority docs — it is **not** a competing project manager |
| Data | **No production data path** |
| CI | Not CI SoR |
| Complements | Hygiene skills remain mandatory for money/IDOR/AI reviews |

This is **not** an optional nice-to-have. Skipping Prime and bootstrapping the monorepo with bare Cursor paste alone is out of order for Build — Dev Manager needs the harness; the harness does not absorb the manager role.

---

## 6. Adopt with modification — learning, troubleshooting, ERP Improvement (**no agent host**)

Self-learning, troubleshooting improvement, and ERP Improvement **are achieved** via Intelligence Factory + Langfuse + Promptfoo + MetricContract + `packages/ai` capabilities + Temporal — the same *outcomes* Prime’s continual-learning story aimed at. What is **not** adopted is Prime (or any agent host) as the **production driver** of those loops. Outcomes ≠ requiring Prime inside the ERP.

Continuous learning (3), troubleshooting proposals (4), and ERP Improvement (5) **do not need an agent host**. Workaround for wanting multi-step/learning without self-host = **use existing DIAL AI + Factory + Temporal**, not another product.

### 6.1 Continuous learning

Emit via:

- `AiInvocation` + human corrections  
- Langfuse (tracing / prompt versions)  
- Promptfoo (CI / promote gates)  
- `services/intelligence-factory` (`intelligence_datasets` / shadow / promotions)

**Rejected as SoR:** parallel `dial-evaluation` / `dial-memory` / `dial-learning` packages; production Prime/adapter as learning runtime.

### 6.2 Troubleshooting improvement

Capability / `AiInvocation` paths may **propose** checklist / intake / skill candidates. **Publish** = Factory + human promote (**D-54**). No auto-publish. No agent host required.

### 6.3 ERP Improvement

Map to Command Centre **MetricContract** → alert → **recommended-action** (D-54 §14). Proposals only; human decides; never auto-implement; never money writes; Simulated never auto-pays. No agent host required.

### 6.4 Capability roster

Remap Kernel/Prime generic agents **1:1** onto existing `packages/ai/capabilities/*` names (`guidedIntake`, `clientAssessment`, `opsDraftQuote`, commercial-forecast / pricing-draft-assist, catalogue AI candidates, etc.) or **drop**. Do not scaffold speculative Financial/Procurement agents.

---

## 7. §5.3 affirmation

**Unchanged:** deterministic-first hosting ladder; **no** owned GPU / self-hosted Llama-as-brain; **Gemini** sole reasoning brain via LiteLLM; Claude = gateway outage fallback only. Kernel proposal’s local-first / S24 inference hierarchy is **rejected** — not deferred as a product path. **No** self-hosted Prime/node as ERP inference or orchestration host.

---

## 8. Gates (mandatory)

| Gate | When |
| --- | --- |
| Development Prime installed + configured (harness); Dev Manager runs inside it | **Before** workspace/monorepo Build bootstrap (Blueprint §8.0) |
| `dial-grill-locks` (**D-56**) | Before scaffold of AI composition / Temporal AI workflows under `packages/ai` |
| `dial-ai-capability-review` (**D-56**) | Before merge of `packages/ai` changes |
| Feature DoD 100% (**D-52**) | Ticket incomplete until DoD + evidence |
| Factory promote (**D-54**) | Before any checklist/AI/skill publish from proposals |

---

## 9. Acceptance checklist

- [ ] No peer `packages/dial-ai-kernel` (or `dial-memory` / `dial-learning` / `dial-evaluation` / `dial-security` control planes)  
- [ ] Production AI = capability pipeline only — **no** prod `PrimeAgentRuntimeAdapter` / alternate agent framework  
- [ ] Durable multi-step ERP work uses Temporal and/or BullMQ → workers → typed capabilities  
- [ ] All model calls via LiteLLM aliases only  
- [ ] Learning / troubleshooting / ERP Improvement use AiInvocation + Langfuse + Promptfoo + Factory + MetricContract — **no agent host**  
- [ ] Development Prime installed/configured **before** Dial workspace bootstrap as **harness**; Dev Manager (managerial authority) runs inside that session  
- [ ] Cursor/`AGENTS.md` remain instruction SoR; Prime not a second monorepo instruction plane or competing project manager  
- [ ] §5.3 self-host / S24-as-brain / self-hosted Prime-as-ERP-host absent from design and tickets  
- [ ] D-56 grill + capability review + D-52 DoD evidenced on related PRs  

---

## 10. Related documents

| Doc | Role |
| --- | --- |
| `DIAL_AI_Kernel_Prime_Agent_Feasibility_Evaluation.md` | Classifier — status **Adopted with modification as D-61**; see §7 founder clarification overlay |
| `DIAL AI KERNEL + PRIME AGENT.md` | Proposal archive only — superseded as SoR |
| `DIAL_Build_Blueprint_and_Cursor_Prompt.md` §8 / §8.0 | Dev Manager = Build manager throughout; bootstrap: Prime harness → repo → Dev Manager |
| `DIAL_v7_2_Adopted_Platform_Extensions.md` | D-53 Kernel MAY/MUST-NOT; D-54 Factory + MetricContract |
| `DIAL_External_Skills_Repos_Utilization.md` | D-55 — no Ruflo swarm SoR |
| v4 §5.1 / §5.3 / §5.15 | AI rules, hosting, composition |

---

*End of D-61 companion.*
