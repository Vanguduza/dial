---
name: dial-ai-capability-review
description: >-
  Audits packages/ai capabilities for D-32 privacy, Zod structured output,
  Promptfoo/Langfuse hooks, and AI-never-writes-money. Mandatory before merge of
  packages/ai changes (D-56). Prefer audit report before fixes. Complements D-54
  Factory promote. Inspired by AI Hero evals + structured-output + guardrails posts.
---

# DIAL AI capability review

## When to use

**Locked (D-56):** before **merge** of changes to `packages/ai`, public capabilities, governed Hermes conversation/tool capabilities, provider routing, memory/context, or AI-related Promptfoo/Langfuse config.

Also when reviewing AI work in plan phase (alongside `dial-grill-locks`).

Does **not** replace **D-54** Intelligence Factory shadow→Promptfoo→human promote for checklist/dataset production.

## Workflow (audit-then-fix)

Inspired by AI Hero eval/guardrail teaching + DIAL locks — **report first**, fix only after user asks.

1. List capabilities / prompts / schemas touched.
2. Check each against the checklist below.
3. Output Critical / High / Medium — **do not auto-fix** unless asked.

## Checklist

- [ ] Composition stays DIAL Gateway/Policy → Privacy Context Compiler/Egress Firewall → typed context/tools → approved provider/model via D-61 Provider Bridge/Hermes → Zod → Langfuse/Promptfoo; domain services remain SoR
- [ ] **D-32 + D-61:** minimum-purpose context uses opaque subject IDs; no unnecessary name/phone/address/ID; provider data-class eligibility checked; Presidio/egress scan catches free-text PII; Health isolation enforced
- [ ] Structured output: Zod schema with `.describe()` on non-obvious fields; prefer `.nullable()` over `.optional()`
- [ ] **No payable amounts**, prices, refunds, or ledger writes from AI (drafts only; human + pricing engine)
- [ ] Part/fitment matching stays deterministic (`pg_trgm`/RapidFuzz) — not LLM SoR for part numbers
- [ ] Promptfoo assertions cover schema + no-money + privacy omit list where applicable
- [ ] Langfuse / `AiInvocation` logging present for cost + correction flywheel
- [ ] Public chat-like surfaces: safe-self-help allowlist / fail closed (C-1); optional cheap Flash-Lite guardrail organ is additive only
- [ ] D-61 manager-seat policy: complex/high-impact work cannot silently downgrade to a non-`managerEligible` model
- [ ] D-61 tool policy: no raw SQL/service-role/PII-vault/PSP-secret tool; every tool maps H0–H4 + AuthZ + idempotency where side-effecting
- [ ] D-61 memory/R2: R2 is archive/evidence/analytics only; memory facts are purpose/domain/sensitivity scoped; no universal sensitive memory blob
- [ ] D-61 intelligence: material narratives carry evidence + epistemic label; simulations cannot act on production money; supplier outputs pass confidentiality/cohort checks
- [ ] No `NEXT_PUBLIC_` / `VITE_` secrets; no Baileys or unofficial WA in AI tooling

## Authority

v4 §5.7–5.15, §6.10, **§6.24 / D-61**; D-log **D-56** (merge gate) + **D-54** (Factory promote); Agent Pack §2.2; `DIAL_AIHero_Adaptations.md`; `dial-non-negotiables.mdc`.
