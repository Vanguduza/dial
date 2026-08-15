# AI capability review — PD17 Intelligence Factory (D-56)

**Date:** 2026-08-15  
**Scope:** `packages/ai` Intelligence Factory shadow/promote + guidedIntake (unchanged)  
**Skill:** `dial-ai-capability-review`  
**Verdict:** **Pass for PD17 thin vertical** — no Critical blockers for merge of this slice.

## Capabilities touched

| Capability | Change |
| --- | --- |
| `guidedIntake` / `JobAssessmentSchema` | Unchanged |
| Intelligence Factory shadow lifecycle | **Added** create → Promptfoo → human → promote |
| Command Centre Simulated payout guard | Extended counter; behaviour unchanged |
| LiteLLM / Flash-Lite | Unchanged; drafts stamp `flashLiteSafetyOrgan: "p1"` |

## Checklist

- [x] Composition: Factory metadata only — no LiteLLM money path; promote writes outcome-weighted dataset ids, not ledger
- [x] **D-32:** Factory drafts are ops checklist text; no identity egress added
- [x] Structured output: existing Zod `JobAssessmentSchema` unchanged; Factory drafts lock `payableFromAi: false`
- [x] **No payable amounts** — draft body bans `amountMinor`/`setPrice`/etc.; promote re-asserts
- [x] Part/fitment N/A for this slice
- [x] Promptfoo gate required before human approve / promote (`recordShadowPromptfooResult`)
- [x] Langfuse / AiInvocation — not expanded this slice (Medium — follow-up when live evals wire)
- [x] Flash-Lite safety organ remains **P1** on drafts
- [x] No `NEXT_PUBLIC_` secrets; no Baileys

## Critical / High / Medium

| Severity | Finding | Status |
| --- | --- | --- |
| Critical | — | none |
| High | — | none |
| Medium | Live Promptfoo CLI not invoked in fixture path (report id stub) | Acceptable for fixture DoD; sandbox wires later |
| Medium | Langfuse hooks not added on Factory promote | Follow-up; does not reopen D-54 |

## D-54 locks affirmed

- Auto-publish without Promptfoo + human → blocked  
- Simulated Command Centre → never auto-pays  
- AI drafts only; human + pricing remain money SoR  

*Audit-only report (D-56). Fixes already landed in PD17 implementation.*
