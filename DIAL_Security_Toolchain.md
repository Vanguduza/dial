# DIAL Security Toolchain (D-48)

**Companion to** `DIAL_Consolidated_Plan_v4.md` (locked **D-48**).  
**Does not** replace money SoR, RLS/IDOR acceptance (D-47), Promptfoo/Langfuse, Appendix C compliance gates, or Lazy Developer hygiene.

**Authority:** v4 → Agent Pack → this companion for AppSec *tool* choices. Cursor rules / dial-* skills remain the agent AuthZ/money audit path.

---

## 1. Verdict summary

| Tool | Verdict | Mode for DIAL | Licence (attribute) |
| --- | --- | --- | --- |
| **OWASP Threat Dragon** | **Adopt** | Self-host desktop and/or Docker web; models in-repo | Apache-2.0 — [OWASP/threat-dragon](https://github.com/OWASP/threat-dragon) |
| **Semgrep CE** | **Adopt** | In-CI / local CLI (no AppSec Platform required) | Engine **LGPL-2.1**; registry rules **Semgrep Rules License v1.0** — verify `metadata.license` per rule |
| **Checkov** | **Adopt** | In-CI / Docker CLI | Apache-2.0 — [bridgecrewio/checkov](https://github.com/bridgecrewio/checkov) |
| **Renovate** | **Adopt (primary dep updater)** | Prefer Mend GitHub App *or* self-hosted CE / scheduled Action; `renovate.json` in-repo | Bot **AGPL-3.0** — using it does **not** AGPL DIAL product code ([upstream clarification](https://github.com/renovatebot/renovate/discussions/20994)) |
| **Dependabot** | **Secondary only** | Keep GitHub **security advisories**; **disable** Dependabot *version* updates if Renovate owns PRs | GitHub-native (no separate OSS licence for the bot) |
| **Strix** (`usestrix/strix`) | **Adopt (pre-prod / scheduled)** | Self-host CLI + Docker sandboxes; **not** every-PR hard gate at scaffold | Apache-2.0 — [usestrix/strix](https://github.com/usestrix/strix) |

**D-48:** Yes — recommendations are clear enough to lock (see v4 D-log).

---

## 2. Tool matrix (adopt / self-host / SaaS / reject)

| Tool | Adopt? | Self-host / in-CI | SaaS optional | Reject / defer |
| --- | --- | --- | --- | --- |
| Threat Dragon | Yes | Desktop installers; Docker web image | None required | Do not treat hosted demos as SoR; do not invent a second threat-model product |
| Semgrep CE | Yes | `semgrep scan` in GHA; offline-friendly once rules cached | Semgrep AppSec Platform / Code / Secrets / Supply Chain — **optional later**; avoid lock-in for MVP | Do not rely on **Semgrep Secrets** (commercial) as the only secret gate — keep bundle-grep + CI secret patterns |
| Checkov | Yes | `bridgecrew/checkov` Docker or pip in GHA | Prisma Cloud Bridgecrew SaaS — **not required** | Do not replace DIAL IaC reviews with a second policy engine without need |
| Renovate | Yes (primary) | Self-host CE **or** run via GitHub Action on schedule; config in-repo | Mend Renovate GitHub App (free tier for many orgs) OK | Dual *version* bots with Dependabot — reject |
| Dependabot version updates | No (as primary) | N/A | Built into GitHub | Use only if Renovate abandoned; otherwise alerts-only |
| Strix (usestrix) | Yes (gated) | Local/VPS Docker + BYOK LLM; CI non-interactive on **staging** | app.strix.ai — optional; prefer self-host for ZW/offline and secret locality | See §6 rejects |
| Baileys / unofficial WA clients | — | — | — | **Already rejected** (D-40 / non-negotiables) |
| Parallel AppSec “platform” replacing dial-* / Promptfoo | — | — | — | **Reject** — tools compose; DIAL remains SoR |

### ZW / offline friendliness

| Tool | Offline / low-connectivity notes |
| --- | --- |
| Threat Dragon | Desktop + local JSON — excellent offline |
| Semgrep CE | Needs rule download first time; pin rules/version in CI cache for flaky links |
| Checkov | Docker image pull once; then local scans |
| Renovate | Needs registry/GitHub API access to propose updates; schedule off-peak |
| Strix | Needs LLM API (or local model later); Docker sandboxes; **never** point at production money rails |

---

## 3. Phase map (planning → deploy)

```text
Planning          Coding / PR          IaC / compose       Dependencies
─────────         ────────────         ───────────         ────────────
Threat Dragon  →  Semgrep CE        →  Checkov          →  Renovate
(+ docs models)   (+ custom DIAL         (Dockerfile,         (npm/pnpm,
                   rules for AuthZ)       compose, TF/K8s,     Gradle, SPM,
                                          GHA workflows)       Actions, Docker)

Pre-prod / DAST-ish                 Deploy gates
───────────────────                 ────────────
Strix (staging only,               Semgrep dial + Checkov HIGH+ green
 scheduled / release train)        Renovate PRs reviewed
 + D-47 IDOR/RLS CI                Promptfoo AI evals (locked)
 + webhook/FDMS/PSP signature      Bundle secret grep (D-47)
   + idempotency tests             Appendix C / §8.1 compliance
 + Langfuse cost/trace hygiene       (not replaced by scanners)
```

| Phase | Tool | DIAL artefacts / gates |
| --- | --- | --- |
| **Planning** | Threat Dragon | STRIDE models for Job Reserve, Spare/Tech/Delivery, WA Flows, FDMS, RLS/IDOR |
| **Coding** | Semgrep CE | Custom `dial.*` hard-fail + community packs advisory until baseline |
| **IaC** | Checkov | Repo root; hard-fail HIGH/CRITICAL; LOW/MEDIUM soft |
| **Deps** | Renovate | Monorepo workspaces + Android Gradle + iOS SPM + Actions + Docker base images |
| **Pre-prod** | Strix | Authorized staging only — `docs/security/strix-runbook.md` |
| **Deploy** | CI gates | Fail on dial Semgrep + Checkov HIGH+; money/webhook trains require Appendix A.1 |

---

## 4. Per-tool notes (fit for DIAL stack)

### 4.1 OWASP Threat Dragon

- **What:** Threat-model diagrams + mitigations (STRIDE / LINDDUN / etc.).
- **Fit:** Planning for TypeScript/Supabase/Temporal/Android ERP — document trust boundaries (client → API → Postgres RLS → Temporal/n8n → PSP/FDMS/Meta).
- **In-repo storage:**
  - **Canonical human index:** `docs/threat-models/README.md`
  - **TD-native path:** `ThreatDragonModels/<model-name>/<title>.json`
  - **Open:** Desktop File→Open, or Docker `owasp/threat-dragon` on :8080 — see `ThreatDragonModels/README.md`
- **CI:** Optional JSON presence only — not a merge blocker.
- **Cost:** Free (OSS).

### 4.2 Semgrep (Community Edition)

- **Configs:** `semgrep.yml` + `semgrep/rules/` (`dial.no-body-identity`, `dial.no-client-secrets`, `dial.webhook-missing-signature-verify`, `dial.no-unofficial-whatsapp`, `dial.no-raw-sql-concat`).
- **CI:** Job `semgrep-dial` **hard-fails**; `semgrep-community` advisory (`continue-on-error`) until baseline.
- **Secrets:** Prefer CE + D-47 bundle-grep; Semgrep Secrets commercial optional later.
- **Cost:** CE free in CI.

### 4.3 Checkov

- **CI:** `hard_fail_on: HIGH,CRITICAL` + `soft_fail_on: LOW,MEDIUM`; `soft_fail: false`.
- **Paths:** Scan `.` with frameworks `dockerfile,docker_compose,github_actions,kubernetes,terraform` — missing apps/compose do not invent a fake green beyond “nothing to fail”.
- **Cost:** OSS free.

### 4.4 Renovate vs Dependabot — **primary = Renovate**

| Criterion | Renovate | Dependabot |
| --- | --- | --- |
| TS monorepo / workspaces | Strong | Weaker |
| Android Gradle / iOS SPM | Yes | Yes |
| Docker / Actions | Yes | Yes |
| Grouped PRs / schedule | Excellent | Noisier |
| Security alerts | Via PRs + advisories when configured | **Native GH alerts** — keep |

**Recommendation:** Renovate owns version bumps (`renovate.json`); Dependabot `updates: []` (alerts-only via GitHub UI).

### 4.5 Strix — identity and rejects

**Adopted:** [usestrix/strix](https://github.com/usestrix/strix) — autonomous AI pentest agents (Apache-2.0), BYOK LLM, `-n` non-interactive.

**Runbook:** `docs/security/strix-runbook.md`. Workflow fails closed if `STRIX_LLM` / `LLM_API_KEY` missing; live scan gated on `STRIX_ENABLED=true`.

**Rejects:** deprecated strixproject→Atlas lineage; name collisions; treating Strix Cloud as mandatory SoR; replacing dial-rls-idor-audit with Strix alone.

---

## 5. Relation to locked DIAL items

| Locked item | How toolchain relates |
| --- | --- |
| **D-47** Cursor rules, dial-* skills | Semgrep/Checkov are CI siblings — not a substitute for object-level AuthZ reviews |
| **RLS + IDOR CI** | Remain mandatory |
| **Promptfoo / Langfuse** | Unchanged |
| **Appendix C / §8.1** | Scanners do not clear escrow/FDMS/POTRAZ |
| **No Baileys** | Semgrep `dial.no-unofficial-whatsapp` + Threat Dragon WA model |
| **Money SoR** | Unchanged |

---

## 6. Threat-model artefact layout

```text
ThreatDragonModels/
  job-reserve/JobReservePaymentsWebhooks.json
  spare-checkout/SpareOrderCheckout.json
  tech-dispatch/TechDispatch.json
  delivery-dispatch/DeliveryDispatch.json
  whatsapp-flows/WhatsAppFlowsDataExchange.json
  fdms-outbox/FdmsOutbox.json
  rls-idor/RlsIdorAuthZ.json
docs/threat-models/README.md
docs/security/
  README.md
  strix-runbook.md
```

Review cadence: update models when adding payment methods, webhook providers, or delivery/Temporal workflows.

---

## 7. CI jobs (GitHub Actions)

| Job | Trigger | Gate |
| --- | --- | --- |
| `semgrep-dial` | PR + main | **Hard-fail** on `dial.*` ERROR findings |
| `semgrep-community` | PR + main | Advisory until baseline (`continue-on-error`) |
| `checkov` | PR (IaC paths) + main | **Hard-fail** HIGH/CRITICAL |
| `strix-staging` | `workflow_dispatch` | Fail if secrets/`STRIX_ENABLED` missing; scan when enabled |
| `renovate` | Mend App / schedule | PRs, not a fail job |

---

## 8. Env / secrets notes

| Variable / secret | Used by | Notes |
| --- | --- | --- |
| None for Threat Dragon desktop | — | Local files only |
| `GITHUB_TOKEN` / Renovate GitHub App | Renovate | Least privilege; no service_role |
| Semgrep token | **Only if** using Platform | Prefer CE without token |
| `STRIX_LLM` / `LLM_API_KEY` | Strix | Staging runners only; never production PSP/FDMS keys |
| `STRIX_ENABLED` | Actions variable | Must be `true` to run live Strix install/scan |
| Checkov / Prisma API key | Optional SaaS | Omit for OSS mode |

No new `NEXT_PUBLIC_` / `VITE_` secrets. Do not print `.env*`.

---

## 9. Licence attribution (quick list)

| Component | Licence |
| --- | --- |
| OWASP Threat Dragon | Apache-2.0 |
| Semgrep engine (CE) | LGPL-2.1 |
| Semgrep community rules | Semgrep Rules License v1.0 (check per-rule `license`) |
| DIAL custom Semgrep rules | MIT (project) |
| Checkov | Apache-2.0 |
| Renovate | AGPL-3.0 (bot); DIAL code licence unaffected |
| Strix (usestrix/strix) | Apache-2.0 |

---

## 10. Operationalization status

| Item | Status |
| --- | --- |
| Threat Dragon models under `ThreatDragonModels/` + index | **Done** (starter STRIDE for critical surfaces) |
| Semgrep custom `dial.*` rules + split CI jobs | **Done** (`semgrep-dial` hard-fail; community advisory) |
| Checkov hard-fail HIGH/CRITICAL | **Done** |
| Renovate primary + Dependabot alerts-only | **Done** (`renovate.json`, `dependabot.yml` empty updates) |
| Strix runbook | **Done** (`docs/security/strix-runbook.md`) |
| Cursor catalog + `dial-security-toolchain.mdc` | **Done** |
| Expand Threat Dragon mitigations to closed/accepted | TODO (product reviews, not tooling) |
| Flip `semgrep-community` to hard-fail | TODO after first clean baseline on main |
| Live Strix against real staging | **Blocked externally** — needs staging URL, BYOK `LLM_API_KEY`/`STRIX_LLM`, set `STRIX_ENABLED=true` |
| Mend Renovate GitHub App install on org | **External** — config in-repo; App/token is org setup |

---

*End of DIAL Security Toolchain companion — locked by **D-48**. Does not reopen C-5 / D-38…D-47.*
