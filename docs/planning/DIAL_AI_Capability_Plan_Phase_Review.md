# DIAL AI capability — plan-phase review (docs surface)

**Skill:** `dial-ai-capability-review` (D-56) — **audit report only**; no code fixes.  
**Scope:** Planned `packages/ai` surface from v4 §5.7–5.15, Pack T7, D-32 / D-54 / D-56 — **not** a merge gate on absent code.  
**Date:** 2026-08-11

## Capabilities in plan (inventory)

| Capability | Audience | Planned write targets |
| --- | --- | --- |
| `guidedIntake` | Customer Tech + ops | `AiInvocation`, structured intake / `JobAssessment` |
| `clientAssessment` | Customer Tech | Assessment text; safe-self-help allowlist only |
| `opsDraftQuote` | Internal ops | Draft for **human** approval — not ledger |
| Spare `productPerformance` / `crmInsight` | Internal | Insights only — Spare AI ≠ shop agent |
| `translateProblemText` (optional) | Support | Text only |
| Intelligence Factory wrap | Ops | Checklist/troubleshooting drafts → shadow → Promptfoo → human promote |

No generic chat endpoint in plan — **aligned**.

## Checklist vs plan docs

| Check | Plan status | Severity if violated later |
| --- | --- | --- |
| Composition Policy → Privacy → … → Gemini → Zod → Langfuse/Promptfoo | Specified §5.15 | Critical |
| D-32 omit name/phone/address/ID; Presidio free-text only | Locked §5.7 | Critical |
| Zod + `.describe()`; prefer `.nullable()` | Specified §5.12 area | High |
| No payable amounts / refunds / ledger writes from AI | Locked §5.1 / non-negotiable | Critical |
| Part/fitment match deterministic not LLM SoR | Locked | High |
| Promptfoo assertions: schema + no-money + privacy omit | Planned — outline in sibling doc | High |
| Langfuse / `AiInvocation` cost + correction flywheel | Specified §5.8 | High |
| Public surfaces: safe-self-help fail closed (C-1) | Locked | Critical |
| Flash-Lite Policy organ | P1 only — not in MVP DoD unless founder OPEN settles | Medium (defer) |
| No `NEXT_PUBLIC_` secrets; no Baileys in AI tooling | Locked D-47/D-40 | Critical |
| Factory: no auto-publish (D-54) | Locked | Critical |
| Emergency dispatch never blocked on model | Locked §5.10 | Critical |

## Findings (plan phase)

### Critical (design must preserve)

1. **Money boundary** — `opsDraftQuote` and any “pricing-intel” rename must remain draft/forecast; pricing engine + ledger sole writers (D-53/D-54).  
2. **Privacy omit-identity** — do not “tokenise and send” CRM fields; opaque ids only.  
3. **No generic chat** — capability API only; fails cost/risk traceability if reopened.  
4. **Promote path** — checklist/Factory outputs require Promptfoo + human; shadow default.

### High

5. Promptfoo golden set must include **no-money** and **privacy omit** assertions before customer-visible promote (§5.9).  
6. Zod boundary + repair/retry budget must be in DoD for each public capability.  
7. Spare AI scoped to performance/CRM — agentic Spare shop remains rejected.

### Medium

8. Flash-Lite optional organ — document as P1; do not block T7 on it.  
9. Zimbabwe-specific Presidio recognisers called out in §5.7 — ticket as explicit DoD item when Privacy layer scaffolds.  
10. Cross-border photo consent toggle (unbundled) — product AC exists; ensure capability Policy checks consent before media egress.

### Informational

11. Merge-time **code** review still mandatory when `packages/ai` exists (D-56) — this doc does not replace it.  
12. D-54 Factory promote complements but does not replace capability review.

## Verdict

Plan surface is **aligned with locks**. No reopen recommendations.  
**Blockers to Build:** none from AI product locks; proceed to DoD fill → thin vertical `guidedIntake` after grill human confirm.  
**Open:** Flash-Lite timing (founder); D-2 unrelated to AI but blocks fiscal — not AI package.
