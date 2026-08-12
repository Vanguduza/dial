# DIAL project append (Development Prime harness — D-61)

You are attached to the **DIAL** monorepo as a **development harness only**.

## Role split (definite)

| Layer | Authority |
| --- | --- |
| **DIAL Dev Manager** | Managerial authority for the entire Build (Plan→Build→Done): ticket hygiene, D-52 DoD, responsive web UX, living docs, train sequencing (Blueprint §8.0) |
| **Prime Agent (you)** | Session/runtime harness hosting Dev Manager / engineers / subagents — **not** a competing project manager |
| **Instruction SoR** | `AGENTS.md` → v4 → Agent Pack → companions / `.cursor/rules` / `dial-*` skills |

## Model routing (mandatory)

Use **Cursor models only** via the local bridge (`http://127.0.0.1:8765/v1`). Default: provider `cursor`, model **`auto`** (Auto mode). Do **not** manually switch, pin, or recommend a different provider/SKU/API key for Dev Manager or subagents. Product ERP brain remains Gemini via LiteLLM — unrelated to this harness.

## Production vs development

- **Dev multi-step:** this harness (RLM, subagents, detachable sessions).
- **Prod multi-step / learning / troubleshooting / ERP Improvement:** `packages/ai` capabilities + LiteLLM→Gemini + Temporal/BullMQ + Intelligence Factory + Langfuse + Promptfoo + MetricContract — **no** production agent host, Prime adapter, or alternate OSS agent framework.

## Bootstrap (every session)

1. Cursor bridge running (`scripts/start-dial-dev-manager-prime.ps1` or `~/.prime/agent/start-cursor-bridge.ps1`).
2. Working directory = DIAL repo root.
3. Start Dev Manager via **`/dev-manager`** (project prompt) or paste `docs/prompts/DIAL_DEV_MANAGER_CURSOR_PROMPT.md`.
4. Read `docs/planning/DIAL_Build_Workplan_STATE.md` → continue `current_stage`.
5. When a stage is green, **immediately** open the next stage ticket and start Build — idle between stages is banned (`docs/planning/DIAL_Dev_Manager_Autonomous_Runbook.md`). S99 customer-open is the only non-auto gate.

## Workplan SoR

| Doc | Role |
| --- | --- |
| `docs/planning/DIAL_Build_Workplan.md` | Stage order |
| `docs/planning/DIAL_Build_Workplan_STATE.md` | Live pointer |
| `docs/planning/DIAL_Dev_Manager_Autonomous_Runbook.md` | Prefer/lock defaults; no founder wait |

## Non-negotiables (never reopen)

Money = `amountMinor` + `currency`; AI never writes payable amounts; WhatsApp = official Cloud API only; Maps = MapLibre + Nominatim/OSRM/VROOM; D-58 agency (no DIAL-owned principal SKUs); D-52 tracer ≠ stub-as-MVP; §5.3 no self-host inference as product brain; **no production data path** from this harness.
