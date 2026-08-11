# DIAL ← The Lazy Developer — Playbook Adaptations

**Source studied:** [thelazydeveloper.org](https://www.thelazydeveloper.org/) (homepage, `/paths`, `/curriculum`, `/resources`, free guides, `/commands`, `/backup-script-info`) — research pass 2026-08-11.  
**Authority:** Companion only for architecture. Does **not** reopen locked decisions (C-5, D-38, Meili, MapLibre, D-42…D-46, official WhatsApp only, AI never writes money, FDMS virtual, etc.).  
**Where it plugs in:** Agent Pack §2.1, Blueprint §8.1, and **applied** Cursor artifacts below.  
**D-47:** **Locked** — Lazy Developer + Ruflo/ECC-inspired Cursor rules pack is the project agent config baseline (see v4 D-log).

---

## 0. How the site is organised (mapping)

| Named hub | Path / modules (from `/paths` + `/curriculum`) | Free guides that back it |
| --- | --- | --- |
| **AI Power User** | Advanced ~6h / 4 modules: Advanced Prompt Engineering; MCP; Using AI Agents; Building Custom Skills / agent production | Agent/MCP lessons (account curriculum); paste-ready agent rules in env-keys guide |
| **Lock It Down** | Intermediate ~6h / 3 modules: Security & Software Hardening; multi-env (dev→staging→prod); scaling/monitoring/performance | Form validation; Securing endpoints; Authorization & IDOR; Env vars & API keys; (soon: RLS, payments/webhooks, rate limits, headers/CORS) |
| **Supercharge with APIs & Integrations** | Intermediate ~5h / 3 modules: External automation workflows; Understanding APIs; Other add-ons & partners | Endpoint auth; cost/rate-limit lessons; Make.com-style workflow examples on site — **DIAL maps these to n8n/Temporal/BullMQ, not Make** |
| **Launch & Grow** | Intermediate ~4h / 2 modules: Budgeting & cost management; Marketing Your SaaS | SEO/AEO/GA4 guides; cost-audit lessons; launch-directory tactics |
| **Free developer resources** | `/resources` — paste-into-Cursor guides; `/commands`; backup script | Live + “soon” catalogue below |

Curriculum anti-thesis (site-wide): AI makes code that **works**; it does **not** reliably make code that is **safe**. Ship discipline = secrets, authz, cost, observability.

---

## 1. What the site teaches (by section)

### 1.1 AI Power User

**Principles**
- Treat the model as a junior developer: PRD/docs first, challenge outputs, small vertical slices, then expand.
- Context is a scarce resource: supporting docs, rules files, session continuity, and MCP beat one-off mega-prompts.
- Agents/skills encode **repeatable standards** (audit → report, then fix) rather than one-shot codegen.
- Never let agents print secrets; ignore `.env`; refer to vars by name.

**Checklists / habits**
- Project rules (`.cursorrules` / `AGENTS.md` / CLAUDE.md): non-negotiables always in context.
- `.cursorignore` for secrets and bulky generated trees.
- Prefer “audit-only” prompts first (site guides ship ready-made audit prompts for endpoints, IDOR, secrets).
- Custom skills for recurring DIAL work: RLS audit, money-path review, adapter stub completeness.

**Tools they push:** Cursor, Claude Code, Codex, MCP servers, custom Claude skills.  
**Anti-patterns:** vibe-only coding; pasting live keys into chat; generic “ask the AI anything” endpoints; trusting AI security claims without grepping routes.

### 1.2 Lock It Down

**Principles**
- Authenticated ≠ authorized (IDOR / BOLA is the #1 API flaw).
- “Internal” routes without a shared secret are public.
- Identity from verified session/JWT — never from body `userId` / `email` / `role`.
- Secrets vs publishable keys; `VITE_` / `NEXT_PUBLIC_` prefixes bake values into the browser.
- Fail closed if `INTERNAL_API_SECRET` (or equivalent) is unset.
- Defence in depth on forms: Zod client → XSS sanitize → Zod server → CORS allowlist.
- Environments: preview/staging before prod; feature flags + rollback; rate limits + queues; logs/metrics dashboard; cost kill-switches.

**Hardening checklist (site Security module + live guides)**
- AuthN + AuthZ on every mutating route; admin role checked in DB.
- Helmet/CORS/HTTPS; abuse rate-limiting; DB RLS; dependency supply-chain hygiene; edge/DNS (Cloudflare patterns); careful logging (no secrets/PII dump).
- Cache keys must include `userId` when content is user-scoped; authorize **before** cache read.

**Anti-patterns:** UI-only route guards; open webhook→email relays; sequential IDs without object checks; service-role key in client; committing `.env`.

### 1.3 Supercharge with APIs and integrations

**Principles**
- APIs multiply capability and **bill risk** — rate-limit, batch, and budget every external call.
- Prefer structured, validated payloads at every hop (Zod), including service-to-service.
- Automation workflows for ops glue (site demos Make.com); own API surface when others must read your data.
- Webhooks need signature verification + idempotency (site “Payments & Webhooks” guide still SOON — treat as expected gap).

**Anti-patterns:** unbounded LLM/API loops; scraping as a product dependency; trusting third-party “banks” (Apify/HF style) without cost ceilings; adopting a second money engine because an integration “had payments.”

### 1.4 Launch and grow

**Principles**
- Scenario-plan hosting/API cost before traffic; post-launch cost audit; daily health checks.
- Marketing: presence where users are, launch listings, affiliates — but product trust beats vanity launches.
- SEO/AEO: crawlable content, structured data, consent-aware analytics, Core Web Vitals, optional `llms.txt`.
- Ship less JS: landing must not download admin/dashboard; full route-level splitting + Suspense/error boundaries.

**Anti-patterns:** measuring success only by “deployed”; surprise bills from uncapped AI/SMS; SPA that Google/AI crawlers cannot see; GA loaded before consent.

### 1.5 Free developer resources (inventory)

**Live (paste-into-AI guides)**  
SEO How-To; SEO Crawlability; Structured Data; GA4 Next.js; AEO Foundations; Seeing What AI Actually Searches; Form Validation & Security; Securing Endpoints; Authorization & IDOR; Env Vars & API Keys; Browser-Aware Web Design; Ship Less JavaScript.

**Also free (non-guide)**  
`/commands` (git/node/docker/vercel/supabase/Cursor); `/backup-script-info` (rsync 3-2-1 + git); `/installation`, `/terminology`.

**Soon (track, don’t wait)**  
Technical AEO; Writing for citation; Measuring AI visibility; Database RLS & privilege escalation; Payments & Webhooks; Rate Limiting & Abuse; Pagination & scale traps; Dependencies & supply chain; Headers/CORS & data leakage; asset/N+1/cache/list/worker performance guides.

---

## 2. DIAL-specific adaptations

### Do

| Area | Adaptation | Status |
| --- | --- | --- |
| Agent habits | Keep Agent Pack §2 non-negotiables + audit prompts in Cursor rules; audit-then-fix for authz/money/webhook PRs | **Applied** — `.cursor/rules/`, skills, `docs/agent-audits/` |
| Secrets | `.cursorignore` + never-print rule; grep production bundles for `service_role` / PSP secrets | **Applied** — `.cursorignore`, `dial-security-idor.mdc`, `.env.example` |
| AuthZ | Central `assertResourceAccess` (or equivalent) for jobs, orders, vehicles, promo credits, delivery offers, courier locations — on top of RLS | **Spec applied** — Agent Pack Appendix A.1 + rule; impl lands in API trains |
| Internal APIs | n8n→API, BullMQ→HTTP, Temporal activities fail-closed shared secret or mTLS; webhooks verify Meta/PSP signatures | **Applied** — rules + T9 / Appendix A.1 AC |
| Forms / Zod | Align with Zod-on-AI-outputs: Zod-at-boundary for human forms and WhatsApp Flow payloads | Documented (P1 remaining in code) |
| Integrations | Map site “workflows” → **n8n** / **Temporal** / **BullMQ** — already locked | Locked (no change) |
| Launch metrics | Eng launch checklist as ops/devex beside Appendix C | **Applied** — T9 + admin cost/health note |
| Marketing sites | Route split; admin-web never in customer entry chunk | **Applied** — `dial-web-bundles.mdc` |
| Backup | Git remotes + DB restore drill (T9); exclude `.env` from insecure mirrors | Documented in Pack T9 |

### Don’t

| Temptation from site | DIAL rule |
| --- | --- |
| Make.com / generic Zapier as core | Use **n8n** + Temporal/BullMQ |
| Baileys / unofficial WhatsApp | **Official Cloud API only** (D-40) |
| Supabase-as-entire-backend demo patterns that blur SoR | DIAL ledger + packages remain SoR; Supabase = Postgres/Auth/Realtime |
| Lovable/Bolt/Replit as production path | Fine for spikes; production = monorepo per v4 |
| Google Maps as SoR / Mapbox distance | **MapLibre + OSRM/VROOM** (D-44) |
| Second commerce/money engine from an “API bank” | Meili search, `@dial/promotions` patterns only (D-38/D-42) |
| AI agent that posts refunds/prices | **AI never writes money**; human + pricing engine |
| Expo/RN shortcut for “ship faster” | **C-5** native apps |
| GA4 without consent on ZW traffic | Align with POTRAZ/privacy; prefer PostHog already in §5.16 with consent |

---

## 3. Gap table (site idea → already in DIAL? → change)

| Site idea | Already in DIAL? | Change | Pri | Applied? |
| --- | --- | --- | --- | --- |
| `.cursorrules` / agent ignore for secrets | Was partial | `.cursor/rules` + `.cursorignore` | P0 | **Yes** |
| Audit-only prompts | Was missing | `docs/agent-audits/` + dial-* skills | P0 | **Yes** |
| Object-level authz helper + IDOR tests | RLS matrix existed | Appendix A.1 + security rule | P0 | **Spec yes** (CI tests at T9) |
| Fail-closed internal secret | Thin | `INTERNAL_API_SECRET` in env catalog + rules | P0 | **Yes** |
| Never trust body identity | Implied | Pack §2 + `dial-security-idor.mdc` | P0 | **Yes** |
| Publishable vs secret key classification | Under-documented | Pack §6 classification + `.env.example` | P0 | **Yes** |
| Webhook signature + idempotency | Discipline thin | Appendix A.1 AC | P1 | **Yes (AC)** |
| Cost audit / health dashboard | Thin | Admin §9.5 cost/health note | P1 | **Yes (called out)** |
| Ship less JS / route splitting | Not called out | `dial-web-bundles.mdc` | P1 | **Yes** |
| Custom Cursor skills | Missing | `.cursor/skills/dial-*` | P2 | **Yes** |
| Make.com / Apify add-ons | Conflicts | **Reject** | — | N/A |

---

## 4. Prioritized backlog

### P0 — ERP / security / agent — **artifacts applied as Cursor pack (D-47)**

1. ~~Cursor rules pack~~ → `.cursor/rules/*.mdc`, `.cursorignore`, `AGENTS.md`  
2. AuthZ helper + IDOR CI → **spec in Appendix A.1**; implement during API trains  
3. ~~Internal/side-effect route audit~~ → rules + AC  
4. ~~Env classification~~ → Pack §6 + `.env.example`  
5. ~~Webhook verify + idempotency AC~~ → Appendix A.1  

### P1 — Ops / API discipline / launch engineering (docs noted; code follows trains)

6. Security headers + CORS allowlists per web app.  
7. HTTP abuse rate limits (auth, search proxy, WA).  
8. Form/Flow Zod server re-validation standard.  
9. Cost & health dashboard (AI + cloud + messaging) — **called out in admin-web §9.5**.  
10. Customer web route-level code splitting — **rule applied**.  
11. Feature-flag write-up for Projects client toggle and risky promos.

### P2 — DevEx / growth hygiene

12. ~~Agent audit prompt library + Cursor skills~~ → applied  
13. Marketing SEO/AEO checklist (Spare/Tech public pages only).  
14. Optional MCP for schema exploration in Cursor.  
15. Off-box code backup habit (git + optional rsync); DB restore drill remains canonical.

---

## 5. Concrete paste targets (for agents)

Prompts live in-repo (prefer these files over pasting from memory):

- `docs/agent-audits/secrets-audit.md`
- `docs/agent-audits/endpoint-audit.md`
- `docs/agent-audits/idor-audit.md`

---

## 6. Document updates / applied artifacts (this pass)

| Artifact | Path | Status |
| --- | --- | --- |
| Catalog | `DIAL_Cursor_Rules_and_Skills.md` | **Applied** |
| Cursor ignore | `.cursorignore` | **Applied** |
| Rules (8) | `.cursor/rules/dial-*.mdc` (+ `SOURCES.md`) | **Applied** |
| Attribution | `.cursor/rules/SOURCES.md` | **Applied** |
| Skills (3) | `.cursor/skills/dial-money-path-review`, `dial-rls-idor-audit`, `dial-psp-adapter-completeness` | **Applied** |
| Audit prompts | `docs/agent-audits/*` | **Applied** |
| Agent entry | `AGENTS.md` | **Applied** |
| Env starter | `.env.example` | **Applied** |
| Agent Pack | `DIAL_Development_Agent_Pack.md` — §2.1, §6.0, T9, Appendix A.1 | **Updated** |
| Blueprint | `DIAL_Build_Blueprint_and_Cursor_Prompt.md` §8.1 + Cursor prompt | **Updated** |
| Checklist library | One-line ERP auth → v4/Pack/D-47 | **Updated** |
| v4 D-log / Part 9 | `DIAL_Consolidated_Plan_v4.md` — **D-46/D-47** + companions | **Updated** |
| Stitch / WA / Promotions | Cross-link D-47 only (no duplicate walls) | **Updated** |
| This file | Applied map + D-47 | **Updated** |

### GitHub sources used (patterns only; MIT preferred)

| Identified as | Repo | What we adopted |
| --- | --- | --- |
| **ECC** | [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) (MIT) | Concise security/secrets + audit→fix workflow shape for Cursor rules |
| **Ruflo** (aka Claude Flow / “Ruflow”) | [ruvnet/ruflo](https://github.com/ruvnet/ruflo) (MIT) | Named audit workflow skills; human-gated money/security reviews — **not** full swarm install |
| Reference | [kinopeee/cursorrules](https://github.com/kinopeee/cursorrules) (MIT), [sanjeed5/awesome-cursor-rules-mdc](https://github.com/sanjeed5/awesome-cursor-rules-mdc) (CC0), [vibestackdev/vibe-stack](https://github.com/vibestackdev/vibe-stack) (MIT) | alwaysApply vs glob; Supabase AuthN reminders; indexes only |

---

## 7. Source index (URLs)

- https://www.thelazydeveloper.org/  
- https://www.thelazydeveloper.org/paths  
- https://www.thelazydeveloper.org/curriculum  
- https://www.thelazydeveloper.org/resources  
- Guides: `/form-validation-guide`, `/securing-endpoints-guide`, `/authorization-idor-guide`, `/env-vars-api-keys-guide`, `/ship-less-javascript-guide`, `/seo-how-to-guide`, `/seo-crawlability-guide`, `/structured-data-guide`, `/ga4-nextjs-guide`, `/aeo-foundations-guide`, `/inspect-ai-search-guide`, `/browser-aware-web-design-guide`  
- https://www.thelazydeveloper.org/commands  
- https://www.thelazydeveloper.org/backup-script-info  
- https://github.com/affaan-m/everything-claude-code  
- https://github.com/ruvnet/ruflo  

---

*End of Lazy Developer playbook adaptations — companion to v4 / Agent Pack / Blueprint. **D-47** locks the Cursor pack; does not alter other architecture locks.*
