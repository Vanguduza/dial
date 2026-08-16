# AI capability review — G11 Intelligence / Command Centre (D-56)

**Date:** 2026-08-16  
**Scope:** `packages/ai` Intelligence Factory promote gates + Command Centre MetricContract recommended actions + `guidedIntake` Promptfoo smoke  
**Skill:** `dial-ai-capability-review`  
**Verdict:** **Pass for G11 sandbox exit** — no Critical blockers.

## Capabilities touched

| Capability | G11 evidence |
| --- | --- |
| `guidedIntake` / `JobAssessmentSchema` | Promptfoo smoke — no payable keys; `needsHumanQuote: true` |
| Intelligence Factory shadow lifecycle | Promptfoo **fail** → promote blocked; pass + human → promote |
| `executeRecommendedAction` | Actual KPI alert → action fires → payout refused; `autoPay=false` |
| Command Centre Simulated payout guard | Throws on simulated execute + attempt_payout (G7 recon + G11 script) |
| LiteLLM / Flash-Lite | Unchanged; drafts stamp `flashLiteSafetyOrgan: "p1"` |

## Checklist

- [x] Composition: Factory metadata + CC actions — no LiteLLM money path
- [x] **D-32:** Factory drafts + guidedIntake egress omit identity; no new PII egress
- [x] Structured output: `JobAssessmentSchema` unchanged; Factory drafts lock `payableFromAi: false`
- [x] **No payable amounts** — promote re-asserts; recommended actions keep `autoPay: false`
- [x] Part/fitment N/A for this slice
- [x] Promptfoo gate required before human approve / promote — **fail path evidenced**
- [x] Langfuse / AiInvocation — dormancy documented; live keys `blocked_on_human`
- [x] Flash-Lite safety organ remains **P1** on drafts
- [x] No `NEXT_PUBLIC_` secrets; no Baileys

## Critical / High / Medium

| Severity | Finding | Status |
| --- | --- | --- |
| Critical | — | none |
| High | — | none |
| Medium | Live Promptfoo CLI + Langfuse traces require keys | Honest open — sandbox fixture + smoke only |
| Medium | CC recommended actions are permissioned links + refuse payout — not ledger drain automation | By design (D-54) |

## D-54 / G11 locks affirmed

- Promptfoo fail → no promote (HTTP + package sandbox)  
- Actual KPI recommended action → cannot pay (`executeRecommendedAction` refuses)  
- Simulated Command Centre → never auto-pays (G7 recon + G11 integration)  
- Auto-publish without Promptfoo + human → blocked  
- AI drafts only; human + pricing remain money SoR  

*Audit-only report (D-56). Evidence: `docs/ops/evidence/g11/g11-sandbox-intelligence-dogfood.json` + `phase11PrepOps.test.ts`.*
