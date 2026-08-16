# AI capability review — Dial a Tech / FixItNow UX plan (D-56)

**Date:** 2026-08-16  
**Skill:** `dial-ai-capability-review`  
**Scope:** `packages/ai` `guidedIntake` / `clientAssessment` / `opsDraftQuoteFromAssessment` / `JobAssessmentSchema` + LiteLLM + Promptfoo fixture; Gateway `/api/ai/guided-intake`, `/api/ai/ops-draft-quote`; how those must sit on copied FixItNow `/tech` UI.  
**This review does not change `packages/ai`.** Audit-only (report first). Companion plan: `docs/planning/DIAL_Tech_FixItNow_Feature_Audit.md`.

**Verdict:** **Pass to keep shipping UX on top of current capabilities** — no Critical merge blockers. Do **not** merge new `packages/ai` fields (prices, payable keys, thinner privacy) without a fresh review.

## Capabilities / prompts / schemas touched (read-only)

| Surface | Role |
| --- | --- |
| `guidedIntake` / `JobAssessmentSchema` | Customer symptom → typed assessment; `needsHumanQuote: true`; **no money** |
| `toModelEgress` | D-32: omit `customerUserId` / phone from egress; free-text only |
| `clientAssessment` | Alias of `guidedIntake` (Pack §10 `/ai/client-assessment`) |
| `opsDraftQuoteFromAssessment` | Internal ops draft; `humanApprovalRequired: true`; `ledgerWrite: false`; **no amounts** |
| `completeViaLiteLlm` | Fixture JSON or LiteLLM→Gemini; system prompt rejects payable instructions |
| Promptfoo `evals/promptfooconfig.yaml` | Golden: no `amountMinor` / `"price"`; must contain `needsHumanQuote` |
| Intelligence Factory / Command Centre | Unchanged; Simulated never auto-pays; no auto-publish |
| Checklists | **Not** in `packages/ai` — deterministic `@dial/jobs` library; Factory may *draft* checklist text later (D-54 human+Promptfoo) |

## Checklist

- [x] Composition stays Policy → Privacy → … → Gemini (LiteLLM) → Zod → Langfuse/Promptfoo **as the locked target** (v4 §5.15). **Today:** `guidedIntake` is a **deterministic stub** (keyword urgency); LiteLLM is a sibling helper, not yet the intake brain.
- [x] **D-32:** identity fields omitted from egress; Gateway rejects body `userId` / `role` / `customerUserId`. **Gap:** no Presidio scrub on free-text `customerText` before a live Gemini call.
- [x] Structured output: Zod `JobAssessmentSchema`. **Gap:** no `.describe()`; thinner than v4 §5.15 concept (`safeSelfHelp`, `missingInformation`, `requiresProfessional`).
- [x] **No payable amounts** — schema walk bans price/amount keys; ops draft has no `amountMinor`; Gateway ops-draft-quote **rejects** body `amountMinor`.
- [x] Part/fitment N/A (Tech, not Spare search).
- [x] Promptfoo fixture assertions cover no-money + `needsHumanQuote`.
- [ ] Langfuse / `AiInvocation` — **not present** in `packages/ai` (Medium; follow-up when live LLM).
- [x] No generic chat endpoint — only scoped `/api/ai/*`.
- [x] Emergency path (`emergency_book`) does **not** await AI (G6 audit still current).
- [x] No `NEXT_PUBLIC_` secrets; no Baileys.

## Critical / High / Medium

| Severity | Finding | Status |
| --- | --- | --- |
| Critical | — | none |
| High | Customer orange UI must **never** call `opsDraftQuote` or display a model price. Payable draft = `@dial/jobs` `draftTechQuote` / `quoteFromRateCard` (`source: "rate_card"`) + human. `/tech/guide` today uses **keyword** `resolve_checklist_by_symptom`, not `guidedIntake` — that is a UX gap, not permission to put prices on the model. | Plan lock (this audit) |
| Medium | Live composition incomplete: stub intake; LiteLLM unused by `guidedIntake`; no Langfuse | Acceptable until live LLM; re-review then |
| Medium | Free-text PII: Presidio not on `customerText` | Required before live Gemini egress |
| Medium | Schema thinner than v4 §5.15 client-assessment fields | Expand only with `.describe()` + no money keys + new review |
| Medium | Checklists are seeded JSON, not Factory-promoted drafts | Correct for launch library; do not auto-publish AI checklists (D-54) |

## Hard stop (never “decide away”)

AI must not write payable amounts, refunds, Job Reserve holds, ledger lines, or technician Take-Home / WHT figures. Emergency dispatch must not wait on Gemini. `opsDraftQuote` stays **internal** (`INTERNAL_API_SECRET`). Checklists go live only via human + Promptfoo (D-54).

*Prior audits still current for their slices: `ai-capability-E4a-2026-08-13.md`, `ai-capability-PD88-PD89-2026-08-15.md`, `ai-capability-G6-intake-2026-08-16.md`.*
