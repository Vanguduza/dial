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

**Locked (D-56):** before **merge** of changes to `packages/ai`, public capabilities (guidedIntake, clientAssessment, opsDraftQuote, checklist drafts, translate, Spare CRM/performance), LiteLLM routing, or AI-related Promptfoo/Langfuse config.

Also when reviewing AI work in plan phase (alongside `dial-grill-locks`).

Does **not** replace **D-54** Intelligence Factory shadow→Promptfoo→human promote for checklist/dataset production.

## Workflow (audit-then-fix)

Inspired by AI Hero eval/guardrail teaching + DIAL locks — **report first**, fix only after user asks.

1. List capabilities / prompts / schemas touched.
2. Check each against the checklist below.
3. Output Critical / High / Medium — **do not auto-fix** unless asked.

## Checklist

- [ ] Composition stays Policy → Privacy → … → Gemini (LiteLLM) → Zod → Langfuse/Promptfoo (v4 §5.15)
- [ ] **D-32:** no name/phone/address/ID in outbound model payloads; Presidio only for free-text scrub
- [ ] Structured output: Zod schema with `.describe()` on non-obvious fields; prefer `.nullable()` over `.optional()`
- [ ] **No payable amounts**, prices, refunds, or ledger writes from AI (drafts only; human + pricing engine)
- [ ] Part/fitment matching stays deterministic (`pg_trgm`/RapidFuzz) — not LLM SoR for part numbers
- [ ] Promptfoo assertions cover schema + no-money + privacy omit list where applicable
- [ ] Langfuse / `AiInvocation` logging present for cost + correction flywheel
- [ ] Public chat-like surfaces: safe-self-help allowlist / fail closed (C-1); optional cheap Flash-Lite guardrail organ is additive only
- [ ] No `NEXT_PUBLIC_` / `VITE_` secrets; no Baileys or unofficial WA in AI tooling

## Authority

v4 §5.7–5.15, §6.10; D-log **D-56** (merge gate) + **D-54** (Factory promote); Agent Pack §2.2; `DIAL_AIHero_Adaptations.md`; `dial-non-negotiables.mdc`.
