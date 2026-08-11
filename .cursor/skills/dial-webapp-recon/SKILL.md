---
name: dial-webapp-recon
description: >-
  Reconnaissance-then-action web smoke for DIAL admin/customer Next.js apps using
  Playwright patterns (wait for networkidle, screenshot/DOM inspect, then act).
  Use for Command Centre, admin, or customer-web UI verification. Inspired by
  anthropics/skills webapp-testing (Apache-2.0). Never vendors docx/pdf trees.
  Authority: D-55.
---

# DIAL webapp-recon (D-55)

Thin **DIAL-authored** habit skill. Licence OK: patterns from Anthropic **Apache-2.0** `webapp-testing` example only — **never** copy `docx` / `pdf` / `pptx` / `xlsx` skills (Anthropic ToS / source-available).

Prefer **Node Playwright** already planned for repo CI when present; do not require Python `with_server.py` from upstream.

## When to trigger

- UI ticket reaching `dial-tracer-slice` **Done** and needs evidence (screenshots / smoke)
- Debugging admin-web, customer-web, or Command Centre Actual vs Simulated banners
- User asks for Playwright recon / selector discovery on a running local app

## When not to use

- Money mutations, PSP webhooks, or ledger writes via browser automation as SoR
- Replacing Promptfoo / Langfuse / human promote for AI (**D-54**)
- Production pentest (use Strix staging runbook — D-48)
- Vendoring anthropics document-skill trees

## Inputs

| Input | Required | Notes |
| --- | --- | --- |
| Base URL | Yes | Local or staging only unless user explicitly authorizes |
| Scenario | Yes | e.g. “CC Simulated watermark visible”, “B2B search hides informal” |
| Auth path | If gated | Use test credentials from `.env.example` names only — never print secrets |

## Outputs

1. Short recon notes: URL, wait strategy, discovered selectors
2. Evidence: screenshot path(s) and/or Playwright test stub
3. Pass/fail vs ticket DoD evidence bullets — feed `dial-tracer-slice` Done

## Workflow (recon → action)

1. Confirm server is running (or start via project scripts — not upstream Python helper).
2. Navigate; **`wait_for_load_state('networkidle')`** (or equivalent) before inspect.
3. Screenshot + list interactive roles (`button`, `link`, form fields).
4. Identify stable selectors (`role=`, `text=`, test ids if present).
5. Execute the scenario actions; capture final screenshot.
6. For money-adjacent UI: assert **display** of minor units only — never drive payable amount invention.

## Anti-patterns

- Inspecting DOM before network idle on dynamic apps
- Committing credentials or `.env` contents into tests
- Using recon as permission to reopen C-5 Expo shells or skip feature DoD
- Copying Anthropic ToS-restricted document skills into `.cursor/`

## Authority

**D-55**; companion `DIAL_External_Skills_Repos_Utilization.md` §3. Attribution: anthropics/skills `webapp-testing` (Apache-2.0 pattern). Promptfoo remains AI eval SoR (**D-54**).
