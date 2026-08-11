# DIAL — agent entrypoint

Cursor (and other harnesses that read `AGENTS.md`) should load project guidance in this order:

1. **`DIAL_Consolidated_Plan_v4.md`** — product, compliance, architecture, D-log (incl. **D-47**…**D-60**)
2. **`DIAL_Development_Agent_Pack.md`** — scaffolding contracts, env, RLS, trains T0–T9
3. **`DIAL_Cursor_Rules_and_Skills.md`** — catalog of local rules/skills + source attribution
4. **`.cursor/rules/*.mdc`** — always-on + glob rules (auto-loaded in Cursor)
5. Companions as needed: Blueprint, checklists, WA Flows, promotions design, OSS stitch, Lazy Developer adaptations, **`DIAL_AIHero_Adaptations.md`**, **`DIAL_Security_Toolchain.md` (D-48)**, **`DIAL_v7_2_Adopted_Platform_Extensions.md` (D-53 / D-54)**, external skills utilization **`DIAL_External_Skills_Repos_Utilization.md` (D-55)**
6. **`.cursor/skills/dial-*`** — money-path, RLS/IDOR, PspAdapter, grill-locks (**D-56** Plan), tracer-slice (**D-52**), AI capability reviews (**D-56** merge gate), **diagram-editorial**, **webapp-recon** (audit-then-fix / process)

**Production orchestration:** Paste the **Dev Manager** Cursor prompt in `DIAL_Build_Blueprint_and_Cursor_Prompt.md` §8 / §8.0. That agent owns **ticket hygiene** (open one E1a or E2a thin-vertical ticket with DoD + owner) before parallel Build trains.

**v7-2 architecture draft:** `DIAL_Master_Development_and_Ecosystem_Architecture_v7-2.md` is **not** authoritative over v4. Absorb only via classified evaluation **`DIAL_v7-2_Adjustment_Expansion_Evaluation.md`** → locked companion **`DIAL_v7_2_Adopted_Platform_Extensions.md` (D-53 platform extensions; D-54 Intelligence Factory + Command Centre metric contracts)** (no silent reopen of C-5 / D-37…D-52).

**D-48 AppSec (in-repo):** Threat Dragon models under `ThreatDragonModels/`; Semgrep (`semgrep.yml` + `semgrep/rules/`, CI `semgrep-dial` hard-fail); Checkov HIGH+ hard-fail; Renovate (`renovate.json`) with Dependabot alerts-only; Strix staging runbook `docs/security/strix-runbook.md` — never production. Always-on rule: `.cursor/rules/dial-security-toolchain.mdc`.

**D-55 external skills (in-repo):** thin `dial-diagram-editorial` + agency payments/evidence habits in money-path/tracer + anthropics skill anatomy / `dial-webapp-recon` — companion locked adopted; **no** full upstream tree vendors; **never** Anthropic ToS docx/pdf/pptx/xlsx.

**D-56 plan-phase grill:** invoke `dial-grill-locks` in Plan before scaffold of money/WA/maps/AI/dual-capacity/Catalogue Factory/Intelligence; `dial-ai-capability-review` before merge of `packages/ai`. How-to + first topics: Pack §2.2. Plan-phase artifacts: `docs/planning/` (grill session, DoD backlog, AI Hero today queue, diagrams, Promptfoo outline, tracer matrices).

**D-57 Spare FX display:** catalogue/cart **USD only**; ZiG conversion only at checkout from ops **Daily ZiG rate**; WA EcoCash + COD via required checkout buttons — see v4 §0.2 / §4.3 / D-log; Pack Meili + admin screen; `DIAL_WhatsApp_Flows_and_Templates.md` `FLOW_SPARE_CHECKOUT`.

**Do not** reopen locked decisions (C-5, D-38…D-60, official WhatsApp only, MapLibre SoR, AI never writes money, marketplace-wide agency→principal flip, informal→B2B visibility, dropping tech WHT, reintroducing discarded D-51 owned-stock principal (D-58), stub-as-MVP / skip feature DoD, v7 as SoR, Train 0–10 replacing T0–T9, Unleash/OR-Tools as SoR, auto-publish checklist/AI without human+Promptfoo, Command Centre Simulated as live money control, full external skill/agent tree dumps, skip plan-phase grill / AI capability merge gate, dual-display ZiG on Spare browse or unaudited FX / skip WA EcoCash+COD buttons).

Attribution detail: `.cursor/rules/SOURCES.md` and `DIAL_Cursor_Rules_and_Skills.md`.
