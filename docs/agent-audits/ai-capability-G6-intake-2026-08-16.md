# AI capability review — Phase 6 tech intake (G6 prep)

**Date:** 2026-08-16  
**Scope:** `packages/ai` `guidedIntake` / `JobAssessmentSchema` + Gateway `/api/ai/guided-intake` + `/api/tech/services` emergency path  
**Skill:** `dial-ai-capability-review` (D-56)  
**Verdict:** **Pass for Phase 6 prep** — intake drafts only; emergency never AI-blocked; no Critical blockers for G6 sequencing.

## Capabilities touched

| Capability | Role in G6 |
| --- | --- |
| `guidedIntake` / `JobAssessmentSchema` | Customer symptom → draft assessment; Zod structured; **no money** |
| `/api/tech/services` `emergency_book` | Deterministic book path; `aiPricingBypassed: true` |
| `/api/tech/services` `book` | Rate-card quote only; `payableFromAi: false` |
| Technician checklist/evidence APIs | No AI price paths; Value Score / Take-Home never payable from AI |

## Checklist

- [x] **AI never writes payable amounts** — assessment + book responses stamp `payableFromAi: false`
- [x] Zod `JobAssessmentSchema` — `needsHumanQuote: true` literal enforced
- [x] D-32 identity omit — body `userId`/`role`/`customerUserId` rejected on guided-intake (D-47)
- [x] Emergency path works with AI down — `emergency_book` does not await LiteLLM
- [x] No generic chat endpoint — only scoped intake routes
- [x] Flash-Lite safety organ unchanged (P1 on drafts when wired)
- [x] Prior audits current: `ai-capability-PD88-PD89-2026-08-15.md`, `ai-capability-E4a-2026-08-13.md`

## Critical / High / Medium

| Severity | Finding | Status |
| --- | --- | --- |
| Critical | — | none |
| High | — | none |
| Medium | Live LiteLLM eval not required for fixture emergency path | Acceptable for G6 prep |
| Medium | Langfuse hooks on intake unchanged | Follow-up G11 |

## D-56 / D-61 locks affirmed

- Intake = drafts only; rate_card + human pricing remain money SoR  
- Emergency never blocked on AI availability  
- No `NEXT_PUBLIC_` secrets on AI paths  

*Audit-only report. Cited by `phase6PrepOps.test.ts` and `g6-technician-android-dogfood.mts`.*
