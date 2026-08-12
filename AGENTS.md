# DIAL — agent entrypoint

Cursor (and other harnesses that read `AGENTS.md`) should load project guidance in this order:

1. **`DIAL_Consolidated_Plan_v4.md`** — product, compliance, architecture, D-log (incl. **D-47**…**D-61**)
2. **`DIAL_Development_Agent_Pack.md`** — scaffolding contracts, env, RLS, trains T0–T9
3. **`DIAL_Cursor_Rules_and_Skills.md`** — catalog of local rules/skills + source attribution
4. **`.cursor/rules/*.mdc`** — always-on + glob rules (auto-loaded in Cursor)
5. Companions as needed: Blueprint, checklists, WA Flows, promotions, OSS stitch, Lazy Developer adaptations, **`DIAL_AIHero_Adaptations.md`**, **`DIAL_Security_Toolchain.md` (D-48)**, **`DIAL_v7_2_Adopted_Platform_Extensions.md` (D-53 / D-54)**, external skills utilization **`DIAL_External_Skills_Repos_Utilization.md` (D-55)**, AI Kernel/Prime absorb **`DIAL_AI_Kernel_Prime_Agent_Adopted.md` (D-61)**
6. **`.cursor/skills/dial-*`** — money-path, RLS/IDOR, PspAdapter, grill-locks (**D-56** Plan), tracer-slice (**D-52**), AI capability reviews (**D-56** merge gate), **diagram-editorial**, **webapp-recon** (audit-then-fix / process)

**Standalone Dev Manager paste prompt:** [`docs/prompts/DIAL_DEV_MANAGER_CURSOR_PROMPT.md`](docs/prompts/DIAL_DEV_MANAGER_CURSOR_PROMPT.md) (current Build handoff — paste the PROMPT fence inside a Prime harness session). **Model routing:** Prime must use **Cursor models via the local bridge/proxy in Auto mode** — do not manually switch models for Dev Manager or subagents. **First Build duties (PRIORITY 0):** verify Node/pnpm install + green typecheck/test + lefthook + `origin`=`Vanguduza/dial`, then auto-push after commits (`lefthook` post-commit / `scripts/git-auto-push.*`) — ticket hygiene follows once env+push are green.

**Development orchestration (D-61):** **DIAL Dev Manager** (Blueprint §8 / §8.0) is the **managerial authority for the entire development process** — Plan→Build→Done throughout Build: ticket hygiene (open one E1a or E2a thin-vertical ticket with DoD + owner before parallel trains), **D-52** feature DoD, **responsive web UX** (§8.0.1), **living root docs** in the same PR (§8.0.2 — `README.md`, `CHANGELOG.md`, `ENHANCEMENTS.md`, `BUGS.md`; reject “docs later”), and train sequencing (T0–T9 / E1–E6). That role runs for the whole Build, not only at ticket open. **Prime Agent** is the **mandatory session/runtime harness** (RLM, subagents, detachable sessions) that **hosts** Dev Manager so it can operate effectively — install + configure Prime **before** Dial ecosystem workspace / monorepo bootstrap, then open the DIAL repo, then paste/run Dev Manager **inside** that session. Prime is **not** the product/manager SoR and does **not** replace Dev Manager duties; Cursor/`AGENTS.md`/Pack remain instruction SoR.

**Living docs:** Keep root `README.md` / `CHANGELOG.md` / `ENHANCEMENTS.md` / `BUGS.md` current with meaningful landings. **Responsive web:** desktop + mobile usability and shared `packages/design-tokens` consistency before Done on web tickets.

**v7-2 architecture draft:** `DIAL_Master_Development_and_Ecosystem_Architecture_v7-2.md` is **not** authoritative over v4. Absorb only via classified evaluation **`DIAL_v7-2_Adjustment_Expansion_Evaluation.md`** → locked companion **`DIAL_v7_2_Adopted_Platform_Extensions.md` (D-53 platform extensions; D-54 Intelligence Factory + Command Centre metric contracts)** (no silent reopen of C-5 / D-37…D-52).

**D-48 AppSec (in-repo):** Threat Dragon models under `ThreatDragonModels/`; Semgrep (`semgrep.yml` + `semgrep/rules/`, CI `semgrep-dial` hard-fail); Checkov HIGH+ hard-fail; Renovate (`renovate.json`) with Dependabot alerts-only; Strix staging runbook `docs/security/strix-runbook.md` — never production. Always-on rule: `.cursor/rules/dial-security-toolchain.mdc`.

**D-55 external skills (in-repo):** thin `dial-diagram-editorial` + agency payments/evidence habits in money-path/tracer + anthropics skill anatomy / `dial-webapp-recon` — companion locked adopted; **no** full upstream tree vendors; **never** Anthropic ToS docx/pdf/pptx/xlsx.

**D-56 plan-phase grill:** invoke `dial-grill-locks` in Plan before scaffold of money/WA/maps/AI/dual-capacity/Catalogue Factory/Intelligence; `dial-ai-capability-review` before merge of `packages/ai`. How-to + first topics: Pack §2.2. Plan-phase artifacts: `docs/planning/` (grill session, DoD backlog, AI Hero today queue, diagrams, Promptfoo outline, tracer matrices).

**D-57 Spare FX display:** catalogue/cart **USD only**; ZiG conversion only at checkout from ops **Daily ZiG rate**; WA EcoCash + COD via required checkout buttons — see v4 §0.2 / §4.3 / D-log; Pack Meili + admin screen; `DIAL_WhatsApp_Flows_and_Templates.md` `FLOW_SPARE_CHECKOUT`.

**D-61 AI Kernel / Prime Agent:** absorb only via **`DIAL_AI_Kernel_Prime_Agent_Adopted.md`** — **Dev Manager** = Build managerial authority throughout; **Prime** = mandatory harness hosting that role (before workspace); production multi-step = `packages/ai` capabilities + LiteLLM→Gemini + Temporal/BullMQ (**no** prod agent host/adapter); self-learning / troubleshooting improvement / ERP Improvement **outcomes** = Intelligence Factory + Langfuse + Promptfoo + MetricContract + `packages/ai` capabilities + Temporal — same aims as Prime’s continual-learning story, **without** adopting Prime (or any agent host) as the production driver of those loops; **§5.3 stays locked**. Proposal archive `DIAL AI KERNEL + PRIME AGENT.md` is **not** SoR.

**Do not** reopen locked decisions (C-5, D-38…D-61, official WhatsApp only, MapLibre SoR, AI never writes money, marketplace-wide agency→principal flip, informal→B2B visibility, dropping tech WHT, reintroducing discarded D-51 owned-stock principal (D-58), stub-as-MVP / skip feature DoD, v7 as SoR, Train 0–10 replacing T0–T9, Unleash/OR-Tools as SoR, auto-publish checklist/AI without human+Promptfoo, Command Centre Simulated as live money control, full external skill/agent tree dumps, skip plan-phase grill / AI capability merge gate, dual-display ZiG on Spare browse or unaudited FX / skip WA EcoCash+COD buttons, peer AI kernel / self-host inference via Kernel proposal / Prime as production or parallel Factory SoR / production agent adapter or alternate prod agent framework (**D-61**)).

Attribution detail: `.cursor/rules/SOURCES.md` and `DIAL_Cursor_Rules_and_Skills.md`.
