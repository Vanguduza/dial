# Cursor rules & skills — attribution

DIAL project rules under `.cursor/rules/` and skills under `.cursor/skills/` are **DIAL-authored**, tuned to v4 / Agent Pack locks.

Patterns inspired by (MIT unless noted; we did **not** vendor full upstream trees):

| Source | What we took | Licence |
| --- | --- | --- |
| [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) (**ECC**) | Concise always-on security + secrets fail-closed; audit → fix workflow shape for Cursor `.mdc` | MIT |
| [ruvnet/ruflo](https://github.com/ruvnet/ruflo) (**Ruflo** / “Ruflow”) | Named audit-then-fix skills; human-gated money & security reviews — not swarm/federation runtime | MIT |
| [vibestackdev/vibe-stack](https://github.com/vibestackdev/vibe-stack) | Supabase AuthN discipline (`getUser` vs session-only); Next API boundary reminders | MIT |
| [kinopeee/cursorrules](https://github.com/kinopeee/cursorrules) | Focused alwaysApply vs glob-scoped rules; keep rules short | MIT |
| [sanjeed5/awesome-cursor-rules-mdc](https://github.com/sanjeed5/awesome-cursor-rules-mdc) | Index of `.mdc` patterns (reference only) | CC0-1.0 |
| [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) | Community rule index (reference only) | CC0-1.0 |
| [thelazydeveloper.org](https://www.thelazydeveloper.org/) | Secrets radioactivity, IDOR, webhook/idempotency, ship-less-JS — see `DIAL_Lazy_Developer_Playbook_Adaptations.md` | Site guides |
| [aihero.dev](https://www.aihero.dev/) + [mattpocock/skills](https://github.com/mattpocock/skills) | Grill/tracer/AI-capability skill shapes; progressive disclosure for `AGENTS.md` — see `DIAL_AIHero_Adaptations.md` | MIT (skills repo); site patterns summarized |
| [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) | Editorial diagram type map → `dial-diagram-editorial` (no asset gallery vendor) — **D-55** | MIT |
| [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) | Payments idempotency / webhooks-as-truth / Reality Checker evidence → money-path + tracer — not full agent roster — **D-55** | MIT |
| [anthropics/skills](https://github.com/anthropics/skills) | Skill anatomy + Playwright recon → catalog standard + `dial-webapp-recon` — never document-skill trees — **D-55** | Apache-2.0 (examples); Anthropic ToS (docx/pdf/pptx/xlsx) |

**Not adopted as SoR:** Ruflo swarm/federation runtime, ECC full rule dump, AGPL logistics donors as code, Make.com as core automation, Evalite/Braintrust as primary eval harness, full mattpocock/skills / agency-agents / anthropics/skills / diagram-design asset tree vendor.

Full catalog: `DIAL_Cursor_Rules_and_Skills.md`. **D-47** locks this Cursor pack as the project agent config baseline. **D-48** AppSec tools (Threat Dragon, Semgrep CE, Checkov, Renovate, Strix) are documented in `DIAL_Security_Toolchain.md` and pointed from `dial-security-toolchain.mdc` — licences Apache-2.0 / LGPL-2.1 engine / AGPL bot as attributed there; custom Semgrep rules are project MIT. **D-55** locks selective external skills utilization via `DIAL_External_Skills_Repos_Utilization.md`.
