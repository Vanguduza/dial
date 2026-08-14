# DIAL Build — Workplan STATE

**SoR for stage order:** `DIAL_Build_Workplan.md`  
**Updated:** 2026-08-14  
**Auto-advance:** **ON for product-depth band (PD1→PD4)** — eng spine complete at S90; OpenAPI invent paused; S99 human-only; G1 waits for PD1–PD4 deps.

| Field | Value |
| --- | --- |
| `current_stage` | **PD4** — Sandbox PSP (Paynow/EcoCash) |
| `current_issue` | [#24](https://github.com/Vanguduza/dial/issues/24) PD4 Sandbox PSP |
| `current_branch` | `build/t4-tech-ui` |
| `prior_stage` | **PD3** Spare depth — **green** ([#23](https://github.com/Vanguduza/dial/issues/23)) |
| `next_stage` | **G1** plan hold (after PD4 green) or ops — S99 human-only |
| `blocked_on_human` | _(empty)_ — S99 still human-only later; groceries G1 not started |

## Completed

| Stage | When | Evidence |
| --- | --- | --- |
| S10–S90 | 2026-08-12/13 | Workplan spine green — eng Build complete |
| S91–S465 | 2026-08-13/14 | **Post-S90 invent** (OpenAPI micro-band) — **paused by founder** — not workplan SoR |
| **PD1** | 2026-08-14 | Supabase Auth + profiles/RLS + `/api/auth/me`; [#21](https://github.com/Vanguduza/dial/issues/21); T evidence |
| **PD2** | 2026-08-14 | Meili spare_offers_v1 + Factory publish + B2B filter; [#22](https://github.com/Vanguduza/dial/issues/22); T evidence |
| **PD3** | 2026-08-14 | Spare browse/PDP/cart/checkout vs session search; [#23](https://github.com/Vanguduza/dial/issues/23); T evidence |

## Planned (next)

| Stage | Intent |
| --- | --- |
| **PD4** | Sandbox PSP adapters (Paynow/EcoCash) |
| **G1** | Groceries thin vertical — **blocked until PD1–PD4 green** (plan only until then) |
| **S99** | Customer-open — founder/ops; Appendix C / Blueprint §8.1 — **not automatic** |

## Note

Founder directive (2026-08-14): auto-proceed follows **`DIAL_Build_Workplan.md` spine + authored product-depth band (PD*)** only. Do **not** invent S466+ OpenAPI stages. Skip `.github/workflows/*` in pushes until token has `workflow` scope. Leave groceries plan/diagrams unstaged unless index needs a one-line link.

*Dev Manager updates this file in the same commit as stage transitions.*
