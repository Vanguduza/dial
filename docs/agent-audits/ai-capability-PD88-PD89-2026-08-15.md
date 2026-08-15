# AI capability review — PD88 / PD89 (2026-08-15)

**Scope:** `packages/ai` guidedIntake / clientAssessment / opsDraftQuote + Gateway `/api/ai/*`  
**Gate:** D-56 before merge of `packages/ai` changes

| Check | Result |
| --- | --- |
| AI never writes payable amounts | Pass — no amountMinor/price on assessment or draft |
| Zod JobAssessment | Pass — schema unchanged; needsHumanQuote literal true |
| D-32 identity omit | Pass — toModelEgress strips userId/phone; PD88 thin asserts |
| opsDraftQuote human + no ledger | Pass — humanApprovalRequired; ledgerWrite=false |
| No generic chat endpoint | Pass — only guided-intake, client-assessment, ops-draft-quote |
| Promptfoo / promote | Unchanged — no auto-promote |
| Gateway AuthZ | Session for intake/assessment; INTERNAL_API_SECRET for ops draft |

**Verdict:** merge-OK for PD88/PD89 thin verticals.
