# DIAL — agent entrypoint

## vNext.1 context-drift preflight — mandatory

Before using historical plans, code state, chat/session memory or donor repositories as context, every agent/harness must read:

1. **`docs/project-truth/CONTEXT_BUNDLE.md`** — short current vNext.1 truth and drift tripwires.
2. **`docs/project-truth/project-truth.json`** — machine-readable non-negotiables, supersessions and SoRs.
3. **`docs/project-truth/feature-registry.json`** — current feature gates and exact next work.
4. **`docs/project-truth/evidence-registry.json`** — inherited engineering evidence that must survive repo/session migration.
5. This `AGENTS.md`.

Always-on enforcement: **`.cursor/rules/dial-context-drift.mdc`**. Audit skill: **`.cursor/skills/dial-context-drift-check/SKILL.md`**. Run **`pnpm context:check`** before merge/sign-off. Session/harness changes use `docs/project-truth/SESSION_HANDOFF_TEMPLATE.md`.

**Conflict order now:** vNext.1 project truth/context registries → existing v4/Agent Pack/companions for non-conflicting detail → runtime code/tests. Code does not silently override product truth; stale code is repaired unless an explicit new decision changes truth.

**Critical inherited state:** E1a/E1b/E2a/E3a/E4a and normalized E6a start at **Integration Green** and are not repeated as thin-slice milestones after repository migration. E5a and new OM-0 start at **Thin Slice Required**. FixItNow is the **wholesale Dial a Tech application donor**; Opportunity Marketplace is pre-award sourcing only and converges into the same post-award DIAL Job/Job Reserve system.

---

Cursor (and other harnesses that read `AGENTS.md`) should load the detailed historical/project guidance in this order after the vNext.1 preflight above:

1. **`DIAL_Consolidated_Plan_v4.md`** — product, compliance, architecture, D-log (incl. **D-47**…**D-61**) where not superseded by vNext.1 truth.
2. **`DIAL_Development_Agent_Pack.md`** — scaffolding contracts, env, RLS, trains T0–T9.
3. **`DIAL_Cursor_Rules_and_Skills.md`** — catalog of local rules/skills + source attribution.
4. **`.cursor/rules/*.mdc`** — always-on + glob rules (auto-loaded in Cursor); includes **context drift**, **key-drop-in** (`dial-key-drop-in.mdc`) + **autonomous completion** (`dial-autonomous-completion.mdc` — auto-continue eng-safe work; secret phases honestly open; no fixture-only gate claims).
5. Companions as needed: Blueprint, checklists, WA Flows, promotions, OSS stitch, Lazy Developer adaptations, **`DIAL_AIHero_Adaptations.md`**, **`DIAL_Security_Toolchain.md` (D-48)**, **`DIAL_v7_2_Adopted_Platform_Extensions.md` (D-53 / D-54)**, external skills utilization **`DIAL_External_Skills_Repos_Utilization.md` (D-55)**, AI Kernel/Prime absorb **`DIAL_AI_Kernel_Prime_Agent_Adopted.md` (D-61)**; integrations drop-in matrix **`docs/integrations/key-drop-in-readiness.md`**.
6. **`.cursor/skills/dial-*`** — context-drift, money-path, RLS/IDOR, PspAdapter, grill-locks (**D-56** Plan), tracer-slice (**D-52**), AI capability reviews (**D-56** merge gate), **diagram-editorial**, **webapp-recon** (audit-then-fix / process).

**Standalone Dev Manager paste prompt:** [`docs/prompts/DIAL_DEV_MANAGER_CURSOR_PROMPT.md`](docs/prompts/DIAL_DEV_MANAGER_CURSOR_PROMPT.md) (current Build handoff — paste the PROMPT fence **inside** a Prime harness session, or expand `/dev-manager`). **Windows starter:** `scripts/start-dial-dev-manager-prime.ps1` (starts Cursor bridge if down → `prime-agent` with Cursor **Auto** + Dev Manager prompt). **Model routing:** Prime must use **Cursor models via the local bridge/proxy in Auto mode** (`defaultModel: auto` in `.prime/agent/settings.json`) — do not manually switch models for Dev Manager or subagents. **First Build duties (PRIORITY 0):** verify Node/pnpm install + green typecheck/test + lefthook + `origin`=`Vanguduza/dial`, then auto-push after commits (`lefthook` post-commit / `scripts/git-auto-push.*`) — ticket hygiene follows once env+push are green. **Workplan:** every Prime/Dev Manager session reads project-truth preflight first, then `docs/planning/DIAL_Build_Workplan_STATE.md` and auto-advances (`DIAL_Dev_Manager_Autonomous_Runbook.md` idle ban).

**Development orchestration (D-61):** **DIAL Dev Manager** (Blueprint §8 / §8.0) is the **managerial authority for the entire development process** — Plan→Build→Done throughout Build: ticket hygiene, **D-52** feature DoD, **responsive web UX** (§8.0.1), **living root docs** in the same PR (§8.0.2 — `README.md`, `CHANGELOG.md`, `ENHANCEMENTS.md`, `BUGS.md`; reject “docs later”), and train sequencing. vNext.1 feature/evidence registries override stale historical ticket sequencing when a slice is already accepted. **Prime Agent** is the mandatory session/runtime harness that hosts Dev Manager; Prime is **not** product/manager SoR and does not replace project truth.

**Living docs:** Keep root `README.md` / `CHANGELOG.md` / `ENHANCEMENTS.md` / `BUGS.md` current with meaningful landings. Keep `docs/project-truth/*` current whenever truth, gate or accepted evidence changes. **Responsive web:** desktop + mobile usability and applicable design-system/branch identity rules before Done on web tickets.

**v7-2 architecture draft:** `DIAL_Master_Development_and_Ecosystem_Architecture_v7-2.md` is **not** authoritative. Absorb only via classified evaluation **`DIAL_v7-2_Adjustment_Expansion_Evaluation.md`** → locked companion **`DIAL_v7_2_Adopted_Platform_Extensions.md` (D-53 platform extensions; D-54 Intelligence Factory + Command Centre metric contracts)** and current vNext.1 truth.

**D-48 AppSec (in-repo):** Threat Dragon models under `ThreatDragonModels/`; Semgrep (`semgrep.yml` + `semgrep/rules/`, CI `semgrep-dial` hard-fail); Checkov HIGH+ hard-fail; Renovate (`renovate.json`) with Dependabot alerts-only; Strix staging runbook `docs/security/strix-runbook.md` — never production. Always-on rule: `.cursor/rules/dial-security-toolchain.mdc`.

**D-55 external skills (in-repo):** thin `dial-diagram-editorial` + agency payments/evidence habits in money-path/tracer + anthropics skill anatomy / `dial-webapp-recon` — companion locked adopted; **no** full upstream tree vendors; **never** Anthropic ToS document-skill vendoring.

**D-56 plan-phase grill:** invoke `dial-grill-locks` in Plan before scaffold of money/WA/maps/AI/Catalogue Factory/Intelligence/new high-risk marketplace mechanics; `dial-ai-capability-review` before merge of `packages/ai`. Plan-phase artifacts remain under `docs/planning/`; current gates/evidence must come from `docs/project-truth/*`.

**D-57 Spare FX display:** catalogue/cart **USD only**; ZiG conversion only at checkout from ops **Daily ZiG rate**; WA EcoCash + COD via required checkout buttons — see current truth + v4 detail.

**D-61 AI Kernel / Prime Agent:** absorb only via **`DIAL_AI_Kernel_Prime_Agent_Adopted.md`** where not superseded — Dev Manager = Build managerial authority; Prime = harness; production multi-step = `packages/ai` capabilities + LiteLLM→Gemini + Temporal/BullMQ; no production agent host as parallel SoR.

**Current vNext.1 additions that older files may not contain:** key-late development; evidence/gate inheritance; FixItNow wholesale port; hybrid Tech sourcing with Opportunity Marketplace; free technician expression of interest at launch; explicit frontend anti-generic guardrails; repository-independent evidence preservation.

**Do not** reopen locked decisions: official WhatsApp only; MapLibre/approved OSS maps; AI never writes money; D-58 agency-only / no discarded D-51 owned-stock principal; informal→B2B visibility; dropping tech WHT; stub-as-MVP; v7 as SoR; second money/job/delivery/catalogue SoR; auto-publish checklist/AI without human+evaluation; Command Centre Simulated as live money control; unaudited FX; missing credentials as development blocker; repeating accepted thin slices due repo migration; generic cross-branch storefront skin; cheap FixItNow recreation instead of wholesale; or Opportunity Marketplace as a second post-award job/payment system.

Attribution detail: `.cursor/rules/SOURCES.md` and `DIAL_Cursor_Rules_and_Skills.md`.
