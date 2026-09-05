# DIAL AI capability — plan-phase review (docs surface)

**Skill:** `dial-ai-capability-review` (D-56) — **audit report only**; no code fixes.
**Scope:** Planned `packages/ai` + **D-61 Hermes Business Agent Fabric** surface from v4 §5.7–5.15 + §6.24, Pack T7/D-61 overlay, D-32 / D-54 / D-56 / D-61 — **not** a merge gate on absent code.
**Original review:** 2026-08-11
**D-61 update:** 2026-09-05

## Capabilities in plan (inventory)

| Capability | Audience | Planned write targets |
| --- | --- | --- |
| `guidedIntake` | Customer Tech + ops | `AiInvocation`, structured intake / `JobAssessment` |
| `clientAssessment` | Customer Tech | Assessment text; safe-self-help allowlist only |
| `opsDraftQuote` | Internal ops | Draft for **human** approval — not ledger |
| Spare `productPerformance` / `crmInsight` | Internal | Insights; deterministic commerce services remain SoR |
| `translateProblemText` (optional) | Support | Text only |
| Intelligence Factory wrap | Ops | Checklist/troubleshooting drafts → shadow → Promptfoo → human promote |
| Governed Hermes conversation | Customer/staff/vendor/supplier | DIAL gateway → privacy context → Supervisor → H0–H4 Tool Bus; no raw model endpoint |
| Provider Bridge | Ops | API/OAuth/approved CLI bridges; managerEligible routing; secret refs only |
| Memory/R2 | System | scoped semantic facts + R2 archive/evidence; R2 never transaction truth |
| Quantum intelligence | Management/suppliers/stakeholders | evidence-labelled insights/opportunities/reports; no money authority |

No unrestricted generic model endpoint is permitted. **D-61 explicitly permits governed conversational interfaces through the Supervisor/privacy/tool fabric.**

## Checklist vs plan docs

| Check | Plan status | Severity if violated later |
| --- | --- | --- |
| Composition Gateway/Policy → Privacy Context Compiler/Egress Firewall → Hermes/approved provider → Zod/tools → Langfuse/Promptfoo; domain services authoritative | D-61 §6.24 | Critical |
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
3. **No unrestricted raw chat endpoint** — governed Hermes conversations are allowed by D-61, but must preserve identity/purpose/privacy/provider/tool/action-class/evidence/audit boundaries.
4. **Promote path** — checklist/Factory outputs require Promptfoo + human; shadow default.

### High

5. Promptfoo golden set must include **no-money** and **privacy omit** assertions before customer-visible promote (§5.9).
6. Zod boundary + repair/retry budget must be in DoD for each public capability.
7. Spare performance/CRM remains valuable, but D-61 now allows **governed conversational commerce orchestration**; Meili/catalogue/fitment/pricing/cart/order services remain the commerce SoR and cannot be bypassed.

### Medium

8. Flash-Lite optional organ — document as P1; do not block T7 on it.
9. Zimbabwe-specific Presidio recognisers called out in §5.7 — ticket as explicit DoD item when Privacy layer scaffolds.
10. Cross-border photo consent toggle (unbundled) — product AC exists; ensure capability Policy checks consent before media egress.

### Informational

11. Merge-time **code** review still mandatory when `packages/ai` exists (D-56) — this doc does not replace it.
12. D-54 Factory promote complements but does not replace capability review.
13. D-61 provider/manager routing, Privacy Context Compiler/Egress Firewall, H0–H4 tools, Health isolation, R2 non-SoR, supplier confidentiality and epistemic/evidence rules must enter the merge-time review.
14. Development orchestration (Cursor/Claude/Codex/DDE) is not the same runtime as business Hermes orchestration.

## Verdict

Plan surface is **aligned after D-61 supersession**. Historical Gemini-only/no-agentic wording is no longer a lock; the D-61 governance boundaries are.
**Blockers to Build:** D-61 requires its own plan-grill/tracer DoD before Hermes runtime scaffolding. Existing `guidedIntake` remains a valid typed capability slice; do not mass-scaffold Hermes without an owned D-61 slice.
**Open:** Flash-Lite timing (founder); D-2 unrelated to AI but blocks fiscal — not AI package.
