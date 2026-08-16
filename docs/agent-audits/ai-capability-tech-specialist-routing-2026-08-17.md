# AI capability review — Tech OEM specialist routing

**Date:** 2026-08-17  
**Skill:** `dial-ai-capability-review` (D-56)  
**Scope:** `packages/ai` `JobAssessmentSchema` / `guidedIntake` / `inferSpecialistHint` / LiteLLM fixture JSON; Gateway diagnose + `@dial/jobs` OEM match.

## Capabilities touched

| Surface | Role |
| --- | --- |
| `guidedIntake` / `JobAssessmentSchema` | Adds `specialistHint` `{ required, brand, system, reason }` — **no money, no technician ids** |
| `clientAssessment` | Alias of `guidedIntake` (inherits hint) |
| `opsDraftQuoteFromAssessment` | Unchanged — narrative draft only; `ledgerWrite: false` |
| LiteLLM fixture | Same assessment shape including `specialistHint` (still unused as intake brain) |

## Checklist

- [x] Composition stays Policy → Privacy → … → Gemini (LiteLLM) → Zod → Langfuse/Promptfoo **as the locked target**. **Today:** intake remains a **deterministic stub**; hint is keyword/alias extraction, not a live model pick.
- [x] **D-32:** `toModelEgress` still strips userId/phone; hint has brand/system/reason only.
- [x] Structured output: Zod `SpecialistHintSchema` with `.describe()`; brand/system `.nullable()`.
- [x] **No payable amounts** — `assertNoPayableKeys`; Promptfoo `amountMinor` ban extended to Mercedes case.
- [x] Specialist **matching is deterministic** in `@dial/jobs` (`oemSpecialties` + Mercedes/Benz/MB aliases). LLM must not emit `technicianId`.
- [x] Promptfoo / `eval:smoke` cover schema + no-money + no technicianId on Mercedes text.
- [ ] Langfuse / live LiteLLM on intake — still not wired (Medium, unchanged).
- [x] No generic chat; Diagnose uses the capability + jobs match.
- [x] No `NEXT_PUBLIC_` secrets; no Baileys.

## Severity

| Level | Note |
| --- | --- |
| High | Matching technician ids from the model would violate the fitment-style lock. **Mitigated:** schema has no id fields; gateway ranks `tech_mercedes_spec` from the jobs registry. |
| Medium | Live Gemini still unused; Presidio still required before live free-text egress. |

## Grill (internal, D-56)

Frontier empty. AI may say “needs Mercedes specialist / powertrain”; jobs registry decides who. Honda general does not force a specialist. Money stays rate_card / Job Reserve.
