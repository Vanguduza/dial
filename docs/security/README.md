# DIAL security docs index (D-48)

Canonical companion: **[`DIAL_Security_Toolchain.md`](../../DIAL_Security_Toolchain.md)** (locked by v4 **D-48**).

## Stack (short)

| Phase | Tool | Artefacts |
| --- | --- | --- |
| Planning | OWASP Threat Dragon | `ThreatDragonModels/` + [`docs/threat-models/`](../threat-models/) |
| Coding | Semgrep CE | `semgrep.yml`, `semgrep/rules/`, [`.github/workflows/semgrep.yml`](../../.github/workflows/semgrep.yml) |
| IaC | Checkov | [`.github/workflows/checkov.yml`](../../.github/workflows/checkov.yml) — hard-fail HIGH/CRITICAL |
| Dependencies | Renovate | `renovate.json` — Dependabot version PRs off ([`.github/dependabot.yml`](../../.github/dependabot.yml)) |
| Pre-prod | Strix | [`strix-runbook.md`](./strix-runbook.md) + [`.github/workflows/strix-staging.yml`](../../.github/workflows/strix-staging.yml) |
| Restore | Ops drill stub | [`restore-drill.md`](./restore-drill.md) (T9) |

## CI gate summary

| Job | Behaviour |
| --- | --- |
| `semgrep-dial` | **Hard-fail** on custom `dial.*` rules |
| `semgrep-community` | Advisory (`continue-on-error`) until baseline |
| `checkov` | **Hard-fail** on HIGH/CRITICAL; LOW/MEDIUM soft |
| `strix-staging` | Manual; **fails** if secrets/`STRIX_ENABLED` missing — never silent green stub |

## Does not replace

- D-47 AuthZ / IDOR / webhook acceptance (`DIAL_Development_Agent_Pack.md` Appendix A.1)
- Promptfoo / Langfuse
- Appendix C / §8.1 compliance gates
- DIAL money SoR

## Licences (attribute)

Threat Dragon Apache-2.0 · Semgrep CE LGPL-2.1 · Checkov Apache-2.0 · Renovate AGPL-3.0 (bot) · Strix Apache-2.0
